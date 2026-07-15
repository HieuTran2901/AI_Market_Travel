package com.travel.marketplace.modules.provider.dto;

public record AdminProviderStatisticsResponse(
        long totalProviders,
        long activeProviders,
        long newProvidersLast30Days,
        long verifiedProviders,
        long suspendedProviders,
        long pendingProviders
) {
}
