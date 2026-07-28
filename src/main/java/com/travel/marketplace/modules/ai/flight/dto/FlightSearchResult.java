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
public class FlightSearchResult {
    private List<FlightOffer> bestFlights;
    private List<FlightOffer> otherFlights;
    private String searchMetadata;
}
