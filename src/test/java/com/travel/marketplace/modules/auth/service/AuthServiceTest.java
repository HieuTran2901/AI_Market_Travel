package com.travel.marketplace.modules.auth.service;

import com.travel.marketplace.exception.BadRequestException;
import com.travel.marketplace.exception.BusinessException;
import com.travel.marketplace.exception.ErrorCode;
import com.travel.marketplace.modules.auth.dto.LoginRequest;
import com.travel.marketplace.modules.auth.dto.RegisterRequest;
import com.travel.marketplace.modules.auth.dto.TokenRefreshRequest;
import com.travel.marketplace.modules.auth.entity.OtpVerification;
import com.travel.marketplace.modules.auth.enums.OtpPurpose;
import com.travel.marketplace.modules.auth.repository.OtpVerificationRepository;
import com.travel.marketplace.modules.provider.enums.BusinessType;
import com.travel.marketplace.modules.provider.enums.VerificationStatus;
import com.travel.marketplace.modules.user.entity.Role;
import com.travel.marketplace.modules.user.entity.User;
import com.travel.marketplace.modules.user.repository.ProviderProfileRepository;
import com.travel.marketplace.modules.user.repository.RoleRepository;
import com.travel.marketplace.modules.user.repository.UserRepository;
import com.travel.marketplace.security.JwtTokenProvider;
import com.travel.marketplace.security.UserPrincipal;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private ProviderProfileRepository providerProfileRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private UserDetailsService userDetailsService;

    @Mock
    private OtpVerificationRepository otpVerificationRepository;

    @Test
    void register_successfulCustomerRegistration_whenOtpVerifiedAndConsumed() {
        AuthService service = createService();
        RegisterRequest request = RegisterRequest.builder()
                .email("newuser@example.com")
                .password("SecurePass123!")
                .firstName("John")
                .lastName("Doe")
                .phoneNumber("0901234567")
                .isProvider(false)
                .build();

        Instant verifiedAt = Instant.parse("2026-08-17T10:00:00Z");
        OtpVerification verification = OtpVerification.builder()
                .id(1L)
                .email("newuser@example.com")
                .otpHash("hashed-otp")
                .purpose(OtpPurpose.REGISTER)
                .expiresAt(Instant.parse("2026-08-17T10:01:00Z"))
                .verifiedAt(verifiedAt)
                .consumedAt(verifiedAt)
                .attemptCount(1)
                .createdAt(Instant.parse("2026-08-17T09:59:30Z"))
                .build();

        Role customerRole = Role.builder().id(1L).name("ROLE_CUSTOMER").build();

        when(userRepository.existsByEmail("newuser@example.com")).thenReturn(false);
        when(otpVerificationRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc("newuser@example.com", OtpPurpose.REGISTER))
                .thenReturn(Optional.of(verification));
        when(roleRepository.findByName("ROLE_CUSTOMER")).thenReturn(Optional.of(customerRole));
        when(passwordEncoder.encode("SecurePass123!")).thenReturn("encoded-password");

        service.register(request);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());

        User savedUser = userCaptor.getValue();
        assertThat(savedUser.getEmail()).isEqualTo("newuser@example.com");
        assertThat(savedUser.getPassword()).isEqualTo("encoded-password");
        assertThat(savedUser.getFullName()).isEqualTo("John Doe");
        assertThat(savedUser.getPhoneNumber()).isEqualTo("0901234567");
        assertThat(savedUser.isEmailVerified()).isTrue();
        assertThat(savedUser.getEmailVerifiedAt()).isEqualTo(verifiedAt);
        assertThat(savedUser.isActive()).isTrue();
        assertThat(savedUser.getRoles()).contains(customerRole);
        assertThat(savedUser.getProviderProfile()).isNull();
    }

    @Test
    void register_throwsBadRequest_whenNoOtpRecordExists() {
        AuthService service = createService();
        RegisterRequest request = RegisterRequest.builder()
                .email("unverified@example.com")
                .password("SecurePass123!")
                .firstName("John")
                .lastName("Doe")
                .build();

        when(userRepository.existsByEmail("unverified@example.com")).thenReturn(false);
        when(otpVerificationRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc("unverified@example.com", OtpPurpose.REGISTER))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.register(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Email verification is required");

        verify(userRepository, never()).save(any());
    }

    @Test
    void register_throwsBadRequest_whenOtpRecordVerifiedAtIsNull() {
        AuthService service = createService();
        RegisterRequest request = RegisterRequest.builder()
                .email("unverified@example.com")
                .password("SecurePass123!")
                .firstName("John")
                .lastName("Doe")
                .build();

        OtpVerification unverifiedOtp = OtpVerification.builder()
                .id(2L)
                .email("unverified@example.com")
                .otpHash("hashed")
                .purpose(OtpPurpose.REGISTER)
                .expiresAt(Instant.now().plusSeconds(60))
                .verifiedAt(null)
                .consumedAt(null)
                .build();

        when(userRepository.existsByEmail("unverified@example.com")).thenReturn(false);
        when(otpVerificationRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc("unverified@example.com", OtpPurpose.REGISTER))
                .thenReturn(Optional.of(unverifiedOtp));

        assertThatThrownBy(() -> service.register(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Email verification is required");

        verify(userRepository, never()).save(any());
    }

    @Test
    void register_throwsBadRequest_whenOtpRecordConsumedAtIsNull() {
        AuthService service = createService();
        RegisterRequest request = RegisterRequest.builder()
                .email("unconsumed@example.com")
                .password("SecurePass123!")
                .firstName("John")
                .lastName("Doe")
                .build();

        OtpVerification unconsumedOtp = OtpVerification.builder()
                .id(3L)
                .email("unconsumed@example.com")
                .otpHash("hashed")
                .purpose(OtpPurpose.REGISTER)
                .expiresAt(Instant.now().plusSeconds(60))
                .verifiedAt(Instant.now())
                .consumedAt(null)
                .build();

        when(userRepository.existsByEmail("unconsumed@example.com")).thenReturn(false);
        when(otpVerificationRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc("unconsumed@example.com", OtpPurpose.REGISTER))
                .thenReturn(Optional.of(unconsumedOtp));

        assertThatThrownBy(() -> service.register(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Email verification is required");

        verify(userRepository, never()).save(any());
    }

    @Test
    void register_throwsBadRequest_whenEmailAlreadyExists() {
        AuthService service = createService();
        RegisterRequest request = RegisterRequest.builder()
                .email("existing@example.com")
                .password("SecurePass123!")
                .firstName("John")
                .lastName("Doe")
                .build();

        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        assertThatThrownBy(() -> service.register(request))
                .isInstanceOf(BadRequestException.class)
                .satisfies(ex -> {
                    BadRequestException bre = (BadRequestException) ex;
                    assertThat(bre.getErrorCode()).isEqualTo(ErrorCode.EMAIL_ALREADY_EXISTS);
                    assertThat(bre.getMessage()).isEqualTo("Email is already registered");
                });

        verify(otpVerificationRepository, never()).findTopByEmailAndPurposeOrderByCreatedAtDesc(any(), any());
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_succeedsEvenIfOtpWindowExpired_whenVerifiedAndConsumed() {
        AuthService service = createService();
        RegisterRequest request = RegisterRequest.builder()
                .email("late_signup@example.com")
                .password("SecurePass123!")
                .firstName("Alice")
                .lastName("Smith")
                .build();

        Instant verifiedAt = Instant.parse("2026-08-17T10:00:00Z");
        Instant expiresAt = Instant.parse("2026-08-17T10:01:00Z"); // expired relative to registration time
        OtpVerification expiredWindowOtp = OtpVerification.builder()
                .id(4L)
                .email("late_signup@example.com")
                .otpHash("hashed")
                .purpose(OtpPurpose.REGISTER)
                .expiresAt(expiresAt)
                .verifiedAt(verifiedAt)
                .consumedAt(verifiedAt)
                .createdAt(Instant.parse("2026-08-17T09:59:30Z"))
                .build();

        Role customerRole = Role.builder().id(1L).name("ROLE_CUSTOMER").build();

        when(userRepository.existsByEmail("late_signup@example.com")).thenReturn(false);
        when(otpVerificationRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc("late_signup@example.com", OtpPurpose.REGISTER))
                .thenReturn(Optional.of(expiredWindowOtp));
        when(roleRepository.findByName("ROLE_CUSTOMER")).thenReturn(Optional.of(customerRole));
        when(passwordEncoder.encode(any())).thenReturn("encoded");

        service.register(request);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().isEmailVerified()).isTrue();
        assertThat(captor.getValue().getEmailVerifiedAt()).isEqualTo(verifiedAt);
    }

    @Test
    void register_normalizesEmailBeforeOtpLookupAndUserSave() {
        AuthService service = createService();
        RegisterRequest request = RegisterRequest.builder()
                .email("  USER.Test@Example.COM  ")
                .password("SecurePass123!")
                .firstName("Test")
                .lastName("User")
                .build();

        Instant verifiedAt = Instant.parse("2026-08-17T10:00:00Z");
        OtpVerification otp = OtpVerification.builder()
                .email("user.test@example.com")
                .purpose(OtpPurpose.REGISTER)
                .verifiedAt(verifiedAt)
                .consumedAt(verifiedAt)
                .build();

        Role customerRole = Role.builder().id(1L).name("ROLE_CUSTOMER").build();

        when(userRepository.existsByEmail("user.test@example.com")).thenReturn(false);
        when(otpVerificationRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc("user.test@example.com", OtpPurpose.REGISTER))
                .thenReturn(Optional.of(otp));
        when(roleRepository.findByName("ROLE_CUSTOMER")).thenReturn(Optional.of(customerRole));
        when(passwordEncoder.encode(any())).thenReturn("encoded");

        service.register(request);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getEmail()).isEqualTo("user.test@example.com");
    }

    @Test
    void register_successfulProviderRegistration_createsProviderProfileWithPendingStatus() {
        AuthService service = createService();
        RegisterRequest request = RegisterRequest.builder()
                .email("hotel@example.com")
                .password("SecurePass123!")
                .fullName("Grand Hotel Manager")
                .phoneNumber("0987654321")
                .isProvider(true)
                .businessType("HOTEL")
                .businessName("Grand Hotel")
                .address("123 Main St")
                .city("Da Nang")
                .taxCode("TAX-12345")
                .bankName("Vietcombank")
                .bankAccountNumber("123456789")
                .bankAccountName("Grand Hotel Co.")
                .build();

        Instant verifiedAt = Instant.parse("2026-08-17T10:00:00Z");
        OtpVerification otp = OtpVerification.builder()
                .email("hotel@example.com")
                .purpose(OtpPurpose.REGISTER)
                .verifiedAt(verifiedAt)
                .consumedAt(verifiedAt)
                .build();

        Role customerRole = Role.builder().id(1L).name("ROLE_CUSTOMER").build();
        Role providerRole = Role.builder().id(2L).name("ROLE_PROVIDER_HOTEL").build();

        when(userRepository.existsByEmail("hotel@example.com")).thenReturn(false);
        when(otpVerificationRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc("hotel@example.com", OtpPurpose.REGISTER))
                .thenReturn(Optional.of(otp));
        when(roleRepository.findByName("ROLE_CUSTOMER")).thenReturn(Optional.of(customerRole));
        when(roleRepository.findByName("ROLE_PROVIDER_HOTEL")).thenReturn(Optional.of(providerRole));
        when(passwordEncoder.encode(any())).thenReturn("encoded");

        service.register(request);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());

        User savedUser = captor.getValue();
        assertThat(savedUser.getEmail()).isEqualTo("hotel@example.com");
        assertThat(savedUser.isEmailVerified()).isTrue();
        assertThat(savedUser.getEmailVerifiedAt()).isEqualTo(verifiedAt);
        assertThat(savedUser.getRoles()).containsExactlyInAnyOrder(customerRole, providerRole);
        assertThat(savedUser.getProviderProfile()).isNotNull();
        assertThat(savedUser.getProviderProfile().getBusinessName()).isEqualTo("Grand Hotel");
        assertThat(savedUser.getProviderProfile().getBusinessType()).isEqualTo(BusinessType.HOTEL);
        assertThat(savedUser.getProviderProfile().getVerificationStatus()).isEqualTo(VerificationStatus.PENDING);
        assertThat(savedUser.getProviderProfile().getUser()).isSameAs(savedUser);
    }

    @Test
    void register_throwsBadRequest_whenFullNameAndFirstLastNameBlank() {
        AuthService service = createService();
        RegisterRequest request = RegisterRequest.builder()
                .email("noname@example.com")
                .password("SecurePass123!")
                .firstName("")
                .lastName("")
                .fullName("")
                .build();

        OtpVerification otp = OtpVerification.builder()
                .email("noname@example.com")
                .purpose(OtpPurpose.REGISTER)
                .verifiedAt(Instant.now())
                .consumedAt(Instant.now())
                .build();

        when(userRepository.existsByEmail("noname@example.com")).thenReturn(false);
        when(otpVerificationRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc("noname@example.com", OtpPurpose.REGISTER))
                .thenReturn(Optional.of(otp));

        assertThatThrownBy(() -> service.register(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("First name and last name are required");

        verify(userRepository, never()).save(any());
    }

    @Test
    void register_throwsBadRequest_whenProviderBusinessTypeInvalid() {
        AuthService service = createService();
        RegisterRequest request = RegisterRequest.builder()
                .email("provider@example.com")
                .password("SecurePass123!")
                .firstName("Jane")
                .lastName("Doe")
                .isProvider(true)
                .businessType("INVALID_TYPE")
                .build();

        OtpVerification otp = OtpVerification.builder()
                .email("provider@example.com")
                .purpose(OtpPurpose.REGISTER)
                .verifiedAt(Instant.now())
                .consumedAt(Instant.now())
                .build();

        Role customerRole = Role.builder().id(1L).name("ROLE_CUSTOMER").build();

        when(userRepository.existsByEmail("provider@example.com")).thenReturn(false);
        when(otpVerificationRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc("provider@example.com", OtpPurpose.REGISTER))
                .thenReturn(Optional.of(otp));
        when(roleRepository.findByName("ROLE_CUSTOMER")).thenReturn(Optional.of(customerRole));

        assertThatThrownBy(() -> service.register(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid business type");

        verify(userRepository, never()).save(any());
    }

    @Test
    void register_throwsBadRequest_whenProviderBusinessTypeMissing() {
        AuthService service = createService();
        RegisterRequest request = RegisterRequest.builder()
                .email("provider@example.com")
                .password("SecurePass123!")
                .firstName("Jane")
                .lastName("Doe")
                .isProvider(true)
                .businessType(null)
                .build();

        OtpVerification otp = OtpVerification.builder()
                .email("provider@example.com")
                .purpose(OtpPurpose.REGISTER)
                .verifiedAt(Instant.now())
                .consumedAt(Instant.now())
                .build();

        Role customerRole = Role.builder().id(1L).name("ROLE_CUSTOMER").build();

        when(userRepository.existsByEmail("provider@example.com")).thenReturn(false);
        when(otpVerificationRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc("provider@example.com", OtpPurpose.REGISTER))
                .thenReturn(Optional.of(otp));
        when(roleRepository.findByName("ROLE_CUSTOMER")).thenReturn(Optional.of(customerRole));

        assertThatThrownBy(() -> service.register(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Provider business type is required");

        verify(userRepository, never()).save(any());
    }

    @Test
    void loginReturnsAccountBannedForBannedDisabledUser() {
        AuthService service = createService();
        LoginRequest request = new LoginRequest();
        request.setEmail("banned@example.com");
        request.setPassword("secret");
        User bannedUser = User.builder()
                .id(10L)
                .email("banned@example.com")
                .fullName("Banned User")
                .isActive(false)
                .bannedAt(Instant.parse("2026-02-01T00:00:00Z"))
                .roles(Set.of())
                .build();

        when(authenticationManager.authenticate(any())).thenThrow(new DisabledException("User is disabled"));
        when(userRepository.findByEmail("banned@example.com")).thenReturn(Optional.of(bannedUser));

        assertThatThrownBy(() -> service.login(request))
                .isInstanceOf(BusinessException.class)
                .satisfies(error -> {
                    BusinessException exception = (BusinessException) error;
                    assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.ACCOUNT_BANNED);
                    assertThat(exception.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(exception.getDetails())
                            .containsEntry("email", "banned@example.com")
                            .containsEntry("reasonCode", "POLICY_VIOLATION")
                            .containsEntry("reasonLabel", "Policy violation")
                            .containsEntry("bannedAt", "2026-02-01T00:00:00Z");
                    assertThat(exception.getDetails().get("reason"))
                            .isEqualTo("Your account was restricted for violating platform policies.");
                });
    }

    @Test
    void loginReturnsInvalidCredentialsForBadPassword() {
        AuthService service = createService();
        LoginRequest request = new LoginRequest();
        request.setEmail("user@example.com");
        request.setPassword("wrong");

        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("Bad credentials"));

        assertThatThrownBy(() -> service.login(request))
                .isInstanceOf(BusinessException.class)
                .satisfies(error -> {
                    BusinessException exception = (BusinessException) error;
                    assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.INVALID_CREDENTIALS);
                    assertThat(exception.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED);
                });
    }

    @Test
    void refreshTokenReturnsAccountBannedForBannedUser() {
        AuthService service = createService();
        TokenRefreshRequest request = new TokenRefreshRequest();
        request.setRefreshToken("refresh-token");
        @SuppressWarnings("unchecked")
        Map<String, String> refreshTokenStore = (Map<String, String>) ReflectionTestUtils.getField(service, "refreshTokenStore");
        refreshTokenStore.put("banned@example.com", "refresh-token");
        User bannedUser = User.builder()
                .id(10L)
                .email("banned@example.com")
                .password("encoded")
                .fullName("Banned User")
                .isActive(false)
                .bannedAt(Instant.parse("2026-02-01T00:00:00Z"))
                .banReasonCode("POLICY_VIOLATION")
                .banReason("Repeated suspicious booking activity and spam behavior.")
                .roles(Set.of())
                .build();

        when(tokenProvider.validateToken("refresh-token")).thenReturn(true);
        when(tokenProvider.getEmailFromToken("refresh-token")).thenReturn("banned@example.com");
        when(userDetailsService.loadUserByUsername("banned@example.com")).thenReturn(UserPrincipal.create(bannedUser));
        when(userRepository.findByEmail("banned@example.com")).thenReturn(Optional.of(bannedUser));

        assertThatThrownBy(() -> service.refreshToken(request))
                .isInstanceOf(BusinessException.class)
                .satisfies(error -> {
                    BusinessException exception = (BusinessException) error;
                    assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.ACCOUNT_BANNED);
                    assertThat(exception.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(exception.getDetails())
                            .containsEntry("reasonCode", "POLICY_VIOLATION")
                            .containsEntry("reasonLabel", "Policy violation")
                            .containsEntry("bannedAt", "2026-02-01T00:00:00Z")
                            .containsEntry("reason", "Repeated suspicious booking activity and spam behavior.");
                });
    }

    private AuthService createService() {
        return new AuthService(
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
}
