package com.travel.marketplace.modules.ai.planner.dto;

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
public class TripPlanRequest {
    /** Natural language description of the trip the user wants */
    private String naturalLanguageQuery;
    private String destination;
    private Integer durationDays;
    private BigDecimal totalBudget;
    private Integer groupSize;
    private LocalDate startDate;
    /** Optional: focus categories e.g. ["HOTEL", "TOUR", "RESTAURANT"] */
    private List<String> focusCategories;
}
