package com.travel.marketplace.modules.dashboard.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record AdminDashboardOverviewResponse(
        long totalUsers,
        long activeListings,
        long totalBookings,
        BigDecimal totalRevenue,
        String currency,
        long totalProviders,
        Instant generatedAt
) {
}
