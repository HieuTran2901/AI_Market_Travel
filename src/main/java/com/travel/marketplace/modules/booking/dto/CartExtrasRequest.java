package com.travel.marketplace.modules.booking.dto;

import lombok.Data;

import java.util.List;

@Data
public class CartExtrasRequest {
    private Long listingId;
    private List<CartExtraItemRequest> items;
}
