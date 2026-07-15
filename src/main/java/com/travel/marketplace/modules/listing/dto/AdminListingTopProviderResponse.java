package com.travel.marketplace.modules.listing.dto;

import java.math.BigDecimal;

public record AdminListingTopProviderResponse(
        Long providerId,
        String providerName,
        String avatarUrl,
        long listingCount,
        BigDecimal averageRating
) {
}
