package com.travel.marketplace.modules.auth.entity;

import com.travel.marketplace.modules.auth.enums.OtpPurpose;
import com.travel.marketplace.modules.user.entity.User;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class OtpVerificationTest {

    @Test
    void defaultValuesForOtpVerificationShouldBeCorrect() {
        OtpVerification verification = OtpVerification.builder()
                .email("test@example.com")
                .otpHash("$2a$10$hashedOtpValueExample")
                .purpose(OtpPurpose.REGISTER)
                .expiresAt(Instant.now().plusSeconds(300))
                .build();

        assertThat(verification.getAttemptCount()).isEqualTo(0);
        assertThat(verification.getVerifiedAt()).isNull();
        assertThat(verification.getConsumedAt()).isNull();
        assertThat(verification.getEmail()).isEqualTo("test@example.com");
        assertThat(verification.getPurpose()).isEqualTo(OtpPurpose.REGISTER);
    }

    @Test
    void defaultValuesForUserEmailVerificationShouldBeFalse() {
        User user = User.builder()
                .email("newuser@example.com")
                .password("encoded_pass")
                .fullName("New User")
                .build();

        assertThat(user.isEmailVerified()).isFalse();
        assertThat(user.getEmailVerifiedAt()).isNull();
        assertThat(user.isActive()).isTrue();
    }
}
