package com.travel.marketplace.modules.listing.service;

import com.travel.marketplace.modules.listing.dto.ListingExtraServiceResponse;
import com.travel.marketplace.modules.listing.enums.ExtraServiceCategory;

import java.util.List;

public interface ListingExtraServiceService {
    List<ListingExtraServiceResponse> getVisibleExtras(Long listingId, ExtraServiceCategory category);
}
