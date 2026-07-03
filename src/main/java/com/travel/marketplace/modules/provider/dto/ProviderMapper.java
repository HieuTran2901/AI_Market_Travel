package com.travel.marketplace.modules.provider.dto;

import com.travel.marketplace.modules.user.entity.ProviderProfile;
import org.springframework.stereotype.Component;

/**
 * Maps ProviderProfile entity → ProviderProfileResponse DTO.
 * Follows the DTO + Mapper pattern established in Phase 1.
 */
@Component
public class ProviderMapper {

    public ProviderProfileResponse toResponse(ProviderProfile profile) {
        if (profile == null) {
            return null;
        }

        return ProviderProfileResponse.builder()
                .id(profile.getId())
                .userId(profile.getUser() != null ? profile.getUser().getId() : null)
                .businessName(profile.getBusinessName())
                .businessType(profile.getBusinessType() != null ? profile.getBusinessType().name() : null)
                .description(profile.getDescription())
                .address(profile.getAddress())
                .city(profile.getCity())
                .country(profile.getCountry())
                .phone(profile.getPhone())
                .website(profile.getWebsite())
                .taxCode(profile.getTaxCode())
                .bankName(profile.getBankName())
                .bankAccountNumber(profile.getBankAccountNumber())
                .bankAccountName(profile.getBankAccountName())
                .verificationStatus(profile.getVerificationStatus() != null
                        ? profile.getVerificationStatus().name() : null)
                .rejectionReason(profile.getRejectionReason())
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }
}
