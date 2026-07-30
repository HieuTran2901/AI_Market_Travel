package com.travel.marketplace.modules.user.dto;

import com.travel.marketplace.modules.user.entity.ProviderProfile;
import com.travel.marketplace.modules.user.entity.Role;
import com.travel.marketplace.modules.user.entity.User;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class UserMapper {

    public UserResponse toResponse(User user) {
        if (user == null) {
            return null;
        }

        UserResponse.UserResponseBuilder builder = UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .avatarUrl(user.getAvatarUrl())
                .seasonExp(user.getSeasonExp())
                .roles(user.getRoles().stream()
                        .map(Role::getName)
                        .collect(Collectors.toSet()));

        if (user.getProviderProfile() != null) {
            ProviderProfile profile = user.getProviderProfile();
            builder.providerProfile(UserResponse.ProviderProfileResponse.builder()
                    .id(profile.getId())
                    .businessName(profile.getBusinessName())
                    .businessType(String.valueOf(profile.getBusinessType()))
                    .address(profile.getAddress())
                    .taxCode(profile.getTaxCode())
                    .bankName(profile.getBankName())
                    .bankAccountNumber(profile.getBankAccountNumber())
                    .bankAccountName(profile.getBankAccountName())
                    .verificationStatus(String.valueOf(profile.getVerificationStatus()))
                    .build());
        }

        return builder.build();
    }
}
