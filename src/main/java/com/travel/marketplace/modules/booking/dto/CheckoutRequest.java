package com.travel.marketplace.modules.booking.dto;

import lombok.Data;

import java.util.List;

@Data
public class CheckoutRequest {
    private List<ItemCheckoutDetail> items;

    @Data
    public static class ItemCheckoutDetail {
        private Long cartItemId;
        private List<GuestInfoRequest> guests;
    }
}
