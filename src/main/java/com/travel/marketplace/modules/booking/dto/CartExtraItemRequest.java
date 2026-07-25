package com.travel.marketplace.modules.booking.dto;

import lombok.Data;

@Data
public class CartExtraItemRequest {
    private Long extraServiceId;
    private Integer quantity;
}
