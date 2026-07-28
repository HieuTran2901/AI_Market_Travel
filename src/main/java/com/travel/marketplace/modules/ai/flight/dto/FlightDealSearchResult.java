package com.travel.marketplace.modules.ai.flight.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlightDealSearchResult {
    private List<FlightDealCandidate> deals;
    private String searchMetadata;
}
