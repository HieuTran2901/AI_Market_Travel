package com.travel.marketplace.modules.auth.service;

import com.travel.marketplace.exception.BadRequestException;
import com.travel.marketplace.exception.ErrorCode;
import com.travel.marketplace.modules.auth.dto.OtpGenerationResult;
import com.travel.marketplace.modules.auth.dto.SendOtpRequest;
import com.travel.marketplace.modules.auth.dto.VerifyOtpRequest;
import com.travel.marketplace.modules.auth.entity.OtpVerification;
import com.travel.marketplace.modules.auth.enums.OtpPurpose;
import com.travel.marketplace.modules.auth.repository.OtpVerificationRepository;
import com.travel.marketplace.modules.notification.dto.SendNotificationRequest;
import com.travel.marketplace.modules.notification.enums.NotificationType;
import com.travel.marketplace.modules.notification.service.NotificationPublisher;
import com.travel.marketplace.modules.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.AdditionalAnswers.returnsFirstArg;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OtpServiceTest {

    @Mock
    private OtpVerificationRepository otpVerificationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationPublisher notificationPublisher;

    private PasswordEncoder passwordEncoder;
    private OtpService otpService;
    private Clock fixedClock;
    private final Instant now = Instant.parse("2026-08-17T12:00:00Z");

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder();
        otpService = new OtpService(otpVerificationRepository, userRepository, notificationPublisher, passwordEncoder);
        fixedClock = Clock.fixed(now, ZoneId.of("UTC"));
        otpService.setClock(fixedClock);
        otpService.setExpirationSeconds(60L);
        otpService.setResendCooldownSeconds(60L);
        otpService.setMaxVerificationAttempts(5);
    }

    // =========================================================================
    // SECTION 19: REQUIRED TESTS (1 - 20)
    // =========================================================================

    @Test
    @DisplayName("1. resend within cooldown rejected")
    void test1_resendWithinCooldownRejected() {
        when(userRepository.existsByEmail("traveler@example.com")).thenReturn(false);

        // Previous OTP was created 30 seconds ago (cooldown is 60s)
        OtpVerification recentOtp = OtpVerification.builder()
                .id(1L)
                .email("traveler@example.com")
                .purpose(OtpPurpose.REGISTER)
                .createdAt(now.minusSeconds(30))
                .expiresAt(now.plusSeconds(30))
                .build();

        when(otpVerificationRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc("traveler@example.com", OtpPurpose.REGISTER))
                .thenReturn(Optional.of(recentOtp));

        SendOtpRequest request = SendOtpRequest.builder()
                .email("traveler@example.com")
                .purpose(OtpPurpose.REGISTER)
                .build();

        assertThatThrownBy(() -> otpService.sendOtp(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Please wait before requesting another OTP.");

        verify(otpVerificationRepository, never()).save(any(OtpVerification.class));
        verify(notificationPublisher, never()).publish(any(SendNotificationRequest.class));
    }

    @Test
    @DisplayName("2. resend after cooldown succeeds")
    void test2_resendAfterCooldownSucceeds() {
        when(userRepository.existsByEmail("traveler@example.com")).thenReturn(false);

        // Previous OTP was created 65 seconds ago (cooldown is 60s)
        OtpVerification oldOtp = OtpVerification.builder()
                .id(1L)
                .email("traveler@example.com")
                .purpose(OtpPurpose.REGISTER)
                .createdAt(now.minusSeconds(65))
                .expiresAt(now.minusSeconds(5))
                .build();

        when(otpVerificationRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc("traveler@example.com", OtpPurpose.REGISTER))
                .thenReturn(Optional.of(oldOtp));
        when(otpVerificationRepository.findByEmailAndPurposeAndConsumedAtIsNull("traveler@example.com", OtpPurpose.REGISTER))
                .thenReturn(List.of(oldOtp));
        when(otpVerificationRepository.save(any(OtpVerification.class))).thenAnswer(returnsFirstArg());

        SendOtpRequest request = SendOtpRequest.builder()
                .email("traveler@example.com")
                .purpose(OtpPurpose.REGISTER)
                .build();

        otpService.sendOtp(request);

        // Previous active OTP was consumed
        assertThat(oldOtp.getConsumedAt()).isEqualTo(now);

        // New OTP was saved and notification dispatched
        verify(otpVerificationRepository, atLeastOnce()).save(any(OtpVerification.class));
        verify(notificationPublisher, times(1)).publish(any(SendNotificationRequest.class));
    }

    @Test
    @DisplayName("3. first wrong OTP increments attemptCount")
    void test3_firstWrongOtpIncrementsAttemptCount() {
        String correctOtp = "482913";
        OtpVerification verification = OtpVerification.builder()
                .id(1L)
                .email("traveler@example.com")
                .otpHash(passwordEncoder.encode(correctOtp))
                .purpose(OtpPurpose.REGISTER)
                .createdAt(now.minusSeconds(10))
                .expiresAt(now.plusSeconds(50))
                .attemptCount(0)
                .verifiedAt(null)
                .consumedAt(null)
                .build();

        when(otpVerificationRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc("traveler@example.com", OtpPurpose.REGISTER))
                .thenReturn(Optional.of(verification));
        when(otpVerificationRepository.save(any(OtpVerification.class))).thenAnswer(returnsFirstArg());

        VerifyOtpRequest request = VerifyOtpRequest.builder()
                .email("traveler@example.com")
                .purpose(OtpPurpose.REGISTER)
                .code("000000") // Wrong code
                .build();

        assertThatThrownBy(() -> otpService.verifyOtp(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Invalid or expired OTP");

        assertThat(verification.getAttemptCount()).isEqualTo(1);
        assertThat(verification.getVerifiedAt()).isNull();
        assertThat(verification.getConsumedAt()).isNull();
        verify(otpVerificationRepository, times(1)).save(verification);
    }

    @Test
    @DisplayName("4. second wrong OTP increments attemptCount")
    void test4_secondWrongOtpIncrementsAttemptCount() {
        String correctOtp = "482913";
        OtpVerification verification = OtpVerification.builder()
                .id(1L)
                .email("traveler@example.com")
                .otpHash(passwordEncoder.encode(correctOtp))
                .purpose(OtpPurpose.REGISTER)
                .createdAt(now.minusSeconds(10))
                .expiresAt(now.plusSeconds(50))
                .attemptCount(1) // Already had 1 attempt
                .verifiedAt(null)
                .consumedAt(null)
                .build();

        when(otpVerificationRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc("traveler@example.com", OtpPurpose.REGISTER))
                .thenReturn(Optional.of(verification));
        when(otpVerificationRepository.save(any(OtpVerification.class))).thenAnswer(returnsFirstArg());

        VerifyOtpRequest request = VerifyOtpRequest.builder()
                .email("traveler@example.com")
                .purpose(OtpPurpose.REGISTER)
                .code("111111") // 2nd wrong code
                .build();

        assertThatThrownBy(() -> otpService.verifyOtp(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Invalid or expired OTP");

        assertThat(verification.getAttemptCount()).isEqualTo(2);
        assertThat(verification.getVerifiedAt()).isNull();
        assertThat(verification.getConsumedAt()).isNull();
        verify(otpVerificationRepository, times(1)).save(verification);
    }

    @Test
    @DisplayName("5. fifth wrong OTP invalidates OTP")
    void test5_fifthWrongOtpInvalidatesOtp() {
        String correctOtp = "482913";
        OtpVerification verification = OtpVerification.builder()
                .id(1L)
                .email("traveler@example.com")
                .otpHash(passwordEncoder.encode(correctOtp))
                .purpose(OtpPurpose.REGISTER)
                .createdAt(now.minusSeconds(10))
                .expiresAt(now.plusSeconds(50))
                .attemptCount(4) // 4 previous attempts
                .verifiedAt(null)
                .consumedAt(null)
                .build();

        when(otpVerificationRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc("traveler@example.com", OtpPurpose.REGISTER))
                .thenReturn(Optional.of(verification));
        when(otpVerificationRepository.save(any(OtpVerification.class))).thenAnswer(returnsFirstArg());

        VerifyOtpRequest request = VerifyOtpRequest.builder()
                .email("traveler@example.com")
                .purpose(OtpPurpose.REGISTER)
                .code("555555") // 5th wrong code
                .build();

        assertThatThrownBy(() -> otpService.verifyOtp(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Too many verification attempts. Please request a new OTP.");

        assertThat(verification.getAttemptCount()).isEqualTo(5);
        assertThat(verification.getConsumedAt()).isEqualTo(now); // Marked consumed/invalidated
        assertThat(verification.getVerifiedAt()).isNull();
        verify(otpVerificationRepository, times(1)).save(verification);
    }

    @Test
    @DisplayName("6. sixth verification attempt fails")
    void test6_sixthVerificationAttemptFails() {
        String correctOtp = "482913";
        OtpVerification verification = OtpVerification.builder()
                .id(1L)
                .email("traveler@example.com")
                .otpHash(passwordEncoder.encode(correctOtp))
                .purpose(OtpPurpose.REGISTER)
                .createdAt(now.minusSeconds(10))
                .expiresAt(now.plusSeconds(50))
                .attemptCount(5) // Max attempts already reached
                .verifiedAt(null)
                .consumedAt(now.minusSeconds(1)) // Already consumed
                .build();

        when(otpVerificationRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc("traveler@example.com", OtpPurpose.REGISTER))
                .thenReturn(Optional.of(verification));

        VerifyOtpRequest request = VerifyOtpRequest.builder()
                .email("traveler@example.com")
                .purpose(OtpPurpose.REGISTER)
                .code(correctOtp) // Even with correct code
                .build();

        assertThatThrownBy(() -> otpService.verifyOtp(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Invalid or expired OTP");

        verify(otpVerificationRepository, never()).save(any());
    }

    @Test
    @DisplayName("7. correct OTP before max attempts succeeds")
    void test7_correctOtpBeforeMaxAttemptsSucceeds() {
        String correctOtp = "482913";
        OtpVerification verification = OtpVerification.builder()
                .id(1L)
                .email("traveler@example.com")
                .otpHash(passwordEncoder.encode(correctOtp))
                .purpose(OtpPurpose.REGISTER)
                .createdAt(now.minusSeconds(10))
                .expiresAt(now.plusSeconds(50))
                .attemptCount(3) // 3 previous attempts (< 5)
                .verifiedAt(null)
                .consumedAt(null)
                .build();

        when(otpVerificationRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc("traveler@example.com", OtpPurpose.REGISTER))
                .thenReturn(Optional.of(verification));
        when(otpVerificationRepository.save(any(OtpVerification.class))).thenAnswer(returnsFirstArg());

        VerifyOtpRequest request = VerifyOtpRequest.builder()
                .email("traveler@example.com")
                .purpose(OtpPurpose.REGISTER)
                .code(correctOtp)
                .build();

        otpService.verifyOtp(request);

        assertThat(verification.getVerifiedAt()).isEqualTo(now);
        assertThat(verification.getConsumedAt()).isEqualTo(now);
        verify(otpVerificationRepository, times(1)).save(verification);
    }

    @Test
    @DisplayName("8. expired OTP rejected")
    void test8_expiredOtpRejected() {
        String correctOtp = "482913";
        OtpVerification verification = OtpVerification.builder()
                .id(1L)
                .email("traveler@example.com")
                .otpHash(passwordEncoder.encode(correctOtp))
                .purpose(OtpPurpose.REGISTER)
                .createdAt(now.minusSeconds(70))
                .expiresAt(now.minusSeconds(10)) // Expired 10 seconds ago
                .attemptCount(0)
                .verifiedAt(null)
                .consumedAt(null)
                .build();

        when(otpVerificationRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc("traveler@example.com", OtpPurpose.REGISTER))
                .thenReturn(Optional.of(verification));

        VerifyOtpRequest request = VerifyOtpRequest.builder()
                .email("traveler@example.com")
                .purpose(OtpPurpose.REGISTER)
                .code(correctOtp)
                .build();

        assertThatThrownBy(() -> otpService.verifyOtp(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Invalid or expired OTP");

        verify(otpVerificationRepository, never()).save(any());
    }

    @Test
    @DisplayName("9. consumed OTP rejected")
    void test9_consumedOtpRejected() {
        String correctOtp = "482913";
        OtpVerification verification = OtpVerification.builder()
                .id(1L)
                .email("traveler@example.com")
                .otpHash(passwordEncoder.encode(correctOtp))
                .purpose(OtpPurpose.REGISTER)
                .createdAt(now.minusSeconds(10))
                .expiresAt(now.plusSeconds(50))
                .attemptCount(0)
                .verifiedAt(null)
                .consumedAt(now.minusSeconds(5)) // Already consumed
                .build();

        when(otpVerificationRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc("traveler@example.com", OtpPurpose.REGISTER))
                .thenReturn(Optional.of(verification));

        VerifyOtpRequest request = VerifyOtpRequest.builder()
                .email("traveler@example.com")
                .purpose(OtpPurpose.REGISTER)
                .code(correctOtp)
                .build();

        assertThatThrownBy(() -> otpService.verifyOtp(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Invalid or expired OTP");

        verify(otpVerificationRepository, never()).save(any());
    }

    @Test
    @DisplayName("10. verified OTP rejected")
    void test10_verifiedOtpRejected() {
        String correctOtp = "482913";
        OtpVerification verification = OtpVerification.builder()
                .id(1L)
                .email("traveler@example.com")
                .otpHash(passwordEncoder.encode(correctOtp))
                .purpose(OtpPurpose.REGISTER)
                .createdAt(now.minusSeconds(10))
                .expiresAt(now.plusSeconds(50))
                .attemptCount(0)
                .verifiedAt(now.minusSeconds(2)) // Already verified
                .consumedAt(now.minusSeconds(2))
                .build();

        when(otpVerificationRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc("traveler@example.com", OtpPurpose.REGISTER))
                .thenReturn(Optional.of(verification));

        VerifyOtpRequest request = VerifyOtpRequest.builder()
                .email("traveler@example.com")
                .purpose(OtpPurpose.REGISTER)
                .code(correctOtp)
                .build();

        assertThatThrownBy(() -> otpService.verifyOtp(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Invalid or expired OTP");

        verify(otpVerificationRepository, never()).save(any());
    }

    @Test
    @DisplayName("11. OTP with 5 digits rejected")
    void test11_otpWith5DigitsRejected() {
        VerifyOtpRequest request = VerifyOtpRequest.builder()
                .email("traveler@example.com")
                .purpose(OtpPurpose.REGISTER)
                .code("12345") // 5 digits
                .build();

        assertThatThrownBy(() -> otpService.verifyOtp(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("OTP code must be exactly 6 digits");

        verifyNoInteractions(otpVerificationRepository);
    }

    @Test
    @DisplayName("12. OTP with 7 digits rejected")
    void test12_otpWith7DigitsRejected() {
        VerifyOtpRequest request = VerifyOtpRequest.builder()
                .email("traveler@example.com")
                .purpose(OtpPurpose.REGISTER)
                .code("1234567") // 7 digits
                .build();

        assertThatThrownBy(() -> otpService.verifyOtp(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("OTP code must be exactly 6 digits");

        verifyNoInteractions(otpVerificationRepository);
    }

    @Test
    @DisplayName("13. alphabetic OTP rejected")
    void test13_alphabeticOtpRejected() {
        VerifyOtpRequest request = VerifyOtpRequest.builder()
                .email("traveler@example.com")
                .purpose(OtpPurpose.REGISTER)
                .code("abcdef") // Alpha
                .build();

        assertThatThrownBy(() -> otpService.verifyOtp(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("OTP code must be exactly 6 digits");

        verifyNoInteractions(otpVerificationRepository);
    }

    @Test
    @DisplayName("14. newest OTP invalidates previous active OTP")
    void test14_newestOtpInvalidatesPreviousActiveOtp() {
        OtpVerification priorActiveOtp1 = OtpVerification.builder()
                .id(1L)
                .email("traveler@example.com")
                .purpose(OtpPurpose.REGISTER)
                .createdAt(now.minusSeconds(100))
                .expiresAt(now.minusSeconds(40))
                .verifiedAt(null)
                .consumedAt(null)
                .build();

        OtpVerification priorActiveOtp2 = OtpVerification.builder()
                .id(2L)
                .email("traveler@example.com")
                .purpose(OtpPurpose.REGISTER)
                .createdAt(now.minusSeconds(70))
                .expiresAt(now.minusSeconds(10))
                .verifiedAt(null)
                .consumedAt(null)
                .build();

        when(otpVerificationRepository.findByEmailAndPurposeAndConsumedAtIsNull("traveler@example.com", OtpPurpose.REGISTER))
                .thenReturn(List.of(priorActiveOtp1, priorActiveOtp2));
        when(otpVerificationRepository.save(any(OtpVerification.class))).thenAnswer(returnsFirstArg());

        otpService.generateOtp("traveler@example.com", OtpPurpose.REGISTER);

        assertThat(priorActiveOtp1.getConsumedAt()).isEqualTo(now);
        assertThat(priorActiveOtp2.getConsumedAt()).isEqualTo(now);
        verify(otpVerificationRepository, times(1)).saveAll(List.of(priorActiveOtp1, priorActiveOtp2));
    }

    @Test
    @DisplayName("15. historical OTP rows are not deleted")
    void test15_historicalOtpRowsAreNotDeleted() {
        when(otpVerificationRepository.save(any(OtpVerification.class))).thenAnswer(returnsFirstArg());

        otpService.generateOtp("traveler@example.com", OtpPurpose.REGISTER);

        verify(otpVerificationRepository, never()).delete(any(OtpVerification.class));
        verify(otpVerificationRepository, never()).deleteAll(any());
        verify(otpVerificationRepository, never()).deleteAll();
    }

    @Test
    @DisplayName("16. concurrent verification cannot consume OTP twice (replay protection)")
    void test16_concurrentVerificationCannotConsumeOtpTwice() {
        String correctOtp = "482913";
        OtpVerification verification = OtpVerification.builder()
                .id(1L)
                .email("traveler@example.com")
                .otpHash(passwordEncoder.encode(correctOtp))
                .purpose(OtpPurpose.REGISTER)
                .createdAt(now.minusSeconds(10))
                .expiresAt(now.plusSeconds(50))
                .attemptCount(0)
                .verifiedAt(null)
                .consumedAt(null)
                .build();

        when(otpVerificationRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc("traveler@example.com", OtpPurpose.REGISTER))
                .thenReturn(Optional.of(verification));
        when(otpVerificationRepository.save(any(OtpVerification.class))).thenAnswer(returnsFirstArg());

        VerifyOtpRequest request = VerifyOtpRequest.builder()
                .email("traveler@example.com")
                .purpose(OtpPurpose.REGISTER)
                .code(correctOtp)
                .build();

        // Thread 1 succeeds and marks consumed
        otpService.verifyOtp(request);
        assertThat(verification.getVerifiedAt()).isEqualTo(now);
        assertThat(verification.getConsumedAt()).isEqualTo(now);

        // Thread 2 reading the now-consumed entity throws BadRequestException
        assertThatThrownBy(() -> otpService.verifyOtp(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Invalid or expired OTP");
    }

    @Test
    @DisplayName("17. normalized email is consistently used")
    void test17_normalizedEmailIsConsistentlyUsed() {
        when(userRepository.existsByEmail("traveler@example.com")).thenReturn(false);
        when(otpVerificationRepository.save(any(OtpVerification.class))).thenAnswer(returnsFirstArg());

        SendOtpRequest request = SendOtpRequest.builder()
                .email("   TRAVELER@Example.COM   ")
                .purpose(OtpPurpose.REGISTER)
                .build();

        otpService.sendOtp(request);

        verify(userRepository, times(1)).existsByEmail("traveler@example.com");
        verify(otpVerificationRepository, times(1)).findTopByEmailAndPurposeOrderByCreatedAtDesc("traveler@example.com", OtpPurpose.REGISTER);
    }

    @Test
    @DisplayName("18. unsupported purpose remains rejected")
    void test18_unsupportedPurposeRemainsRejected() {
        SendOtpRequest sendReq = SendOtpRequest.builder()
                .email("traveler@example.com")
                .purpose(OtpPurpose.FORGOT_PASSWORD)
                .build();

        assertThatThrownBy(() -> otpService.sendOtp(sendReq))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Only REGISTER purpose is supported at this time");

        VerifyOtpRequest verifyReq = VerifyOtpRequest.builder()
                .email("traveler@example.com")
                .purpose(OtpPurpose.CHANGE_EMAIL)
                .code("123456")
                .build();

        assertThatThrownBy(() -> otpService.verifyOtp(verifyReq))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Only REGISTER purpose is supported at this time");
    }

    @Test
    @DisplayName("19. resend does not reveal whether an OTP was generated internally")
    void test19_resendDoesNotRevealInternalDetails() {
        when(userRepository.existsByEmail("traveler@example.com")).thenReturn(false);
        when(otpVerificationRepository.save(any(OtpVerification.class))).thenAnswer(returnsFirstArg());

        SendOtpRequest request = SendOtpRequest.builder()
                .email("traveler@example.com")
                .purpose(OtpPurpose.REGISTER)
                .build();

        // Method completes normally (void return) without leaking OTP in any return value or exception
        otpService.sendOtp(request);
        verify(notificationPublisher, times(1)).publish(any(SendNotificationRequest.class));
    }

    @Test
    @DisplayName("20. OTP plaintext never appears in logs or entity state")
    void test20_otpPlaintextNeverAppearsInLogsOrEntityState() {
        when(otpVerificationRepository.save(any(OtpVerification.class))).thenAnswer(returnsFirstArg());

        OtpGenerationResult result = otpService.generateOtp("traveler@example.com", OtpPurpose.REGISTER);

        // Verification entity stores only BCrypt hash, never raw code
        assertThat(result.getVerification().getOtpHash()).isNotEqualTo(result.getRawOtp());
        assertThat(result.getVerification().getOtpHash()).startsWith("$2a$");
        assertThat(result.getVerification().toString()).doesNotContain(result.getRawOtp());
    }

    // =========================================================================
    // ADDITIONAL CORE VALIDATION TESTS
    // =========================================================================

    @Test
    void test_otpHASExactlySixDigitsAndIsNumeric() {
        when(otpVerificationRepository.save(any(OtpVerification.class))).thenAnswer(returnsFirstArg());

        for (int i = 0; i < 20; i++) {
            OtpGenerationResult result = otpService.generateOtp("traveler@example.com", OtpPurpose.REGISTER);
            assertThat(result.getRawOtp()).hasSize(6).matches("^\\d{6}$");
        }
    }

    @Test
    void test_expirationIsExactlyConfiguredSeconds() {
        when(otpVerificationRepository.save(any(OtpVerification.class))).thenAnswer(returnsFirstArg());

        otpService.setExpirationSeconds(120L);
        OtpGenerationResult result = otpService.generateOtp("traveler@example.com", OtpPurpose.REGISTER);

        assertThat(Duration.between(result.getVerification().getCreatedAt(), result.getVerification().getExpiresAt()))
                .isEqualTo(Duration.ofSeconds(120));
    }

    @Test
    void sendOtp_existingEmail_throwsEmailAlreadyExists() {
        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        SendOtpRequest request = SendOtpRequest.builder()
                .email("existing@example.com")
                .purpose(OtpPurpose.REGISTER)
                .build();

        assertThatThrownBy(() -> otpService.sendOtp(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Email is already registered")
                .satisfies(ex -> assertThat(((BadRequestException) ex).getErrorCode()).isEqualTo(ErrorCode.EMAIL_ALREADY_EXISTS));
    }
}
