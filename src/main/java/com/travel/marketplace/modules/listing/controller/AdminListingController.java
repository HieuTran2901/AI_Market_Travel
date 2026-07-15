package com.travel.marketplace.modules.listing.controller;

import com.travel.marketplace.dto.ApiResponse;
import com.travel.marketplace.modules.listing.dto.AdminListingPerformanceResponse;
import com.travel.marketplace.modules.listing.dto.AdminListingResponse;
import com.travel.marketplace.modules.listing.dto.AdminListingSearchRequest;
import com.travel.marketplace.modules.listing.dto.AdminListingStatisticsResponse;
import com.travel.marketplace.modules.listing.dto.AdminListingTopProviderResponse;
import com.travel.marketplace.modules.listing.dto.ListingResponse;
import com.travel.marketplace.modules.listing.enums.ListingStatus;
import com.travel.marketplace.modules.listing.service.ListingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

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
    @Operation(summary = "List all listings for admin with filters and pagination")
    public ResponseEntity<ApiResponse<Page<AdminListingResponse>>> getAllListings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "updatedAt,desc") String sort,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Long providerId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant createdFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant createdTo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant updatedFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant updatedTo) {

        AdminListingSearchRequest request = new AdminListingSearchRequest(keyword, category, status, location, providerId, createdFrom, createdTo, updatedFrom, updatedTo);
        Page<AdminListingResponse> pageResult = listingService.getAdminListings(request, page, size, sort);
        return ResponseEntity.ok(ApiResponse.success(pageResult));
    }

    @GetMapping("/legacy")
    @Operation(summary = "List all listings using the public listing response shape")
    public ResponseEntity<ApiResponse<Page<ListingResponse>>> getAllListingsLegacy(
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {

        Page<ListingResponse> page = listingService.getAllListingsForAdmin(pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/statistics")
    @Operation(summary = "Get admin listing statistics")
    public ResponseEntity<ApiResponse<AdminListingStatisticsResponse>> getStatistics() {
        return ResponseEntity.ok(ApiResponse.success(listingService.getAdminListingStatistics()));
    }

    @GetMapping("/performance")
    @Operation(summary = "Get listing performance summary")
    public ResponseEntity<ApiResponse<AdminListingPerformanceResponse>> getPerformance(@RequestParam(defaultValue = "30d") String range) {
        return ResponseEntity.ok(ApiResponse.success(listingService.getAdminListingPerformance(range)));
    }

    @GetMapping("/top-providers")
    @Operation(summary = "Get providers ranked by active listing count")
    public ResponseEntity<ApiResponse<List<AdminListingTopProviderResponse>>> getTopProviders(@RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(ApiResponse.success(listingService.getAdminListingTopProviders(limit)));
    }

    @GetMapping("/recent-submissions")
    @Operation(summary = "Get recent draft and pending listing submissions")
    public ResponseEntity<ApiResponse<List<AdminListingResponse>>> getRecentSubmissions(@RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(ApiResponse.success(listingService.getRecentAdminListingSubmissions(limit)));
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

    @PatchMapping("/{id}/reactivate")
    @Operation(summary = "Reactivate a suspended or inactive listing")
    public ResponseEntity<ApiResponse<ListingResponse>> reactivateListing(@PathVariable Long id) {
        ListingResponse response = listingService.adminChangeListingStatus(id, ListingStatus.ACTIVE, null);
        return ResponseEntity.ok(ApiResponse.success("Listing reactivated.", response));
    }
}
