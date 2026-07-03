package com.travel.marketplace.modules.provider.service;

import com.travel.marketplace.modules.provider.dto.ProviderProfileResponse;
import com.travel.marketplace.modules.provider.dto.ProviderRegisterRequest;
import com.travel.marketplace.modules.provider.dto.ProviderUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Business contract for Provider profile management.
 */
public interface ProviderService {

    /** Registers a customer as a provider. Creates a ProviderProfile and assigns the provider role. */
    ProviderProfileResponse registerAsProvider(String userEmail, ProviderRegisterRequest request);

    /** Returns the provider profile for the currently authenticated provider. */
    ProviderProfileResponse getMyProfile(String userEmail);

    /** Updates the profile for the currently authenticated provider. */
    ProviderProfileResponse updateMyProfile(String userEmail, ProviderUpdateRequest request);

    /** Returns a public (sanitized) view of a provider profile by ID. */
    ProviderProfileResponse getPublicProfile(Long providerId);

    // ── Admin operations ───────────────────────────────────────────

    /** Returns a paginated list of all provider profiles (Admin only). */
    Page<ProviderProfileResponse> getAllProviders(Pageable pageable);

    /** Approves a provider application (Admin only). */
    ProviderProfileResponse approveProvider(Long providerId);

    /** Rejects a provider application with a reason (Admin only). */
    ProviderProfileResponse rejectProvider(Long providerId, String reason);

    /** Suspends an approved provider (Admin only). */
    ProviderProfileResponse suspendProvider(Long providerId, String reason);
}
