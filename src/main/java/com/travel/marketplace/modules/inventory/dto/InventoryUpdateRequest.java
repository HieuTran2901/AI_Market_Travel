package com.travel.marketplace.modules.inventory.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class InventoryUpdateRequest {
    private Long inventoryId;
    private LocalDate date;
    private BigDecimal priceOverride;
    private Integer totalCapacity;
    private boolean blocked;
}
