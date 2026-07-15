package com.travel.marketplace.modules.listing.dto;

import java.util.List;

public record AdminListingStatisticsResponse(
        long totalListings,
        long activeListings,
        long pendingListings,
        long draftListings,
        long suspendedListings,
        long rejectedListings,
        List<AdminListingCategoryResponse> categories
) {
}
