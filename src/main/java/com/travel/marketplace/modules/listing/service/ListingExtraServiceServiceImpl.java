package com.travel.marketplace.modules.listing.service;

import com.travel.marketplace.modules.listing.dto.ListingExtraServiceResponse;
import com.travel.marketplace.modules.listing.entity.ListingExtraService;
import com.travel.marketplace.modules.listing.enums.ExtraServiceCategory;
import com.travel.marketplace.modules.listing.enums.ListingStatus;
import com.travel.marketplace.modules.listing.repository.ListingExtraServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ListingExtraServiceServiceImpl implements ListingExtraServiceService {

    private final ListingExtraServiceRepository listingExtraServiceRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ListingExtraServiceResponse> getVisibleExtras(Long listingId, ExtraServiceCategory category) {
        return listingExtraServiceRepository.findVisibleByListing(listingId, ListingStatus.ACTIVE, category)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private ListingExtraServiceResponse toResponse(ListingExtraService extra) {
        Integer maxQuantity = extra.getMaxQuantityPerBooking();
        boolean available = Boolean.TRUE.equals(extra.getActive())
                && (extra.getAvailableQuantity() == null || extra.getAvailableQuantity() > 0);
        return new ListingExtraServiceResponse(
                extra.getId(),
                extra.getListing().getId(),
                extra.getName(),
                extra.getDescription(),
                extra.getImageUrl(),
                extra.getCategory(),
                extra.getPrice(),
                extra.getCurrency(),
                extra.getPricingUnit(),
                maxQuantity,
                available
        );
    }
}
