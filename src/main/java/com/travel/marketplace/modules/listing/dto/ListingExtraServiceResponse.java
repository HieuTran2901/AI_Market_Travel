package com.travel.marketplace.modules.listing.dto;

import com.travel.marketplace.modules.listing.enums.ExtraServiceCategory;
import com.travel.marketplace.modules.listing.enums.ExtraServicePricingUnit;

import java.math.BigDecimal;

public record ListingExtraServiceResponse(
        Long id,
        Long listingId,
        String name,
        String description,
        String imageUrl,
        ExtraServiceCategory category,
        BigDecimal price,
        String currency,
        ExtraServicePricingUnit pricingUnit,
        Integer maxQuantity,
        boolean available
) {
}
