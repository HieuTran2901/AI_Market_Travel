package com.travel.marketplace.modules.ai.planner.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.travel.marketplace.exception.BusinessException;
import com.travel.marketplace.exception.ErrorCode;
import com.travel.marketplace.modules.ai.config.TripPlannerProperties;
import com.travel.marketplace.modules.ai.planner.dto.TripPlanRequest;
import com.travel.marketplace.modules.ai.planner.dto.TripPlanResponse;
import com.travel.marketplace.modules.ai.prompt.PromptTemplateRegistry;
import com.travel.marketplace.modules.ai.provider.AiProvider;
import com.travel.marketplace.modules.ai.provider.AiRequest;
import com.travel.marketplace.modules.ai.provider.AiResponse;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TripPlannerServiceImplTest {

    private final TripPlannerServiceImpl service = new TripPlannerServiceImpl(
            new TestAiProvider(),
            null,
            null,
            new AiJsonResponseParser(new ObjectMapper()),
            properties(),
            new MockEnvironment().withProperty("spring.profiles.active", "test")
    );

    @Test
    void parsesValidStructuredPlanAndCalculatesTotalFromActivities() {
        TripPlanResponse response = service.parseAiResponse(
                aiResponse("""
                        {
                          "days": [
                            {
                              "dayNumber": 1,
                              "theme": "Arrival",
                              "activities": [
                                {
                                  "time": "09:00",
                                  "listingId": null,
                                  "listingName": "Airport transfer",
                                  "type": "TRANSPORT",
                                  "description": "Travel to the hotel.",
                                  "estimatedCost": 20
                                }
                              ]
                            }
                          ],
                          "totalEstimatedBudget": 999,
                          "aiSummary": "A relaxed arrival day."
                        }
                        """),
                request(1),
                List.of()
        );

        assertThat(response.getItinerary()).hasSize(1);
        assertThat(response.getTotalEstimatedBudget()).isEqualByComparingTo(new BigDecimal("20"));
    }

    @Test
    void rejectsWrongNumberOfDays() {
        assertThatThrownBy(() -> service.parseAiResponse(
                aiResponse("""
                        {
                          "days": [
                            {"dayNumber": 1, "theme": "Arrival", "activities": []}
                          ],
                          "totalEstimatedBudget": 0,
                          "aiSummary": "A relaxed arrival day."
                        }
                        """),
                request(2),
                List.of()
        )).isInstanceOf(BusinessException.class);
    }

    @Test
    void rejectsNegativeActivityCost() {
        assertThatThrownBy(() -> service.parseAiResponse(
                aiResponse("""
                        {
                          "days": [
                            {
                              "dayNumber": 1,
                              "theme": "Arrival",
                              "activities": [
                                {
                                  "time": "09:00",
                                  "listingId": null,
                                  "listingName": "Airport transfer",
                                  "type": "TRANSPORT",
                                  "description": "Travel to the hotel.",
                                  "estimatedCost": -1
                                }
                              ]
                            }
                          ],
                          "totalEstimatedBudget": -1,
                          "aiSummary": "A relaxed arrival day."
                        }
                        """),
                request(1),
                List.of()
        )).isInstanceOf(BusinessException.class);
    }

    @Test
    void retriesFullGenerationWhenProviderFinishReasonIndicatesLength() {
        SequencedAiProvider provider = new SequencedAiProvider(
                AiResponse.builder()
                        .text("{\"days\":[")
                        .model("test-model")
                        .finishReason("length")
                        .usage(AiResponse.TokenUsage.builder().completionTokens(120).build())
                        .build(),
                aiResponse("""
                        {
                          "days": [
                            {
                              "dayNumber": 1,
                              "theme": "Arrival",
                              "activities": [
                                {
                                  "time": "09:00",
                                  "listingId": null,
                                  "listingName": "Airport transfer",
                                  "type": "TRANSPORT",
                                  "description": "Travel to the hotel.",
                                  "estimatedCost": 20
                                }
                              ]
                            }
                          ],
                          "totalEstimatedBudget": 20,
                          "aiSummary": "A relaxed arrival day."
                        }
                        """)
        );
        TripPlannerServiceImpl retryingService = new TripPlannerServiceImpl(
                provider,
                null,
                registry(),
                new AiJsonResponseParser(new ObjectMapper()),
                properties(),
                new MockEnvironment().withProperty("spring.profiles.active", "test")
        );

        TripPlanResponse response = retryingService.planTrip(request(1));

        assertThat(response.getItinerary()).hasSize(1);
        assertThat(provider.requests).hasSize(2);
        assertThat(provider.requests.get(0).getMaxTokens()).isEqualTo(2350);
        assertThat(provider.requests.get(0).getModelOverride()).isEqualTo("google/gemini-2.0-flash-001");
        assertThat(provider.requests.get(1).getMaxTokens()).isEqualTo(4700);
        assertThat(provider.requests.get(1).getModelOverride()).isEqualTo("openai/gpt-4o-mini");
        assertThat(provider.requests.get(1).getPrompt()).doesNotContain("{\"days\":[");
    }

    @Test
    void returnsOutputTruncatedWhenBothGenerationsAreIncomplete() {
        SequencedAiProvider provider = new SequencedAiProvider(
                AiResponse.builder().text("{\"days\":[").model("test-model").finishReason("length").build(),
                AiResponse.builder().text("{\"days\":[").model("test-model").finishReason("length").build()
        );
        TripPlannerServiceImpl retryingService = new TripPlannerServiceImpl(
                provider,
                null,
                registry(),
                new AiJsonResponseParser(new ObjectMapper()),
                properties(),
                new MockEnvironment().withProperty("spring.profiles.active", "test")
        );

        assertThatThrownBy(() -> retryingService.planTrip(request(1)))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.AI_OUTPUT_TRUNCATED);
        assertThat(provider.requests).hasSize(2);
    }

    @Test
    void ignoresSeparateReasoningFieldWhenContentIsCleanJson() {
        SequencedAiProvider provider = new SequencedAiProvider(
                aiResponse(validPlan(1)).toBuilder()
                        .reasoning("We need to build a plan, but this must not be parsed.")
                        .build()
        );
        TripPlannerServiceImpl retryingService = new TripPlannerServiceImpl(
                provider,
                null,
                registry(),
                new AiJsonResponseParser(new ObjectMapper()),
                properties(),
                new MockEnvironment().withProperty("spring.profiles.active", "test")
        );

        TripPlanResponse response = retryingService.planTrip(request(1));

        assertThat(response.getItinerary()).hasSize(1);
        assertThat(provider.requests).hasSize(1);
    }

    @Test
    void fallsBackWhenReasoningIsPlacedInsideContentBeforeJson() {
        SequencedAiProvider provider = new SequencedAiProvider(
                AiResponse.builder()
                        .text("We need to output a JSON object and create the itinerary.\n" + validPlan(1))
                        .model("nvidia/nemotron-3-super-120b-a12b:free")
                        .finishReason("stop")
                        .usage(AiResponse.TokenUsage.builder().completionTokens(6000).build())
                        .build(),
                aiResponse(validPlan(1)).toBuilder()
                        .model("openai/gpt-4o-mini")
                        .build()
        );
        TripPlannerServiceImpl retryingService = new TripPlannerServiceImpl(
                provider,
                null,
                registry(),
                new AiJsonResponseParser(new ObjectMapper()),
                properties(),
                new MockEnvironment().withProperty("spring.profiles.active", "test")
        );

        TripPlanResponse response = retryingService.planTrip(request(1));

        assertThat(response.getItinerary()).hasSize(1);
        assertThat(provider.requests).hasSize(2);
        assertThat(provider.requests.get(1).getModelOverride()).isEqualTo("openai/gpt-4o-mini");
    }

    @Test
    void rejectsStartTimeEndTimeFieldNameMismatch() {
        assertThatThrownBy(() -> service.parseAiResponse(
                aiResponse("""
                        {
                          "days": [
                            {
                              "dayNumber": 1,
                              "theme": "Arrival",
                              "activities": [
                                {
                                  "startTime": "09:00",
                                  "endTime": "10:00",
                                  "listingId": null,
                                  "listingName": "Airport transfer",
                                  "type": "TRANSPORT",
                                  "description": "Travel to the hotel.",
                                  "estimatedCost": 20
                                }
                              ]
                            }
                          ],
                          "totalEstimatedBudget": 20,
                          "aiSummary": "A relaxed arrival day."
                        }
                        """),
                request(1),
                List.of()
        )).isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.AI_INVALID_STRUCTURED_RESPONSE);
    }

    @Test
    void rejectsUnsupportedActivityEnum() {
        assertThatThrownBy(() -> service.parseAiResponse(
                aiResponse("""
                        {
                          "days": [
                            {
                              "dayNumber": 1,
                              "theme": "Arrival",
                              "activities": [
                                {
                                  "time": "09:00",
                                  "listingId": null,
                                  "listingName": "Hotel stay",
                                  "type": "HOTEL_STAY",
                                  "description": "Check in and rest.",
                                  "estimatedCost": 20
                                }
                              ]
                            }
                          ],
                          "totalEstimatedBudget": 20,
                          "aiSummary": "A relaxed arrival day."
                        }
                        """),
                request(1),
                List.of()
        )).isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.AI_INVALID_STRUCTURED_RESPONSE);
    }

    @Test
    void tokenBudgetGrowsWithDaysAndRespectsCap() {
        TripPlannerProperties props = properties();

        assertThat(props.calculateMaxOutputTokens(1)).isEqualTo(2350);
        assertThat(props.calculateMaxOutputTokens(3)).isEqualTo(3850);
        assertThat(props.calculateMaxOutputTokens(5)).isEqualTo(5350);
        assertThat(props.calculateMaxOutputTokens(7)).isEqualTo(6000);
    }

    @Test
    void completeFourDayPlanUsesStructuredSchemaAndFitsNormalBudget() {
        SequencedAiProvider provider = new SequencedAiProvider(
                aiResponse(validPlan(4)).toBuilder()
                        .usage(AiResponse.TokenUsage.builder().completionTokens(900).build())
                        .build()
        );
        TripPlannerServiceImpl retryingService = new TripPlannerServiceImpl(
                provider,
                null,
                registry(),
                new AiJsonResponseParser(new ObjectMapper()),
                properties(),
                new MockEnvironment().withProperty("spring.profiles.active", "test")
        );

        TripPlanResponse response = retryingService.planTrip(request(4));

        assertThat(response.getItinerary()).hasSize(4);
        assertThat(provider.requests).hasSize(1);
        AiRequest request = provider.requests.getFirst();
        assertThat(request.getMaxTokens()).isEqualTo(4600);
        assertThat(request.getJsonSchemaName()).isEqualTo("trip_plan");
        assertThat(request.getJsonSchema()).isNotEmpty();
        assertThat(request.getReasoningEffort()).isEqualTo("low");
        assertThat(request.isExcludeReasoning()).isTrue();
    }

    @Test
    void validatesOneThreeFiveAndSevenDayPlans() {
        for (int days : List.of(1, 3, 5, 7)) {
            TripPlanResponse response = service.parseAiResponse(
                    aiResponse(validPlan(days)),
                    request(days),
                    List.of()
            );

            assertThat(response.getItinerary()).hasSize(days);
            assertThat(response.getItinerary().getLast().getDayNumber()).isEqualTo(days);
        }
    }

    private AiResponse aiResponse(String text) {
        return AiResponse.builder()
                .text(text)
                .model("test-model")
                .finishReason("stop")
                .build();
    }

    private TripPlanRequest request(int durationDays) {
        return TripPlanRequest.builder()
                .destination("Da Nang")
                .durationDays(durationDays)
                .build();
    }

    private String validPlan(int days) {
        StringBuilder json = new StringBuilder();
        json.append("""
                {
                  "days": [
                """);
        for (int day = 1; day <= days; day++) {
            if (day > 1) {
                json.append(",\n");
            }
            json.append("""
                    {
                      "dayNumber": %d,
                      "theme": "Day %d",
                      "activities": [
                        {
                          "time": "09:00",
                          "listingId": null,
                          "listingName": "Morning plan",
                          "type": "FREE_TIME",
                          "description": "A concise activity for the morning.",
                          "estimatedCost": 10
                        }
                      ]
                    }
                    """.formatted(day, day));
        }
        json.append("""
                
                  ],
                  "totalEstimatedBudget": 0,
                  "aiSummary": "A concise validated itinerary."
                }
                """);
        return json.toString();
    }

    private TripPlannerProperties properties() {
        TripPlannerProperties properties = new TripPlannerProperties();
        properties.validate();
        return properties;
    }

    private PromptTemplateRegistry registry() {
        PromptTemplateRegistry registry = new PromptTemplateRegistry();
        registry.registerBuiltInTemplates();
        return registry;
    }

    private static class TestAiProvider implements AiProvider {
        @Override
        public AiResponse complete(AiRequest request) {
            return AiResponse.builder().text("{}").model("test-model").build();
        }

        @Override
        public String providerName() {
            return "test";
        }
    }

    private static class SequencedAiProvider implements AiProvider {
        private final List<AiResponse> responses;
        private final List<AiRequest> requests = new ArrayList<>();
        private int index = 0;

        SequencedAiProvider(AiResponse... responses) {
            this.responses = List.of(responses);
        }

        @Override
        public AiResponse complete(AiRequest request) {
            requests.add(request);
            return responses.get(Math.min(index++, responses.size() - 1));
        }

        @Override
        public String providerName() {
            return "test";
        }
    }
}
