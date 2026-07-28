package com.travel.marketplace.modules.ai.flight.service;

import com.travel.marketplace.modules.ai.assistant.dto.AssistantRequest;
import com.travel.marketplace.modules.ai.assistant.dto.AssistantResponse;
import com.travel.marketplace.modules.ai.assistant.service.AssistantServiceImpl.AssistantIntent;
import com.travel.marketplace.modules.ai.flight.dto.*;
import com.travel.marketplace.modules.ai.flight.provider.FlightProvider;
import com.travel.marketplace.modules.ai.provider.AiProvider;
import com.travel.marketplace.modules.ai.provider.AiRequest;
import com.travel.marketplace.modules.ai.provider.AiResponse;
import com.travel.marketplace.modules.ai.prompt.PromptTemplateRegistry;
import com.travel.marketplace.modules.ai.assistant.service.StructuredAssistantResponseParser;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FlightAssistantService {

    private final FlightProvider flightProvider;
    private final FlightSearchEntitlementService entitlementService;
    private final FlightRankingService rankingService;
    private final com.travel.marketplace.modules.ai.flight.util.AirportResolver airportResolver;
    private final AiProvider aiProvider;
    private final PromptTemplateRegistry promptRegistry;
    private final StructuredAssistantResponseParser responseParser;

    public AssistantResponse handleFlightIntent(AssistantRequest request, AssistantIntent intent, Map<String, Object> context) {
        String message = request.getMessage() != null ? request.getMessage() : "";
        Long userId = request.getAuthenticatedUserId();
        
        FlightSearchEntitlementService.FlightSearchEntitlement entitlement = entitlementService.getEntitlement(userId);
        
        log.debug("Extracted Membership Search Window: {} days", entitlement.maxSearchDays());
        
        JsonNode extracted = extractFlightContext(message, (String) context.get("destination"));
        String depCity = extracted != null && extracted.hasNonNull("departure_city") ? extracted.get("departure_city").asText() : null;
        String arrCity = extracted != null && extracted.hasNonNull("arrival_city") ? extracted.get("arrival_city").asText() : (String) context.get("destination");
        
        log.debug("Detected Intent: {}", intent);
        log.debug("Extracted Departure: {}", depCity);
        log.debug("Extracted Arrival: {}", arrCity);
        
        String language = (String) context.get("language");
        if (language == null) language = "en";

        com.travel.marketplace.modules.ai.flight.util.AirportResolver.ResolveResult depResult = airportResolver.resolve(depCity);
        com.travel.marketplace.modules.ai.flight.util.AirportResolver.ResolveResult arrResult = airportResolver.resolve(arrCity);
        
        if (depResult == null && arrResult == null) {
            return buildClarificationResponse(intent, language, "departure and arrival cities", "Where are you flying from and to?");
        } else if (depResult == null) {
            return buildClarificationResponse(intent, language, "departure city (from where)", "Where are you flying from?");
        } else if (arrResult == null) {
            return buildClarificationResponse(intent, language, "arrival city (to where)", "Where are you flying to?");
        }

        String depCode = depResult.airportCode();
        String arrCode = arrResult.airportCode();

        log.debug("Normalized City: {} -> Airport Code: {}", depCity, depCode);
        log.debug("Normalized City: {} -> Airport Code: {}", arrCity, arrCode);

        String nearestMessage = null;
        if (depResult.isNearest()) {
            nearestMessage = String.format("I'll search flights from the nearest airport (%s), since %s does not currently have a commercial airport.", depResult.nearestAirportName(), depResult.originalRequestedCity());
            log.debug("Nearest airport used for departure: {}", depResult.nearestAirportName());
        } else if (arrResult.isNearest()) {
            nearestMessage = String.format("I'll search flights to the nearest airport (%s), since %s does not currently have a commercial airport.", arrResult.nearestAirportName(), arrResult.originalRequestedCity());
            log.debug("Nearest airport used for arrival: {}", arrResult.nearestAirportName());
        }

        AssistantResponse resp;
        if (intent == AssistantIntent.FLIGHT_SEARCH || (extracted != null && extracted.hasNonNull("flexible_date_window"))) {
            resp = handleFlexibleSearch(request, depCode, arrCode, entitlement, extracted, language);
        } else {
            resp = handleExactSearch(request, depCode, arrCode, extracted, language);
        }
        
        if (nearestMessage != null && (resp.getType().equals(AssistantResponse.AssistantResponseType.FLIGHT_RECOMMENDATIONS.name()) || resp.getType().equals(AssistantResponse.AssistantResponseType.FLIGHT_DATE_RECOMMENDATIONS.name()))) {
            String localizedNearest = generateAiMessage(language, "User asked for flights from " + depCity + " to " + arrCity + ". I used nearest airports: " + nearestMessage, "Explain that we used nearest airports because their city doesn't have one.");
            resp.setMessage(localizedNearest + "\n\n" + resp.getMessage());
        }
        
        return resp;
    }

    private JsonNode extractFlightContext(String message, String contextDest) {
        Map<String, Object> vars = new HashMap<>();
        vars.put("currentDate", LocalDate.now().toString());
        vars.put("contextDestination", contextDest != null ? contextDest : "");
        vars.put("naturalLanguageQuery", message);
        
        String promptText = promptRegistry.render("flight_extraction", vars);
        AiResponse aiResponse = aiProvider.complete(AiRequest.builder()
                .prompt(promptText)
                .temperature(0.1)
                .build());
                
        return responseParser.parseObject(aiResponse.getText()).orElse(null);
    }
    
    private String generateAiMessage(String language, String context, String instruction) {
        String prompt = "You are a helpful travel assistant.\n" +
            "Context: " + context + "\n" +
            "Instruction: " + instruction + "\n" +
            "You MUST respond ONLY in the user's language: " + language + ".\n" +
            "Provide just the short helpful response sentence, without quotes or extra formatting.";
        try {
            return aiProvider.complete(AiRequest.builder().prompt(prompt).temperature(0.3).maxTokens(100).build()).getText().trim();
        } catch (Exception e) {
            log.error("Error generating AI message", e);
            return null;
        }
    }

    private AssistantResponse handleFlexibleSearch(AssistantRequest request, String depCode, String arrCode, FlightSearchEntitlementService.FlightSearchEntitlement entitlement, JsonNode extracted, String language) {
        int durationDays = 3;
        if (extracted != null && extracted.hasNonNull("flexible_date_window")) {
            durationDays = extracted.get("flexible_date_window").asInt(3);
        }
        
        LocalDate searchEnd = LocalDate.now().plusDays(entitlement.maxSearchDays());
        
        log.debug("Extracted Date Window: {} days", durationDays);
        if (extracted != null && extracted.hasNonNull("budget")) {
            log.debug("Extracted Budget: {}", extracted.get("budget").asText());
        }

        FlightFlexibleSearchQuery query = FlightFlexibleSearchQuery.builder()
                .departureAirportCode(depCode)
                .arrivalAirportCode(arrCode)
                .searchWindowStart(LocalDate.now().plusDays(1))
                .searchWindowEnd(searchEnd)
                .tripDurationDays(durationDays)
                .passengers(1)
                .currency("VND")
                .language(language)
                .build();
                
        log.debug("SerpAPI Request: {}", query);
        FlightDealSearchResult result = flightProvider.searchDeals(query);
        log.debug("SerpAPI Deals Count: {}", result.getDeals() != null ? result.getDeals().size() : 0);
        List<FlightDealCandidate> ranked = rankingService.rankDeals(result.getDeals(), null);
        
        List<AssistantResponse.FlightDealRecommendation> dtos = ranked.stream().limit(5).map(deal -> 
            AssistantResponse.FlightDealRecommendation.builder()
                .departureDate(deal.getDepartureDate())
                .returnDate(deal.getReturnDate())
                .price(deal.getPrice())
                .currency(deal.getCurrency())
                .airlineName(deal.getAirlineName())
                .airlineLogo(deal.getAirlineLogo())
                .durationText(deal.getDurationText())
                .routeText(deal.getRouteText())
                .rankText("GREAT_DEAL")
                .bookingUrl(deal.getBookingUrl())
                .build()
        ).collect(Collectors.toList());
        
        if (dtos.isEmpty()) {
            return buildNoResultsResponse(AssistantIntent.FLIGHT_SEARCH, language);
        }

        log.debug("Mapped Flight Count: {}", dtos.size());
        
        String generatedMsg = generateAiMessage(language, "Found flexible flight deals based on membership limits.", "Give a short intro message for showing flexible flight deals.");
        
        AssistantResponse finalResp = AssistantResponse.builder()
                .type(AssistantResponse.AssistantResponseType.FLIGHT_DATE_RECOMMENDATIONS.name())
                .intent(AssistantIntent.FLIGHT_SEARCH.name())
                .message(generatedMsg)
                .reply(generatedMsg)
                .dateRecommendations(dtos)
                .membership(new AssistantResponse.FlightMembership(entitlement.tierName(), entitlement.maxSearchDays(), "UPGRADE_FOR_MORE"))
                .build();
                
        log.debug("Final Structured Response: {}", finalResp.getType());
        return finalResp;
    }

    private AssistantResponse handleExactSearch(AssistantRequest request, String depCode, String arrCode, JsonNode extracted, String language) {
        LocalDate depDate = LocalDate.now().plusDays(14);
        LocalDate retDate = null;
        if (extracted != null && extracted.hasNonNull("departure_date")) {
            try { depDate = LocalDate.parse(extracted.get("departure_date").asText()); } catch (Exception ignored) {}
        }
        if (extracted != null && extracted.hasNonNull("return_date")) {
            try { retDate = LocalDate.parse(extracted.get("return_date").asText()); } catch (Exception ignored) {}
        }
        
        String tripType = extracted != null && extracted.hasNonNull("trip_type") ? extracted.get("trip_type").asText() : "ONE_WAY";
        LocalDate requestedStartDate = depDate;
        LocalDate requestedEndDate = depDate;
        
        if ("ONE_WAY".equalsIgnoreCase(tripType) && retDate != null) {
            // It's a one-way search with a date window
            requestedEndDate = retDate;
            retDate = null; // Clear returnDate so SerpAPI does a one-way search
        }
        
        log.debug("Extracted Date Window: {} to {}", requestedStartDate, requestedEndDate);
        if (extracted != null && extracted.hasNonNull("budget")) {
            log.debug("Extracted Budget: {}", extracted.get("budget").asText());
        }

        FlightSearchQuery query = FlightSearchQuery.builder()
                .departureAirportCode(depCode)
                .arrivalAirportCode(arrCode)
                .departureDate(depDate)
                .returnDate(retDate)
                .passengers(1)
                .currency("VND")
                .language(language)
                .build();
                
        log.debug("SerpAPI Request: {}", query);
        FlightSearchResult result = flightProvider.searchFlights(query);
        log.debug("SerpAPI Deals Count: {}", result.getBestFlights() != null ? result.getBestFlights().size() : 0);
        
        // Strict Date Filtering
        final LocalDate start = requestedStartDate;
        final LocalDate end = requestedEndDate;
        List<FlightOffer> bestFlights = result.getBestFlights() != null ? result.getBestFlights() : new ArrayList<>();
        List<FlightOffer> filteredFlights = bestFlights.stream().filter(f -> {
            if (f.getDepartureTime() == null) return false;
            try {
                LocalDate flightDate = LocalDate.parse(f.getDepartureTime().split("T| ")[0]);
                return !flightDate.isBefore(start) && !flightDate.isAfter(end);
            } catch (Exception e) {
                return false;
            }
        }).toList();

        // Smart Fallback if no flights match the requested window but some flights exist
        if (filteredFlights.isEmpty() && !bestFlights.isEmpty()) {
            LocalDate closestDate = null;
            long minDiff = Long.MAX_VALUE;
            for (FlightOffer f : bestFlights) {
                try {
                    LocalDate fd = LocalDate.parse(f.getDepartureTime().split("T| ")[0]);
                    long diff = Math.min(Math.abs(ChronoUnit.DAYS.between(fd, start)), Math.abs(ChronoUnit.DAYS.between(fd, end)));
                    if (diff < minDiff) {
                        minDiff = diff;
                        closestDate = fd;
                    }
                } catch (Exception ignored) {}
            }
            
            if (closestDate != null) {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("d/M");
                String startStr = start.format(formatter);
                String endStr = end.format(formatter);
                String closestStr = closestDate.format(formatter);
                
                String dateRangeStr = start.equals(end) ? "ngày " + startStr : "khoảng từ " + startStr + " đến " + endStr;
                String dateRangeStrEn = start.equals(end) ? startStr : startStr + " to " + endStr;
                
                String msgVi = "Không tìm thấy chuyến bay " + dateRangeStr + ". Mình có tìm thấy chuyến gần nhất vào ngày " + closestStr + ". Bạn có muốn mở rộng khoảng thời gian không?";
                String msgEn = "No flights found for " + dateRangeStrEn + ". The closest available flight is on " + closestStr + ". Would you like to expand your dates?";
                
                String fallback = "vi".equalsIgnoreCase(language) ? msgVi : msgEn;
                String generatedMsg = generateAiMessage(language, "No flights exactly in range. Closest is " + closestStr, "Inform the user no flights were found for their requested dates, but suggest the closest available date " + closestStr + " and ask if they want to expand.");
                if (generatedMsg == null) generatedMsg = fallback;
                
                return AssistantResponse.builder()
                        .type(AssistantResponse.AssistantResponseType.FLIGHT_NO_RESULTS.name())
                        .intent(AssistantIntent.FLIGHT_SEARCH.name())
                        .message(generatedMsg)
                        .reply(generatedMsg)
                        .build();
            }
        }
        
        List<FlightOffer> ranked = rankingService.rankFlights(filteredFlights, null);
        
        List<AssistantResponse.FlightOfferRecommendation> dtos = ranked.stream().limit(5).map(offer -> 
            AssistantResponse.FlightOfferRecommendation.builder()
                .id(offer.getId())
                .departureTime(offer.getDepartureTime())
                .arrivalTime(offer.getArrivalTime())
                .airlineName(offer.getAirlineName())
                .airlineLogo(offer.getAirlineLogo())
                .price(offer.getPrice())
                .currency(offer.getCurrency())
                .durationText(offer.getDurationText())
                .routeText(offer.getRouteText())
                .stopsText(offer.getStopsText())
                .badges(offer.getBadges().stream().map(badge -> badge.equals("Best overall") ? "BEST_OVERALL" : badge).collect(Collectors.toList()))
                .bookingUrl(offer.getBookingUrl())
                .build()
        ).collect(Collectors.toList());
        
        if (dtos.isEmpty()) {
            return buildNoResultsResponse(AssistantIntent.FLIGHT_SEARCH, language);
        }

        log.debug("Mapped Flight Count: {}", dtos.size());

        String generatedMsg = generateAiMessage(language, "Found exact flights.", "Give a short intro message for showing the best flights for exact dates.");

        AssistantResponse finalResp = AssistantResponse.builder()
                .type(AssistantResponse.AssistantResponseType.FLIGHT_RECOMMENDATIONS.name())
                .intent(AssistantIntent.FLIGHT_SEARCH.name())
                .message(generatedMsg)
                .reply(generatedMsg)
                .flights(dtos)
                .build();
                
        log.debug("Final Structured Response: {}", finalResp.getType());
        return finalResp;
    }
    
    private AssistantResponse buildClarificationResponse(AssistantIntent intent, String language, String missing, String fallbackEn) {
        String generatedMsg = generateAiMessage(language, "User asked for flights but didn't provide valid " + missing + ".", "Ask the user to clarify their " + missing + ".");
        if (generatedMsg == null) {
            generatedMsg = "vi".equalsIgnoreCase(language) ? "Bạn muốn bay từ đâu và đến đâu?" : fallbackEn;
        }
        return AssistantResponse.builder()
                .type(AssistantResponse.AssistantResponseType.FLIGHT_CLARIFICATION.name())
                .intent(intent.name())
                .message(generatedMsg)
                .reply(generatedMsg)
                .build();
    }
    
    private AssistantResponse buildNoResultsResponse(AssistantIntent intent, String language) {
        String generatedMsg = generateAiMessage(language, "No flights found for this route.", "Inform the user that no flights were found for their search.");
        if (generatedMsg == null) {
            generatedMsg = "vi".equalsIgnoreCase(language) ? "Rất tiếc, tôi không tìm thấy chuyến bay nào cho chặng này." : "Sorry, no flights found for this route.";
        }
        return AssistantResponse.builder()
                .type(AssistantResponse.AssistantResponseType.FLIGHT_NO_RESULTS.name())
                .intent(intent.name())
                .message(generatedMsg)
                .reply(generatedMsg)
                .build();
    }
}
