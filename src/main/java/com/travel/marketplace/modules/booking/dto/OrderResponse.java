package com.travel.marketplace.modules.booking.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
@Builder
public class OrderResponse {
    private Long id;
    private Long userId;
    private String orderNumber;
    private String status;
    private PriceBreakdownDto priceBreakdown;
    private List<BookingResponse> bookings;
    private Instant createdAt;
    private Instant updatedAt;
}
