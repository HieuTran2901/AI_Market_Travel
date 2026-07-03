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
public class TripPlanResponse {
    private String destination;
    private Integer durationDays;
    private List<ItineraryDay> itinerary;
    private BigDecimal totalEstimatedBudget;
    /** Overall AI summary / travel tips */
    private String aiSummary;
    /** Key highlights of the trip plan */
    private List<String> highlights;
    private boolean mockedAi;
    private String providerName;
}
