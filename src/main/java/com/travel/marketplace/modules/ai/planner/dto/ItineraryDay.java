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
    private String summary;
    private int activityCount;
    private BigDecimal estimatedDayCost;
    private String primaryCategory;
    private String coverImageUrl;
    private List<String> highlights;
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
        private String imageUrl;
        private BigDecimal rating;
        private Integer reviewCount;
        private BigDecimal latitude;
        private BigDecimal longitude;
        private String providerName;
        private String slug;
        private String city;
        private String address;
    }
}
