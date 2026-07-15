package com.travel.marketplace.modules.provider.controller;

import com.travel.marketplace.dto.ApiResponse;
import com.travel.marketplace.modules.provider.dto.AdminProviderCategoryResponse;
import com.travel.marketplace.modules.provider.dto.AdminProviderGrowthResponse;
import com.travel.marketplace.modules.provider.dto.AdminProviderResponse;
import com.travel.marketplace.modules.provider.dto.AdminProviderSearchRequest;
import com.travel.marketplace.modules.provider.dto.AdminProviderStatisticsResponse;
import com.travel.marketplace.modules.provider.dto.ProviderProfileResponse;
import com.travel.marketplace.modules.provider.service.AdminProviderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

/**
 * Admin-only endpoints for managing provider applications and profiles.
 * All endpoints require ROLE_ADMIN.
 */
@RestController
@RequestMapping("/api/v1/admin/providers")
@Tag(name = "Admin - Provider Management", description = "Admin operations for provider verification")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class AdminProviderController {

    private final AdminProviderService providerService;

    public AdminProviderController(AdminProviderService providerService) {
        this.providerService = providerService;
    }

    @GetMapping
    @Operation(summary = "List provider profiles with filters and pagination")
    public ResponseEntity<ApiResponse<Page<AdminProviderResponse>>> getAllProviders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String verification,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant joinedFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant joinedTo
    ) {
        AdminProviderSearchRequest request = new AdminProviderSearchRequest(keyword, category, status, verification, joinedFrom, joinedTo);
        Page<AdminProviderResponse> pageResult = providerService.getProviders(request, page, size, sort);
        return ResponseEntity.ok(ApiResponse.success(pageResult));
    }

    @GetMapping("/statistics")
    @Operation(summary = "Get provider statistics")
    public ResponseEntity<ApiResponse<AdminProviderStatisticsResponse>> getStatistics() {
        return ResponseEntity.ok(ApiResponse.success(providerService.getStatistics()));
    }

    @GetMapping("/growth")
    @Operation(summary = "Get provider growth series")
    public ResponseEntity<ApiResponse<AdminProviderGrowthResponse>> getGrowth(@RequestParam(defaultValue = "30d") String range) {
        return ResponseEntity.ok(ApiResponse.success(providerService.getGrowth(range)));
    }

    @GetMapping("/categories")
    @Operation(summary = "Get provider category distribution")
    public ResponseEntity<ApiResponse<List<AdminProviderCategoryResponse>>> getCategories() {
        return ResponseEntity.ok(ApiResponse.success(providerService.getCategoryDistribution()));
    }

    @GetMapping("/top-rated")
    @Operation(summary = "Get top rated providers")
    public ResponseEntity<ApiResponse<List<AdminProviderResponse>>> getTopRated(@RequestParam(defaultValue = "5") int limit) {
        List<AdminProviderResponse> page = providerService.getTopRated(limit);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @PatchMapping("/{id}/approve")
    @Operation(summary = "Approve a provider application")
    public ResponseEntity<ApiResponse<ProviderProfileResponse>> approveProvider(@PathVariable Long id) {
        ProviderProfileResponse response = providerService.approveProvider(id);
        return ResponseEntity.ok(ApiResponse.success("Provider approved successfully.", response));
    }

    @PatchMapping("/{id}/verify")
    @Operation(summary = "Verify a provider application")
    public ResponseEntity<ApiResponse<ProviderProfileResponse>> verifyProvider(@PathVariable Long id) {
        ProviderProfileResponse response = providerService.approveProvider(id);
        return ResponseEntity.ok(ApiResponse.success("Provider verified successfully.", response));
    }

    @PatchMapping("/{id}/reject")
    @Operation(summary = "Reject a provider application with a reason")
    public ResponseEntity<ApiResponse<ProviderProfileResponse>> rejectProvider(
            @PathVariable Long id,
            @RequestParam String reason) {

        ProviderProfileResponse response = providerService.rejectProvider(id, reason);
        return ResponseEntity.ok(ApiResponse.success("Provider rejected.", response));
    }

    @PatchMapping("/{id}/suspend")
    @Operation(summary = "Suspend an approved provider")
    public ResponseEntity<ApiResponse<ProviderProfileResponse>> suspendProvider(
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {

        ProviderProfileResponse response = providerService.suspendProvider(id, reason);
        return ResponseEntity.ok(ApiResponse.success("Provider suspended.", response));
    }

    @PatchMapping("/{id}/reactivate")
    @Operation(summary = "Reactivate a suspended provider")
    public ResponseEntity<ApiResponse<ProviderProfileResponse>> reactivateProvider(@PathVariable Long id) {
        ProviderProfileResponse response = providerService.reactivateProvider(id);
        return ResponseEntity.ok(ApiResponse.success("Provider reactivated.", response));
    }
}
