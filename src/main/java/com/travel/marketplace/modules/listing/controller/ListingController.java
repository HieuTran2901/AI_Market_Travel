package com.travel.marketplace.modules.listing.controller;

import com.travel.marketplace.dto.ApiResponse;
import com.travel.marketplace.modules.listing.dto.CreateListingRequest;
import com.travel.marketplace.modules.listing.dto.ListingResponse;
import com.travel.marketplace.modules.listing.dto.ListingSearchRequest;
import com.travel.marketplace.modules.listing.dto.UpdateListingRequest;
import com.travel.marketplace.modules.listing.enums.ListingStatus;
import com.travel.marketplace.modules.listing.service.ListingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/listings")
@Tag(name = "Listings", description = "Marketplace listings operations")
public class ListingController {

    private final ListingService listingService;

    public ListingController(ListingService listingService) {
        this.listingService = listingService;
    }

    // ── Public Endpoints ────────────────────────────────────────────────

    @GetMapping
    @Operation(summary = "Search and browse all active listings")
    public ResponseEntity<ApiResponse<Page<ListingResponse>>> searchListings(
            ListingSearchRequest searchRequest,
            @PageableDefault(size = 20) Pageable pageable) {

        Page<ListingResponse> page = listingService.searchListings(searchRequest, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Get listing details by slug (public)")
    public ResponseEntity<ApiResponse<ListingResponse>> getListingBySlug(@PathVariable String slug) {
        ListingResponse response = listingService.getListingBySlug(slug);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ── Provider Endpoints ──────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasAnyRole('PROVIDER_HOTEL', 'PROVIDER_TOUR', 'PROVIDER_RESTAURANT', 'PROVIDER_VEHICLE', 'PROVIDER_EXPERIENCE')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Create a new listing (Provider only)")
    public ResponseEntity<ApiResponse<ListingResponse>> createListing(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateListingRequest request) {

        ListingResponse response = listingService.createListing(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Listing created as DRAFT.", response));
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('PROVIDER_HOTEL', 'PROVIDER_TOUR', 'PROVIDER_RESTAURANT', 'PROVIDER_VEHICLE', 'PROVIDER_EXPERIENCE')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get my listings (Provider only)")
    public ResponseEntity<ApiResponse<Page<ListingResponse>>> getMyListings(
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 20) Pageable pageable) {

        Page<ListingResponse> page = listingService.getMyListings(userDetails.getUsername(), pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PROVIDER_HOTEL', 'PROVIDER_TOUR', 'PROVIDER_RESTAURANT', 'PROVIDER_VEHICLE', 'PROVIDER_EXPERIENCE')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update an existing listing (Provider only)")
    public ResponseEntity<ApiResponse<ListingResponse>> updateListing(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody UpdateListingRequest request) {

        ListingResponse response = listingService.updateListing(userDetails.getUsername(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Listing updated.", response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('PROVIDER_HOTEL', 'PROVIDER_TOUR', 'PROVIDER_RESTAURANT', 'PROVIDER_VEHICLE', 'PROVIDER_EXPERIENCE')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Change listing status (e.g. submit for review)")
    public ResponseEntity<ApiResponse<ListingResponse>> changeListingStatus(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @RequestParam ListingStatus status) {

        ListingResponse response = listingService.changeListingStatus(userDetails.getUsername(), id, status);
        return ResponseEntity.ok(ApiResponse.success("Listing status updated.", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('PROVIDER_HOTEL', 'PROVIDER_TOUR', 'PROVIDER_RESTAURANT', 'PROVIDER_VEHICLE', 'PROVIDER_EXPERIENCE')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Soft delete a listing (Provider only)")
    public ResponseEntity<ApiResponse<Void>> deleteListing(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {

        listingService.deleteListing(userDetails.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.success("Listing deleted successfully.", null));
    }
}
