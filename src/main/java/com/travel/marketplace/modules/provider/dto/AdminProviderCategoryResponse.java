package com.travel.marketplace.modules.provider.dto;

import java.math.BigDecimal;

public record AdminProviderCategoryResponse(
        String category,
        long count,
        BigDecimal percentage
) {
}
