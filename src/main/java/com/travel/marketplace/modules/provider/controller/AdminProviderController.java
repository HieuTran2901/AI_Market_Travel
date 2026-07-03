package com.travel.marketplace.modules.provider.controller;

import com.travel.marketplace.dto.ApiResponse;
import com.travel.marketplace.modules.provider.dto.ProviderProfileResponse;
import com.travel.marketplace.modules.provider.service.ProviderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

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

    private final ProviderService providerService;

    public AdminProviderController(ProviderService providerService) {
        this.providerService = providerService;
    }

    @GetMapping
    @Operation(summary = "List all provider profiles (paginated)")
    public ResponseEntity<ApiResponse<Page<ProviderProfileResponse>>> getAllProviders(
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {

        Page<ProviderProfileResponse> page = providerService.getAllProviders(pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @PatchMapping("/{id}/approve")
    @Operation(summary = "Approve a provider application")
    public ResponseEntity<ApiResponse<ProviderProfileResponse>> approveProvider(@PathVariable Long id) {
        ProviderProfileResponse response = providerService.approveProvider(id);
        return ResponseEntity.ok(ApiResponse.success("Provider approved successfully.", response));
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
}
