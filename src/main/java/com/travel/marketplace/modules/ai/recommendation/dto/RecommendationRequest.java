package com.travel.marketplace.modules.ai.recommendation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationRequest {
    private String destination;
    private BigDecimal budgetPerPerson;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer groupSize;
    /** e.g. ["BEACH", "CULTURE", "FOOD", "ADVENTURE", "RELAXATION"] */
    private List<String> interests;
    /** Optional: filter by category. If null, all categories are considered */
    private List<String> categories;
    /** Optional listing IDs already selected in an itinerary and excluded from recommendations. */
    private List<Long> selectedListingIds;
    /** Optional: authenticated user's ID to factor in booking history */
    private Long userId;
}
