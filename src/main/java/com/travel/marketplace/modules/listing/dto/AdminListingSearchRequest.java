package com.travel.marketplace.modules.listing.dto;

import java.time.Instant;

public record AdminListingSearchRequest(
        String keyword,
        String category,
        String status,
        String location,
        Long providerId,
        Instant createdFrom,
        Instant createdTo,
        Instant updatedFrom,
        Instant updatedTo
) {
}
