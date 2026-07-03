package com.travel.marketplace.modules.inventory.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class AvailabilityResponse {
    private LocalDate date;
    private boolean available;
    private Integer remainingCapacity;
    private BigDecimal price;
}
