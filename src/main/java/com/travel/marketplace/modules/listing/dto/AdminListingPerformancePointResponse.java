package com.travel.marketplace.modules.listing.dto;

import java.time.LocalDate;

public record AdminListingPerformancePointResponse(
        LocalDate date,
        long views,
        long bookings
) {
}
