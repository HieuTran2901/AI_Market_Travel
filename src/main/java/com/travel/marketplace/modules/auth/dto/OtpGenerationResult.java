package com.travel.marketplace.modules.auth.dto;

import com.travel.marketplace.modules.auth.entity.OtpVerification;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * Internal domain result holding the persisted verification record and the ephemeral raw OTP.
 * NOTE: rawOtp is sensitive and MUST NOT be logged or persisted to database.
 */
@Getter
@Builder
@AllArgsConstructor
public class OtpGenerationResult {
    private final OtpVerification verification;
    private final String rawOtp;
}
