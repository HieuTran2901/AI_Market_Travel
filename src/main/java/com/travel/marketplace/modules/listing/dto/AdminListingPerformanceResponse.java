package com.travel.marketplace.modules.listing.dto;

import java.util.List;

public record AdminListingPerformanceResponse(
        String range,
        boolean viewSeriesAvailable,
        boolean bookingSeriesAvailable,
        long totalViews,
        long totalBookings,
        List<AdminListingPerformancePointResponse> points
) {
}
