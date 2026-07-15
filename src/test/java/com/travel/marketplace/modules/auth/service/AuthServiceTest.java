package com.travel.marketplace.modules.auth.service;

import com.travel.marketplace.exception.BusinessException;
import com.travel.marketplace.exception.ErrorCode;
import com.travel.marketplace.modules.auth.dto.LoginRequest;
import com.travel.marketplace.modules.auth.dto.TokenRefreshRequest;
import com.travel.marketplace.modules.user.entity.User;
import com.travel.marketplace.modules.user.repository.ProviderProfileRepository;
import com.travel.marketplace.modules.user.repository.RoleRepository;
import com.travel.marketplace.modules.user.repository.UserRepository;
import com.travel.marketplace.security.JwtTokenProvider;
import com.travel.marketplace.security.UserPrincipal;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
import static org.mockito.Mockito.when;

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
                userDetailsService
        );
    }
}
