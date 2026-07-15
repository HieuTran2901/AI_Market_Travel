package com.travel.marketplace.modules.user.dto;

import jakarta.validation.constraints.NotBlank;

public record BanUserRequest(
        @NotBlank(message = "Ban reason category is required")
        String reasonCode,

        @NotBlank(message = "Ban reason is required")
        String reason,

        String internalNote
) {
}
