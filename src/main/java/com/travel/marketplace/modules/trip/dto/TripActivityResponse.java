package com.travel.marketplace.modules.trip.dto;

import lombok.Builder;

import java.math.BigDecimal;

@Builder
public record TripActivityResponse(
        String timeOfDay,
        String title,
        String description,
        Long listingId,
        String listingSlug,
        BigDecimal estimatedCost
) {}
