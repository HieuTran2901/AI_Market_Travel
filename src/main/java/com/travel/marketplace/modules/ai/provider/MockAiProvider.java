package com.travel.marketplace.modules.ai.provider;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * Default AI provider for development and testing.
 * Returns deterministic, structured mock responses so the entire AI workflow
 * can be exercised without real API keys or external network calls.
 *
 * Activated when: ai.provider=mock (the default)
 */
@Service
@ConditionalOnProperty(prefix = "ai", name = "provider", havingValue = "mock", matchIfMissing = true)
public class MockAiProvider implements AiProvider {

    private static final String MODEL_NAME = "mock-ai-v1";

    private static final Map<String, String> RESPONSE_TEMPLATES = Map.of(
        "recommendation", """
            Based on your preferences, here are the top recommendations for your trip:
            
            1. **Beachfront Villa Suite** – Highly rated at 4.8/5, this property perfectly matches your budget and dates. Guests love the ocean views and breakfast included.
            2. **Mekong Delta Full-Day Tour** – A must-do experience for first-time visitors. Small group setting ensures a personalized adventure.
            3. **Authentic Pho Restaurant** – Top-rated local dining spot known for authentic Vietnamese cuisine and reasonable prices.
            
            These selections were ranked based on your budget, travel dates, group size, and average guest ratings.
            """,
        "trip_plan", """
            Here is your personalized 3-day trip itinerary:
            
            **Day 1 – Arrival & City Exploration**
            - Morning: Check into your hotel and freshen up
            - Afternoon: Visit the Old Quarter and local markets
            - Evening: Dinner at a riverside restaurant
            
            **Day 2 – Cultural Immersion**
            - Morning: Full-day guided cultural tour
            - Afternoon: Temple visits and local experiences
            - Evening: Traditional music show
            
            **Day 3 – Day Trip & Departure**
            - Morning: Half-day excursion to nearby attractions
            - Afternoon: Souvenir shopping and departure
            
            **Estimated Budget:** $450–$600 per person (including accommodation, tours, and meals)
            """,
        "assistant", """
            Great question! Based on the available listings in our marketplace, I'd recommend visiting between September and November for the best weather and fewer crowds. 
            
            For accommodations, the beachfront properties in Da Nang offer excellent value in that period. If you're traveling with a group, the villa options can be more economical than separate hotel rooms.
            
            Would you like me to suggest specific listings based on your group size and budget?
            """
    );

    @Override
    public AiResponse complete(AiRequest request) {
        String responseText = request != null && request.isJsonResponse() && isTripPlanPrompt(request.getPrompt())
                ? structuredTripPlanResponse()
                : selectMockResponse(request != null ? request.getPrompt() : null);
        int promptLen = request != null && request.getPrompt() != null ? request.getPrompt().length() / 4 : 0;
        int completionLen = responseText.length() / 4;

        return AiResponse.builder()
                .text(responseText)
                .model(MODEL_NAME)
                .finishReason("stop")
                .mocked(true)
                .usage(AiResponse.TokenUsage.builder()
                        .promptTokens(promptLen)
                        .completionTokens(completionLen)
                        .totalTokens(promptLen + completionLen)
                        .build())
                .build();
    }

    @Override
    public String providerName() {
        return "mock";
    }

    private String selectMockResponse(String prompt) {
        if (prompt == null) return RESPONSE_TEMPLATES.get("assistant");
        String lower = prompt.toLowerCase();
        if (lower.contains("recommend") || lower.contains("suggestion")) {
            return RESPONSE_TEMPLATES.get("recommendation");
        }
        if (lower.contains("itinerary") || lower.contains("plan") || lower.contains("day")) {
            return RESPONSE_TEMPLATES.get("trip_plan");
        }
        return RESPONSE_TEMPLATES.get("assistant");
    }

    private boolean isTripPlanPrompt(String prompt) {
        if (prompt == null) {
            return false;
        }
        String lower = prompt.toLowerCase();
        return lower.contains("itinerary") || lower.contains("trip request") || lower.contains("trip plan");
    }

    private String structuredTripPlanResponse() {
        return """
                {
                  "days": [
                    {
                      "dayNumber": 1,
                      "theme": "Arrival and city discovery",
                      "activities": [
                        {
                          "time": "09:00",
                          "listingId": null,
                          "listingName": "Arrival",
                          "type": "TRANSPORT",
                          "description": "Arrive, settle in, and get oriented around the destination.",
                          "estimatedCost": 40
                        },
                        {
                          "time": "14:00",
                          "listingId": null,
                          "listingName": "Local walk",
                          "type": "FREE_TIME",
                          "description": "Explore local streets, markets, and cafes at a comfortable pace.",
                          "estimatedCost": 35
                        }
                      ]
                    },
                    {
                      "dayNumber": 2,
                      "theme": "Culture and signature experiences",
                      "activities": [
                        {
                          "time": "09:00",
                          "listingId": null,
                          "listingName": "Cultural tour",
                          "type": "TOUR",
                          "description": "Spend the day visiting cultural highlights and local neighborhoods.",
                          "estimatedCost": 120
                        },
                        {
                          "time": "18:00",
                          "listingId": null,
                          "listingName": "Local dinner",
                          "type": "RESTAURANT",
                          "description": "Try a relaxed dinner focused on regional dishes.",
                          "estimatedCost": 60
                        }
                      ]
                    },
                    {
                      "dayNumber": 3,
                      "theme": "Scenic excursion and departure",
                      "activities": [
                        {
                          "time": "08:30",
                          "listingId": null,
                          "listingName": "Half-day excursion",
                          "type": "EXPERIENCE",
                          "description": "Enjoy a scenic morning activity before wrapping up the trip.",
                          "estimatedCost": 95
                        },
                        {
                          "time": "15:00",
                          "listingId": null,
                          "listingName": "Departure",
                          "type": "TRANSPORT",
                          "description": "Return transfer and departure buffer.",
                          "estimatedCost": 40
                        }
                      ]
                    }
                  ],
                  "totalEstimatedBudget": 390,
                  "aiSummary": "A balanced three-day itinerary with arrival time, cultural highlights, local dining, and a scenic final morning.",
                  "highlights": ["Easy arrival flow", "Local culture and food", "Scenic final-day experience"]
                }
                """;
    }
}
