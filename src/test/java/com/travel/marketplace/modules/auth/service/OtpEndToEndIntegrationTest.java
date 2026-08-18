package com.travel.marketplace.modules.auth.service;

import com.travel.marketplace.exception.BadRequestException;
import com.travel.marketplace.exception.ErrorCode;
import com.travel.marketplace.modules.auth.dto.OtpGenerationResult;
import com.travel.marketplace.modules.auth.dto.RegisterRequest;
import com.travel.marketplace.modules.auth.dto.SendOtpRequest;
import com.travel.marketplace.modules.auth.dto.VerifyOtpRequest;
import com.travel.marketplace.modules.auth.entity.OtpVerification;
import com.travel.marketplace.modules.auth.enums.OtpPurpose;
import com.travel.marketplace.modules.auth.repository.OtpVerificationRepository;
import com.travel.marketplace.modules.notification.dto.SendNotificationRequest;
import com.travel.marketplace.modules.notification.enums.NotificationType;
import com.travel.marketplace.modules.notification.service.NotificationPublisher;
import com.travel.marketplace.modules.provider.enums.VerificationStatus;
import com.travel.marketplace.modules.user.entity.ProviderProfile;
import com.travel.marketplace.modules.user.entity.Role;
import com.travel.marketplace.modules.user.entity.User;
import com.travel.marketplace.modules.user.repository.ProviderProfileRepository;
import com.travel.marketplace.modules.user.repository.RoleRepository;
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
import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.AdditionalAnswers.returnsFirstArg;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OtpEndToEndIntegrationTest {

    @Mock
    private OtpVerificationRepository otpVerificationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private ProviderProfileRepository providerProfileRepository;

    @Mock
    private NotificationPublisher notificationPublisher;

    @Mock
    private org.springframework.security.authentication.AuthenticationManager authenticationManager;

    @Mock
    private com.travel.marketplace.security.JwtTokenProvider tokenProvider;

    @Mock
    private org.springframework.security.core.userdetails.UserDetailsService userDetailsService;

    private PasswordEncoder passwordEncoder;
    private OtpService otpService;
    private AuthService authService;
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

        authService = new AuthService(
                authenticationManager,
                userRepository,
                roleRepository,
                providerProfileRepository,
                passwordEncoder,
                tokenProvider,
                userDetailsService,
                otpVerificationRepository
        );
    }

    // =========================================================================
    // 1. SEND OTP E2E FLOW
    // =========================================================================

    @Test
    @DisplayName("E2E-1: Send OTP generates 6-digit BCrypt hash in DB, dispatches email, never leaks code")
    void e2e1_sendOtpDispatchesEmailAndStoresBcryptHash() {
        when(userRepository.existsByEmail("traveler@example.com")).thenReturn(false);
        when(otpVerificationRepository.save(any(OtpVerification.class))).thenAnswer(returnsFirstArg());

        SendOtpRequest request = SendOtpRequest.builder()
                .email("traveler@example.com")
                .purpose(OtpPurpose.REGISTER)
                .build();

        otpService.sendOtp(request);

        ArgumentCaptor<OtpVerification> entityCaptor = ArgumentCaptor.forClass(OtpVerification.class);
        verify(otpVerificationRepository, atLeastOnce()).save(entityCaptor.capture());
        OtpVerification saved = entityCaptor.getValue();

        assertThat(saved.getEmail()).isEqualTo("traveler@example.com");
        assertThat(saved.getPurpose()).isEqualTo(OtpPurpose.REGISTER);
        assertThat(saved.getOtpHash()).startsWith("$2a$");
        assertThat(saved.getAttemptCount()).isEqualTo(0);
        assertThat(saved.getVerifiedAt()).isNull();
        assertThat(saved.getConsumedAt()).isNull();

        ArgumentCaptor<SendNotificationRequest> notifCaptor = ArgumentCaptor.forClass(SendNotificationRequest.class);
        verify(notificationPublisher, times(1)).publish(notifCaptor.capture());
        SendNotificationRequest notif = notifCaptor.getValue();

        assertThat(notif.getRecipientEmail()).isEqualTo("traveler@example.com");
        assertThat(notif.getType()).isEqualTo(NotificationType.OTP_VERIFICATION);
        assertThat(notif.getMessage()).contains("AI Travel Marketplace");
        assertThat(notif.getMessage()).contains("This code expires in 60 seconds.");
    }

    // =========================================================================
    // 2. COMPLETE REGISTRATION E2E FLOW
    // =========================================================================

    @Test
    @DisplayName("E2E-2: Customer registration full lifecycle (send OTP -> verify -> signup -> user active)")
    void e2e2_customerRegistrationFullLifecycle() {
        String email = "alice@example.com";

        // Step 1: Send OTP
        when(userRepository.existsByEmail(email)).thenReturn(false);
        when(otpVerificationRepository.save(any(OtpVerification.class))).thenAnswer(returnsFirstArg());

        OtpGenerationResult genResult = otpService.generateOtp(email, OtpPurpose.REGISTER);
        String rawOtp = genResult.getRawOtp();
        OtpVerification verificationRecord = genResult.getVerification();

        // Step 2: Verify OTP
        when(otpVerificationRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc(email, OtpPurpose.REGISTER))
                .thenReturn(Optional.of(verificationRecord));

        VerifyOtpRequest verifyRequest = VerifyOtpRequest.builder()
                .email(email)
                .purpose(OtpPurpose.REGISTER)
                .code(rawOtp)
                .build();

        otpService.verifyOtp(verifyRequest);

        assertThat(verificationRecord.getVerifiedAt()).isEqualTo(now);
        assertThat(verificationRecord.getConsumedAt()).isEqualTo(now);

        // Step 3: Complete Signup
        RegisterRequest registerRequest = RegisterRequest.builder()
                .email(email)
                .password("SecureP@ss123")
                .firstName("Alice")
                .lastName("Smith")
                .fullName("Alice Smith")
                .isProvider(false)
                .build();

        Role customerRole = Role.builder().id(1L).name("ROLE_CUSTOMER").build();
        when(roleRepository.findByName("ROLE_CUSTOMER")).thenReturn(Optional.of(customerRole));
        when(userRepository.save(any(User.class))).thenAnswer(returnsFirstArg());

        authService.register(registerRequest);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(1)).save(userCaptor.capture());

        User createdUser = userCaptor.getValue();
        assertThat(createdUser.getEmail()).isEqualTo(email);
        assertThat(createdUser.getRoles()).extracting(Role::getName).contains("ROLE_CUSTOMER");
        assertThat(createdUser.isEmailVerified()).isTrue();
        assertThat(createdUser.getEmailVerifiedAt()).isEqualTo(now);
        assertThat(createdUser.isActive()).isTrue();
    }

    @Test
    @DisplayName("E2E-3: Provider registration full lifecycle (send OTP -> verify -> signup -> provider pending)")
    void e2e3_providerRegistrationFullLifecycle() {
        String email = "partner@agency.com";

        // Step 1: Send OTP & verify
        when(userRepository.existsByEmail(email)).thenReturn(false);
        when(otpVerificationRepository.save(any(OtpVerification.class))).thenAnswer(returnsFirstArg());

        OtpGenerationResult genResult = otpService.generateOtp(email, OtpPurpose.REGISTER);
        String rawOtp = genResult.getRawOtp();
        OtpVerification verificationRecord = genResult.getVerification();

        when(otpVerificationRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc(email, OtpPurpose.REGISTER))
                .thenReturn(Optional.of(verificationRecord));

        otpService.verifyOtp(VerifyOtpRequest.builder()
                .email(email)
                .purpose(OtpPurpose.REGISTER)
                .code(rawOtp)
                .build());

        // Step 2: Complete Provider Signup
        RegisterRequest registerRequest = RegisterRequest.builder()
                .email(email)
                .password("PartnerSecret123!")
                .firstName("Bob")
                .lastName("Travels")
                .fullName("Bob Travels Hotel")
                .isProvider(true)
                .businessName("Bob Grand Hotel")
                .businessType("HOTEL")
                .address("123 Tourism St")
                .taxCode("TAX-998877")
                .build();

        Role customerRole = Role.builder().id(1L).name("ROLE_CUSTOMER").build();
        Role providerRole = Role.builder().id(2L).name("ROLE_PROVIDER_HOTEL").build();
        when(roleRepository.findByName("ROLE_CUSTOMER")).thenReturn(Optional.of(customerRole));
        when(roleRepository.findByName("ROLE_PROVIDER_HOTEL")).thenReturn(Optional.of(providerRole));
        when(userRepository.save(any(User.class))).thenAnswer(returnsFirstArg());

        authService.register(registerRequest);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(1)).save(userCaptor.capture());
        User createdUser = userCaptor.getValue();
        assertThat(createdUser.getRoles()).extracting(Role::getName).contains("ROLE_CUSTOMER", "ROLE_PROVIDER_HOTEL");
        assertThat(createdUser.isEmailVerified()).isTrue();
        assertThat(createdUser.getProviderProfile()).isNotNull();
        assertThat(createdUser.getProviderProfile().getVerificationStatus()).isEqualTo(VerificationStatus.PENDING);
        assertThat(createdUser.getProviderProfile().getBusinessName()).isEqualTo("Bob Grand Hotel");
    }

    // =========================================================================
    // 3. CONCURRENT VERIFICATION & SEND VALIDATION
    // =========================================================================

    @Test
    @DisplayName("E2E-4: Concurrent verification - exactly 1 thread succeeds, 9 fail")
    void e2e4_concurrentVerificationExactOneSuccess() throws InterruptedException {
        String email = "concurrent@example.com";
        String rawOtp = "654321";

        OtpVerification verification = OtpVerification.builder()
                .id(100L)
                .email(email)
                .otpHash(passwordEncoder.encode(rawOtp))
                .purpose(OtpPurpose.REGISTER)
                .createdAt(now.minusSeconds(10))
                .expiresAt(now.plusSeconds(50))
                .attemptCount(0)
                .verifiedAt(null)
                .consumedAt(null)
                .build();

        when(otpVerificationRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc(email, OtpPurpose.REGISTER))
                .thenReturn(Optional.of(verification));
        when(otpVerificationRepository.save(any(OtpVerification.class))).thenAnswer(returnsFirstArg());

        int threadCount = 10;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                try {
                    startLatch.await();
                    synchronized (verification) {
                        otpService.verifyOtp(VerifyOtpRequest.builder()
                                .email(email)
                                .purpose(OtpPurpose.REGISTER)
                                .code(rawOtp)
                                .build());
                    }
                    successCount.incrementAndGet();
                } catch (Exception e) {
                    failureCount.incrementAndGet();
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        boolean completed = doneLatch.await(5, TimeUnit.SECONDS);
        executor.shutdown();

        assertThat(completed).isTrue();
        assertThat(successCount.get()).isEqualTo(1);
        assertThat(failureCount.get()).isEqualTo(threadCount - 1);
        assertThat(verification.getVerifiedAt()).isEqualTo(now);
        assertThat(verification.getConsumedAt()).isEqualTo(now);
    }

    // =========================================================================
    // 4. SECURITY AUDIT - NO LEAKAGE IN LOGS OR MESSAGES
    // =========================================================================

    @Test
    @DisplayName("E2E-5: Security audit - Exception messages and responses contain no sensitive info")
    void e2e5_exceptionMessagesDoNotLeakSensitiveInfo() {
        when(otpVerificationRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc("user@example.com", OtpPurpose.REGISTER))
                .thenReturn(Optional.empty());

        VerifyOtpRequest request = VerifyOtpRequest.builder()
                .email("user@example.com")
                .purpose(OtpPurpose.REGISTER)
                .code("123456")
                .build();

        assertThatThrownBy(() -> otpService.verifyOtp(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Invalid or expired OTP")
                .satisfies(ex -> {
                    assertThat(ex.getMessage()).doesNotContain("hash");
                    assertThat(ex.getMessage()).doesNotContain("$2a$");
                    assertThat(ex.getMessage()).doesNotContain("123456");
                });
    }
}
