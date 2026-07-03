package com.travel.marketplace.modules.provider.controller;

import com.travel.marketplace.dto.ApiResponse;
import com.travel.marketplace.modules.provider.dto.ProviderProfileResponse;
import com.travel.marketplace.modules.provider.dto.ProviderRegisterRequest;
import com.travel.marketplace.modules.provider.dto.ProviderUpdateRequest;
import com.travel.marketplace.modules.provider.service.ProviderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * Provider self-service endpoints.
 * Customers register as providers and manage their own profiles here.
 */
@RestController
@RequestMapping("/api/v1/provider")
@Tag(name = "Provider", description = "Provider registration and profile management")
@SecurityRequirement(name = "bearerAuth")
public class ProviderController {

    private final ProviderService providerService;

    public ProviderController(ProviderService providerService) {
        this.providerService = providerService;
    }

    @PostMapping("/register")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Register current user as a service provider",
               description = "Converts an authenticated Customer into a Provider. Creates a ProviderProfile with PENDING status.")
    public ResponseEntity<ApiResponse<ProviderProfileResponse>> registerAsProvider(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ProviderRegisterRequest request) {

        ProviderProfileResponse response = providerService.registerAsProvider(
                userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success(
                "Provider profile submitted. Awaiting admin approval.", response));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get my provider profile")
    public ResponseEntity<ApiResponse<ProviderProfileResponse>> getMyProfile(
            @AuthenticationPrincipal UserDetails userDetails) {

        ProviderProfileResponse response = providerService.getMyProfile(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Update my provider profile",
               description = "Only non-null fields in the request body will be updated (partial update).")
    public ResponseEntity<ApiResponse<ProviderProfileResponse>> updateMyProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ProviderUpdateRequest request) {

        ProviderProfileResponse response = providerService.updateMyProfile(
                userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Provider profile updated.", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a public provider profile by ID",
               description = "Returns sanitized public info (no banking details).")
    public ResponseEntity<ApiResponse<ProviderProfileResponse>> getPublicProfile(@PathVariable Long id) {
        ProviderProfileResponse response = providerService.getPublicProfile(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
