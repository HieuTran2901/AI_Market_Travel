package com.travel.marketplace.modules.dashboard.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record AdminDashboardRecentBookingResponse(
        Long id,
        String bookingNumber,
        String customerName,
        String listingTitle,
        String status,
        BigDecimal total,
        String currency,
        Instant createdAt
) {
}
