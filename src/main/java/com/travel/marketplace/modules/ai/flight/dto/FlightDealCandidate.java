package com.travel.marketplace.modules.ai.flight.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlightDealCandidate {
    private String departureDate;
    private String returnDate;
    private BigDecimal price;
    private String currency;
    private String airlineName;
    private String airlineLogo;
    private String routeText;
    private String durationText;
    private String bookingUrl;
    private double score;
}
