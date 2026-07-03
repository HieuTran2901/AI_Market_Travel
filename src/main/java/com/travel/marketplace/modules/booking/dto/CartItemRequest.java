package com.travel.marketplace.modules.booking.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class CartItemRequest {
    private Long listingId;
    private Long inventoryId;
    private Integer quantity;
    private LocalDate startDate;
    private LocalDate endDate;
    private String timeSlot;
}
