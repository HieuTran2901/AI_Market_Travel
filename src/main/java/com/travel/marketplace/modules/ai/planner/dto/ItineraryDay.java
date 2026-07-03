package com.travel.marketplace.modules.ai.planner.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItineraryDay {
    private int dayNumber;
    private String theme;
    private List<Activity> activities;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Activity {
        private String time;
        /** Null if activity doesn't reference a marketplace listing */
        private Long listingId;
        private String listingName;
        /** HOTEL | RESTAURANT | TOUR | EXPERIENCE | FREE_TIME | TRANSPORT */
        private String type;
        private String description;
        private BigDecimal estimatedCost;
    }
}
