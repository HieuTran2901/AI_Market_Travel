package com.travel.marketplace.modules.provider.dto;

import java.time.Instant;

public record AdminProviderSearchRequest(
        String keyword,
        String category,
        String status,
        String verification,
        Instant joinedFrom,
        Instant joinedTo
) {
}
