package com.travel.marketplace.modules.listing.dto;

import java.math.BigDecimal;

public record AdminListingCategoryResponse(
        String category,
        long count,
        BigDecimal percentage
) {
}
