package com.travel.marketplace.modules.listing.service;

import com.travel.marketplace.modules.listing.dto.CreateListingRequest;
import com.travel.marketplace.modules.listing.dto.AdminListingPerformanceResponse;
import com.travel.marketplace.modules.listing.dto.AdminListingResponse;
import com.travel.marketplace.modules.listing.dto.AdminListingSearchRequest;
import com.travel.marketplace.modules.listing.dto.AdminListingStatisticsResponse;
import com.travel.marketplace.modules.listing.dto.AdminListingTopProviderResponse;
import com.travel.marketplace.modules.listing.dto.ListingResponse;
import com.travel.marketplace.modules.listing.dto.ListingSearchRequest;
import com.travel.marketplace.modules.listing.dto.UpdateListingRequest;
import com.travel.marketplace.modules.listing.enums.ListingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ListingService {

    ListingResponse createListing(String userEmail, CreateListingRequest request);

    ListingResponse updateListing(String userEmail, Long listingId, UpdateListingRequest request);

    ListingResponse getListingById(Long listingId);

    ListingResponse getListingBySlug(String slug);

    Page<ListingResponse> getMyListings(String userEmail, Pageable pageable);

    Page<ListingResponse> searchListings(ListingSearchRequest searchRequest, Pageable pageable);

    void deleteListing(String userEmail, Long listingId);

    ListingResponse changeListingStatus(String userEmail, Long listingId, ListingStatus newStatus);

    // Admin methods
    Page<ListingResponse> getAllListingsForAdmin(Pageable pageable);

    Page<AdminListingResponse> getAdminListings(AdminListingSearchRequest request, int page, int size, String sort);

    AdminListingStatisticsResponse getAdminListingStatistics();

    AdminListingPerformanceResponse getAdminListingPerformance(String range);

    List<AdminListingTopProviderResponse> getAdminListingTopProviders(int limit);

    List<AdminListingResponse> getRecentAdminListingSubmissions(int limit);
    
    ListingResponse adminChangeListingStatus(Long listingId, ListingStatus newStatus, String reason);
}
