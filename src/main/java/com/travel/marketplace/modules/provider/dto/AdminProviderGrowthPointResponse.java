package com.travel.marketplace.modules.provider.dto;

import java.time.LocalDate;

public record AdminProviderGrowthPointResponse(
        LocalDate date,
        long count
) {
}
