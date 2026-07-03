package com.travel.marketplace.modules.ai.planner.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travel.marketplace.modules.ai.planner.dto.ItineraryDay;
import com.travel.marketplace.modules.ai.planner.dto.TripPlanRequest;
import com.travel.marketplace.modules.ai.planner.dto.TripPlanResponse;
import com.travel.marketplace.modules.ai.prompt.PromptTemplateRegistry;
import com.travel.marketplace.modules.ai.provider.AiProvider;
import com.travel.marketplace.modules.ai.provider.AiRequest;
import com.travel.marketplace.modules.ai.provider.AiResponse;
import com.travel.marketplace.modules.listing.dto.ListingResponse;
import com.travel.marketplace.modules.listing.dto.ListingSearchRequest;
import com.travel.marketplace.modules.listing.service.ListingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class TripPlannerServiceImpl implements TripPlannerService {

    private final AiProvider aiProvider;
    private final ListingService listingService;
    private final PromptTemplateRegistry promptRegistry;
    private final ObjectMapper objectMapper;

    @Override
    public TripPlanResponse planTrip(TripPlanRequest request) {
        // 1. Fetch relevant listings to ground the AI in reality
        List<ListingResponse> candidates = fetchMarketplaceListings(request);
        String listingContext = buildListingContext(candidates);

        // 2. Build the prompt
        Map<String, Object> vars = new HashMap<>();
        vars.put("naturalLanguageQuery", request.getNaturalLanguageQuery() != null ? request.getNaturalLanguageQuery() : "Plan a trip");
        vars.put("destination", request.getDestination());
        vars.put("durationDays", request.getDurationDays() != null ? request.getDurationDays().toString() : "3");
        vars.put("budget", request.getTotalBudget() != null ? request.getTotalBudget().toPlainString() : "Flexible");
        vars.put("groupSize", request.getGroupSize() != null ? request.getGroupSize().toString() : "2");
        vars.put("listingContext", listingContext);

        String prompt = promptRegistry.render("trip_plan", vars);
        
        // Ensure system knows we need JSON
        String systemContext = "You are a helpful travel planner. Always respond ONLY in valid JSON format. Do not use Markdown formatting like ```json ... ```, just output the raw JSON object.";

        AiResponse aiResponse = aiProvider.complete(AiRequest.builder()
                .prompt(prompt)
                .systemContext(systemContext)
                .maxTokens(2048)
                .temperature(0.6)
                .build());

        // 3. Parse JSON response
        return parseAiResponse(aiResponse, request, candidates);
    }

    private List<ListingResponse> fetchMarketplaceListings(TripPlanRequest request) {
        ListingSearchRequest searchRequest = new ListingSearchRequest();
        searchRequest.setCity(request.getDestination());
        searchRequest.setStatus("ACTIVE");
        
        try {
            Page<ListingResponse> page = listingService.searchListings(searchRequest, PageRequest.of(0, 50));
            return new ArrayList<>(page.getContent());
        } catch (Exception e) {
            log.warn("Failed to fetch listings for trip planner", e);
            return List.of();
        }
    }

    private String buildListingContext(List<ListingResponse> listings) {
        if (listings.isEmpty()) return "No specific listings available, provide general suggestions.";
        
        StringBuilder sb = new StringBuilder();
        for (ListingResponse l : listings) {
            sb.append("- ID: ").append(l.getId())
              .append(" | ").append(l.getTitle())
              .append(" | ").append(l.getCategory())
              .append(" | Price: ").append(l.getBasePrice()).append(" ").append(l.getCurrency())
              .append(" | Rating: ").append(l.getAverageRating() != null ? l.getAverageRating() : "N/A")
              .append("\n");
        }
        return sb.toString();
    }

    private TripPlanResponse parseAiResponse(AiResponse aiResponse, TripPlanRequest request, List<ListingResponse> candidates) {
        String jsonText = extractJson(aiResponse.getText());
        
        try {
            JsonNode root = objectMapper.readTree(jsonText);
            
            // Build the itinerary
            List<ItineraryDay> itinerary = new ArrayList<>();
            JsonNode daysNode = root.get("days");
            if (daysNode != null && daysNode.isArray()) {
                for (JsonNode dayNode : daysNode) {
                    ItineraryDay day = new ItineraryDay();
                    day.setDayNumber(dayNode.path("dayNumber").asInt());
                    day.setTheme(dayNode.path("theme").asText(""));
                    
                    List<ItineraryDay.Activity> activities = new ArrayList<>();
                    JsonNode actsNode = dayNode.path("activities");
                    if (actsNode.isArray()) {
                        for (JsonNode actNode : actsNode) {
                            ItineraryDay.Activity act = new ItineraryDay.Activity();
                            act.setTime(actNode.path("time").asText(""));
                            
                            if (actNode.has("listingId") && !actNode.path("listingId").isNull()) {
                                act.setListingId(actNode.path("listingId").asLong());
                            }
                            
                            act.setListingName(actNode.path("listingName").asText(""));
                            act.setType(actNode.path("type").asText("FREE_TIME"));
                            act.setDescription(actNode.path("description").asText(""));
                            
                            if (actNode.has("estimatedCost")) {
                                act.setEstimatedCost(new BigDecimal(actNode.path("estimatedCost").asText("0")));
                            }
                            
                            activities.add(act);
                        }
                    }
                    day.setActivities(activities);
                    itinerary.add(day);
                }
            }
            
            // Generate some highlights if they are missing
            List<String> highlights = new ArrayList<>();
            if (root.has("highlights") && root.path("highlights").isArray()) {
                for (JsonNode h : root.path("highlights")) {
                    highlights.add(h.asText());
                }
            } else {
                highlights.add("Discover the best of " + request.getDestination());
                highlights.add("Handpicked activities based on your preferences");
            }
            
            BigDecimal budget = root.has("totalEstimatedBudget") ? 
                    new BigDecimal(root.path("totalEstimatedBudget").asText("0")) : 
                    BigDecimal.ZERO;
                    
            String aiSummary = root.path("aiSummary").asText("Here is your personalized trip plan.");

            return TripPlanResponse.builder()
                    .destination(request.getDestination())
                    .durationDays(request.getDurationDays())
                    .itinerary(itinerary)
                    .totalEstimatedBudget(budget)
                    .aiSummary(aiSummary)
                    .highlights(highlights)
                    .mockedAi(aiResponse.isMocked())
                    .providerName(aiProvider.providerName())
                    .build();
                    
        } catch (JsonProcessingException e) {
            log.error("Failed to parse AI JSON response: {}", jsonText, e);
            // Fallback for mock or failure
            return generateFallbackResponse(request, aiResponse);
        }
    }
    
    private String extractJson(String text) {
        if (text == null) return "{}";
        
        // Remove markdown JSON code blocks if present
        Pattern pattern = Pattern.compile("```(?:json)?\\s*(\\{.*\\})\\s*```", Pattern.DOTALL);
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            return matcher.group(1);
        }
        
        // Try to find raw object
        int start = text.indexOf("{");
        int end = text.lastIndexOf("}");
        
        if (start >= 0 && end > start) {
            return text.substring(start, end + 1);
        }
        
        return "{}";
    }
    
    private TripPlanResponse generateFallbackResponse(TripPlanRequest request, AiResponse aiResponse) {
        // Mostly used when mock provider returns non-JSON string
        ItineraryDay day1 = ItineraryDay.builder()
                .dayNumber(1)
                .theme("Arrival & Exploration")
                .activities(List.of(
                        ItineraryDay.Activity.builder()
                                .time("Morning")
                                .type("FREE_TIME")
                                .listingName("Arrival")
                                .description("Arrive and settle in")
                                .build()
                ))
                .build();
                
        return TripPlanResponse.builder()
                .destination(request.getDestination())
                .durationDays(request.getDurationDays())
                .itinerary(List.of(day1))
                .aiSummary(aiResponse.getText()) // Use raw text as summary
                .highlights(List.of("Custom Itinerary"))
                .mockedAi(aiResponse.isMocked())
                .providerName(aiProvider.providerName())
                .build();
    }
}
