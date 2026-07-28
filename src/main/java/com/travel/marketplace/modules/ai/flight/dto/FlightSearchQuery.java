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
public class FlightSearchQuery {
    private String departureAirportCode;
    private String arrivalAirportCode;
    private LocalDate departureDate;
    private LocalDate returnDate;
    private int passengers;
    private String currency; // Default VND
    private String language; // e.g. vi or en
}
