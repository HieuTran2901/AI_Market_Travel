package com.travel.marketplace.modules.dashboard.dto;

import java.time.Instant;

public record AdminDashboardSystemHealthResponse(
        String api,
        String database,
        String storage,
        String jobs,
        Instant lastCheckedAt
) {
}
