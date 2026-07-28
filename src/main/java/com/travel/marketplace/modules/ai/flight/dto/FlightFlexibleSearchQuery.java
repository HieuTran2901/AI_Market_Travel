package com.travel.marketplace.modules.ai.flight.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlightFlexibleSearchQuery {
    private String departureAirportCode;
    private String arrivalAirportCode;
    private LocalDate searchWindowStart;
    private LocalDate searchWindowEnd;
    private int tripDurationDays;
    private int passengers;
    private String currency;
    private String language; // e.g. vi or en
}
