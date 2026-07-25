package com.travel.marketplace.modules.ai.planner.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.travel.marketplace.exception.BusinessException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AiJsonResponseParserTest {

    private final AiJsonResponseParser parser = new AiJsonResponseParser(new ObjectMapper());

    @Test
    void parsesValidJson() {
        TripPlannerServiceImpl.RawTripPlan plan = parser.parseObject(validJson(), TripPlannerServiceImpl.RawTripPlan.class);

        assertThat(plan.days()).hasSize(1);
        assertThat(plan.days().getFirst().dayNumber()).isEqualTo(1);
        assertThat(plan.aiSummary()).isEqualTo("A relaxed arrival day.");
    }

    @Test
    void parsesMarkdownFencedJson() {
        TripPlannerServiceImpl.RawTripPlan plan = parser.parseObject("```json\n" + validJson() + "\n```", TripPlannerServiceImpl.RawTripPlan.class);

        assertThat(plan.days()).hasSize(1);
    }

    @Test
    void extractsJsonAfterReasoningText() {
        TripPlannerServiceImpl.RawTripPlan plan = parser.parseObject("Here is your itinerary:\n" + validJson(), TripPlannerServiceImpl.RawTripPlan.class);

        assertThat(plan.aiSummary()).isEqualTo("A relaxed arrival day.");
    }

    @Test
    void rejectsPlaceholderArray() {
        String invalid = """
                {
                  "days": [
                    {
                      "dayNumber": 1,
                      "theme": "Arrival",
                      "activities": [...]
                    }
                  ],
                  "totalEstimatedBudget": 0,
                  "aiSummary": "A relaxed arrival day."
                }
                """;

        assertThatThrownBy(() -> parser.parseObject(invalid, TripPlannerServiceImpl.RawTripPlan.class))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void rejectsEllipsisBetweenArrayItems() {
        String invalid = """
                {
                  "days": [
                    {"dayNumber": 1, "theme": "Arrival", "activities": []},
                    ...
                  ],
                  "totalEstimatedBudget": 0,
                  "aiSummary": "A relaxed arrival day."
                }
                """;

        assertThatThrownBy(() -> parser.parseObject(invalid, TripPlannerServiceImpl.RawTripPlan.class))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void rejectsTruncatedJson() {
        assertThatThrownBy(() -> parser.parseObject("{\"days\": [", TripPlannerServiceImpl.RawTripPlan.class))
                .isInstanceOf(BusinessException.class);
    }

    private String validJson() {
        return """
                {
                  "days": [
                    {
                      "dayNumber": 1,
                      "theme": "Arrival",
                      "activities": []
                    }
                  ],
                  "totalEstimatedBudget": 0,
                  "aiSummary": "A relaxed arrival day."
                }
                """;
    }
}
