package com.travel.marketplace.modules.provider.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Public-facing DTO for a provider business profile.
 * Banking details are excluded from public views.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProviderProfileResponse {

    private Long id;
    private Long userId;

    // Business Identity
    private String businessName;
    private String businessType;
    private String description;

    // Location
    private String address;
    private String city;
    private String country;

    // Contact
    private String phone;
    private String website;

    // Verification
    private String verificationStatus;
    private String rejectionReason;

    // Audit
    private Instant createdAt;
    private Instant updatedAt;

    // Banking only visible to the profile owner
    private String taxCode;
    private String bankName;
    private String bankAccountNumber;
    private String bankAccountName;

    /**
     * Returns a sanitized version without banking info (for public endpoints).
     */
    public static ProviderProfileResponse publicView(ProviderProfileResponse full) {
        return ProviderProfileResponse.builder()
                .id(full.getId())
                .businessName(full.getBusinessName())
                .businessType(full.getBusinessType())
                .description(full.getDescription())
                .address(full.getAddress())
                .city(full.getCity())
                .country(full.getCountry())
                .phone(full.getPhone())
                .website(full.getWebsite())
                .verificationStatus(full.getVerificationStatus())
                .createdAt(full.getCreatedAt())
                .build();
    }
}
