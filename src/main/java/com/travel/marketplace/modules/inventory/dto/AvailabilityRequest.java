package com.travel.marketplace.modules.inventory.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class AvailabilityRequest {
    private Long inventoryId;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer quantity;
}
