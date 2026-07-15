package com.travel.marketplace.modules.listing.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record AdminListingResponse(
        Long id,
        String title,
        String slug,
        String thumbnailUrl,
        Long providerId,
        String providerName,
        boolean providerVerified,
        String category,
        String status,
        String city,
        String country,
        BigDecimal basePrice,
        String currency,
        String priceUnit,
        BigDecimal averageRating,
        long reviewCount,
        long bookingCount,
        long viewCount,
        Instant createdAt,
        Instant updatedAt,
        Instant submittedAt
) {
}
