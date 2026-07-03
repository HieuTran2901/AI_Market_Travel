package com.travel.marketplace.modules.listing.controller;

import com.travel.marketplace.dto.ApiResponse;
import com.travel.marketplace.modules.listing.dto.ListingResponse;
import com.travel.marketplace.modules.listing.enums.ListingStatus;
import com.travel.marketplace.modules.listing.service.ListingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/listings")
@Tag(name = "Admin - Listing Management", description = "Admin operations for managing marketplace listings")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class AdminListingController {

    private final ListingService listingService;

    public AdminListingController(ListingService listingService) {
        this.listingService = listingService;
    }

    @GetMapping
    @Operation(summary = "List all listings for admin (paginated)")
    public ResponseEntity<ApiResponse<Page<ListingResponse>>> getAllListings(
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {

        Page<ListingResponse> page = listingService.getAllListingsForAdmin(pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @PatchMapping("/{id}/approve")
    @Operation(summary = "Approve a listing that is PENDING_REVIEW")
    public ResponseEntity<ApiResponse<ListingResponse>> approveListing(@PathVariable Long id) {
        ListingResponse response = listingService.adminChangeListingStatus(id, ListingStatus.ACTIVE, null);
        return ResponseEntity.ok(ApiResponse.success("Listing approved.", response));
    }

    @PatchMapping("/{id}/reject")
    @Operation(summary = "Reject a listing with a reason")
    public ResponseEntity<ApiResponse<ListingResponse>> rejectListing(
            @PathVariable Long id,
            @RequestParam String reason) {

        ListingResponse response = listingService.adminChangeListingStatus(id, ListingStatus.REJECTED, reason);
        return ResponseEntity.ok(ApiResponse.success("Listing rejected.", response));
    }

    @PatchMapping("/{id}/suspend")
    @Operation(summary = "Suspend an active listing for policy violations")
    public ResponseEntity<ApiResponse<ListingResponse>> suspendListing(
            @PathVariable Long id,
            @RequestParam String reason) {

        ListingResponse response = listingService.adminChangeListingStatus(id, ListingStatus.SUSPENDED, reason);
        return ResponseEntity.ok(ApiResponse.success("Listing suspended.", response));
    }
}
