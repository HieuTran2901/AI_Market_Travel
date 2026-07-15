package com.travel.marketplace.modules.user.dto;

import java.time.Instant;

public record AdminUserSearchRequest(
        String keyword,
        String role,
        String status,
        Boolean verified,
        Instant joinedFrom,
        Instant joinedTo
) {
}
