package com.travel.marketplace.modules.provider.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record AdminProviderResponse(
        Long id,
        Long userId,
        String businessName,
        String contactName,
        String email,
        String phone,
        String avatarUrl,
        String serviceCategory,
        String status,
        String verificationStatus,
        BigDecimal rating,
        long reviewCount,
        long bookingCount,
        long activeListingCount,
        Instant createdAt,
        Instant lastActiveAt
) {
}
