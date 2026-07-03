package com.travel.marketplace.modules.booking.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class CartResponse {
    private Long id;
    private Long userId;
    private String status;
    private List<CartItemResponse> items;
    private PriceBreakdownDto totalBreakdown;
}
