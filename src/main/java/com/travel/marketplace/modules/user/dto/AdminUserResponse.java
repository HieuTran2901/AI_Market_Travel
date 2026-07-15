package com.travel.marketplace.modules.user.dto;

import java.time.Instant;
import java.util.List;

public record AdminUserResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        String avatarUrl,
        List<String> roles,
        String primaryRole,
        String status,
        boolean banned,
        Instant bannedAt,
        String banReasonCode,
        String banReason,
        boolean verified,
        Instant createdAt,
        Instant lastActiveAt,
        long bookingCount
) {
}
