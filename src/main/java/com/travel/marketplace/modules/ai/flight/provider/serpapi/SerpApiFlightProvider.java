package com.travel.marketplace.modules.ai.flight.provider.serpapi;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travel.marketplace.modules.ai.flight.dto.*;
import com.travel.marketplace.modules.ai.flight.provider.FlightProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;
import org.springframework.cache.annotation.Cacheable;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class SerpApiFlightProvider implements FlightProvider {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    @Value("${serpapi.api-key:}")
    private String apiKey;

    @Value("${serpapi.base-url:https://serpapi.com}")
    private String baseUrl;

    public SerpApiFlightProvider(RestClient.Builder restClientBuilder, ObjectMapper objectMapper) {
        this.restClient = restClientBuilder.build();
        this.objectMapper = objectMapper;
    }

    @Override
    @Cacheable(value = "flightDeals", key = "#query.departureAirportCode + '-' + #query.arrivalAirportCode + '-' + #query.searchWindowStart + '-' + #query.searchWindowEnd + '-' + #query.passengers", unless = "#result == null")
    public FlightDealSearchResult searchDeals(FlightFlexibleSearchQuery query) {
        log.info("Searching flexible flight deals from {} to {} within window {} - {}", 
                query.getDepartureAirportCode(), query.getArrivalAirportCode(), 
                query.getSearchWindowStart(), query.getSearchWindowEnd());
        
        // Google Flights API doesn't have a direct "flexible search" endpoint in SerpApi.
        // For the sake of this feature, we simulate it by querying a specific date in the window.
        // We will query the start of the window.
        String hl = "vi".equals(query.getLanguage()) ? "vi" : "en";
        String gl = "vi".equals(query.getLanguage()) ? "vn" : "us";

        String url = UriComponentsBuilder.fromHttpUrl(baseUrl + "/search.json")
                .queryParam("engine", "google_flights")
                .queryParam("departure_id", query.getDepartureAirportCode())
                .queryParam("arrival_id", query.getArrivalAirportCode())
                .queryParam("outbound_date", query.getSearchWindowStart().toString())
                .queryParam("return_date", query.getSearchWindowStart().plusDays(query.getTripDurationDays()).toString())
                .queryParam("currency", query.getCurrency() != null ? query.getCurrency() : "VND")
                .queryParam("hl", hl)
                .queryParam("gl", gl)
                .queryParam("type", "1") // 1 for Round Trip
                .queryParam("api_key", apiKey)
                .build().toUriString();

        try {
            String jsonResponse = restClient.get().uri(url).retrieve().body(String.class);
            JsonNode root = objectMapper.readTree(jsonResponse);
            
            String googleFlightsUrl = "https://www.google.com/flights?hl=" + hl;
            JsonNode searchMetadata = root.path("search_metadata");
            if (searchMetadata.hasNonNull("google_flights_url")) {
                googleFlightsUrl = searchMetadata.get("google_flights_url").asText();
            }
            
            List<FlightDealCandidate> deals = new ArrayList<>();
            JsonNode bestFlights = root.path("best_flights");
            if (bestFlights.isArray()) {
                for (JsonNode flightNode : bestFlights) {
                    FlightDealCandidate deal = parseFlightDeal(flightNode, query.getSearchWindowStart().toString(), query.getSearchWindowStart().plusDays(query.getTripDurationDays()).toString(), googleFlightsUrl);
                    if (deal != null) {
                        deals.add(deal);
                    }
                }
            }
            
            return new FlightDealSearchResult(deals, "Flexible date search within user limits");
        } catch (Exception e) {
            log.error("Error calling SerpApi for flexible deals", e);
            return new FlightDealSearchResult(List.of(), "Error: " + e.getMessage());
        }
    }

    @Override
    @Cacheable(value = "flightOffers", key = "#query.departureAirportCode + '-' + #query.arrivalAirportCode + '-' + #query.departureDate + '-' + #query.returnDate + '-' + #query.passengers", unless = "#result == null")
    public FlightSearchResult searchFlights(FlightSearchQuery query) {
        log.info("Searching exact flights from {} to {} for {} - {}", 
                query.getDepartureAirportCode(), query.getArrivalAirportCode(), 
                query.getDepartureDate(), query.getReturnDate());
        
        String hl = "vi".equals(query.getLanguage()) ? "vi" : "en";
        String gl = "vi".equals(query.getLanguage()) ? "vn" : "us";

        String url = UriComponentsBuilder.fromHttpUrl(baseUrl + "/search.json")
                .queryParam("engine", "google_flights")
                .queryParam("departure_id", query.getDepartureAirportCode())
                .queryParam("arrival_id", query.getArrivalAirportCode())
                .queryParam("outbound_date", query.getDepartureDate() != null ? query.getDepartureDate().toString() : null)
                .queryParam("return_date", query.getReturnDate() != null ? query.getReturnDate().toString() : null)
                .queryParam("currency", query.getCurrency() != null ? query.getCurrency() : "VND")
                .queryParam("hl", hl)
                .queryParam("gl", gl)
                .queryParam("type", query.getReturnDate() != null ? "1" : "2") // 1 Round, 2 One-way
                .queryParam("api_key", apiKey)
                .build().toUriString();

        try {
            String jsonResponse = restClient.get().uri(url).retrieve().body(String.class);
            JsonNode root = objectMapper.readTree(jsonResponse);
            
            String googleFlightsUrl = "https://www.google.com/flights?hl=" + hl;
            JsonNode searchMetadata = root.path("search_metadata");
            if (searchMetadata.hasNonNull("google_flights_url")) {
                googleFlightsUrl = searchMetadata.get("google_flights_url").asText();
            }
            
            List<FlightOffer> bestOffers = new ArrayList<>();
            List<FlightOffer> otherOffers = new ArrayList<>();
            
            JsonNode bestFlights = root.path("best_flights");
            if (bestFlights.isArray()) {
                for (JsonNode flightNode : bestFlights) {
                    FlightOffer offer = parseFlightOffer(flightNode, true, googleFlightsUrl);
                    if (offer != null) bestOffers.add(offer);
                }
            }
            
            JsonNode otherFlights = root.path("other_flights");
            if (otherFlights.isArray()) {
                for (JsonNode flightNode : otherFlights) {
                    FlightOffer offer = parseFlightOffer(flightNode, false, googleFlightsUrl);
                    if (offer != null) otherOffers.add(offer);
                }
            }
            
            return new FlightSearchResult(bestOffers, otherOffers, "Exact flight search");
        } catch (Exception e) {
            log.error("Error calling SerpApi for exact flights", e);
            return new FlightSearchResult(List.of(), List.of(), "Error: " + e.getMessage());
        }
    }

    @Override
    public String getBookingOptions(String bookingToken) {
        return "https://www.google.com/flights?hl=en"; // Token decoding logic...
    }

    private FlightDealCandidate parseFlightDeal(JsonNode flightNode, String depDate, String retDate, String googleFlightsUrl) {
        try {
            JsonNode flightsArray = flightNode.path("flights");
            if (!flightsArray.isArray() || flightsArray.isEmpty()) return null;
            
            JsonNode firstLeg = flightsArray.get(0);
            String airlineName = firstLeg.path("airline").asText();
            String airlineLogo = firstLeg.path("airline_logo").asText();
            int duration = flightNode.path("total_duration").asInt(); // minutes
            String durationText = (duration / 60) + " hr " + (duration % 60) + " min";
            BigDecimal price = new BigDecimal(flightNode.path("price").asInt());
            
            return FlightDealCandidate.builder()
                    .departureDate(depDate)
                    .returnDate(retDate)
                    .price(price)
                    .currency("VND")
                    .airlineName(airlineName)
                    .airlineLogo(airlineLogo)
                    .durationText(durationText)
                    .routeText(firstLeg.path("departure_airport").path("id").asText() + " -> " + firstLeg.path("arrival_airport").path("id").asText())
                    .bookingUrl(googleFlightsUrl)
                    .build();
        } catch (Exception e) {
            log.warn("Failed to parse flight deal", e);
            return null;
        }
    }

    private FlightOffer parseFlightOffer(JsonNode flightNode, boolean isBest, String googleFlightsUrl) {
        try {
            JsonNode flightsArray = flightNode.path("flights");
            if (!flightsArray.isArray() || flightsArray.isEmpty()) return null;
            
            JsonNode firstLeg = flightsArray.get(0);
            String airlineName = firstLeg.path("airline").asText();
            String airlineLogo = firstLeg.path("airline_logo").asText();
            
            String depTime = firstLeg.path("departure_airport").path("time").asText();
            String arrTime = firstLeg.path("arrival_airport").path("time").asText();
            
            int duration = flightNode.path("total_duration").asInt();
            String durationText = (duration / 60) + " hr " + (duration % 60) + " min";
            
            JsonNode layovers = flightNode.path("layovers");
            String stopsText = layovers.isArray() && layovers.size() > 0 ? layovers.size() + " stop" + (layovers.size() > 1 ? "s" : "") : "Non-stop";
            
            BigDecimal price = new BigDecimal(flightNode.path("price").asInt());
            
            List<String> badges = new ArrayList<>();
            if (isBest) badges.add("Best overall");
            
            return FlightOffer.builder()
                    .id(firstLeg.path("flight_number").asText("UNKNOWN") + "-" + depTime)
                    .departureTime(depTime)
                    .arrivalTime(arrTime)
                    .airlineName(airlineName)
                    .airlineLogo(airlineLogo)
                    .price(price)
                    .currency("VND")
                    .durationText(durationText)
                    .routeText(firstLeg.path("departure_airport").path("id").asText() + " -> " + firstLeg.path("arrival_airport").path("id").asText())
                    .stopsText(stopsText)
                    .badges(badges)
                    .bookingToken(flightNode.path("booking_token").asText(""))
                    .bookingUrl(googleFlightsUrl)
                    .build();
        } catch (Exception e) {
            log.warn("Failed to parse flight offer", e);
            return null;
        }
    }
}
