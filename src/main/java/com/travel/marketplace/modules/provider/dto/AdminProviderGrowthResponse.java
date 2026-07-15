package com.travel.marketplace.modules.provider.dto;

import java.util.List;

public record AdminProviderGrowthResponse(
        String range,
        List<AdminProviderGrowthPointResponse> points
) {
}
