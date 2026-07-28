package com.travel.marketplace.modules.ai.flight.dto;

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
public class FlightOffer {
    private String id;
    private String departureTime;
    private String arrivalTime;
    private String airlineName;
    private String airlineLogo;
    private BigDecimal price;
    private String currency;
    private String routeText;
    private String durationText;
    private String stopsText;
    private String bookingToken;
    private String bookingUrl;
    private double score;
    private List<String> badges;
}
