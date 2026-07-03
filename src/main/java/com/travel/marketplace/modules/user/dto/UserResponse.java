package com.travel.marketplace.modules.user.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserResponse {
    private Long id;
    private String email;
    private String fullName;
    private String phoneNumber;
    private String avatarUrl;
    private Set<String> roles;
    private ProviderProfileResponse providerProfile;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProviderProfileResponse {
        private Long id;
        private String businessName;
        private String businessType;
        private String address;
        private String taxCode;
        private String bankName;
        private String bankAccountNumber;
        private String bankAccountName;
        private String verificationStatus;
    }
}
