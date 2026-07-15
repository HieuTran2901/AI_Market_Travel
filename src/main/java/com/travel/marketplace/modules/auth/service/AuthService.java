package com.travel.marketplace.modules.auth.service;

import com.travel.marketplace.exception.BadRequestException;
import com.travel.marketplace.exception.BusinessException;
import com.travel.marketplace.exception.ErrorCode;
import com.travel.marketplace.modules.auth.dto.LoginRequest;
import com.travel.marketplace.modules.auth.dto.RegisterRequest;
import com.travel.marketplace.modules.auth.dto.TokenRefreshRequest;
import com.travel.marketplace.modules.auth.dto.TokenResponse;
import com.travel.marketplace.modules.provider.enums.BusinessType;
import com.travel.marketplace.modules.provider.enums.VerificationStatus;
import com.travel.marketplace.modules.user.entity.ProviderProfile;
import com.travel.marketplace.modules.user.entity.Role;
import com.travel.marketplace.modules.user.entity.User;
import com.travel.marketplace.modules.user.repository.ProviderProfileRepository;
import com.travel.marketplace.modules.user.repository.RoleRepository;
import com.travel.marketplace.modules.user.repository.UserRepository;
import com.travel.marketplace.security.JwtTokenProvider;
import com.travel.marketplace.security.UserPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AccountExpiredException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.CredentialsExpiredException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Core authentication service: Register, Login, Refresh Token, Logout.
 *
 * Refresh tokens are stored in-memory (ConcurrentHashMap) for Phase 1/2.
 * This will be replaced with a persistent store (Redis or DB table) in Phase 5.
 *
 * Thread safety: ConcurrentHashMap provides safe concurrent reads/writes.
 * Limitation: tokens are lost on server restart (acceptable for development).
 */
@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    // In-memory refresh token store: email → refreshToken
    private final Map<String, String> refreshTokenStore = new ConcurrentHashMap<>();

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final UserDetailsService userDetailsService;

    public AuthService(
            AuthenticationManager authenticationManager,
            UserRepository userRepository,
            RoleRepository roleRepository,
            ProviderProfileRepository providerProfileRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider tokenProvider,
            UserDetailsService userDetailsService
    ) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.providerProfileRepository = providerProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.userDetailsService = userDetailsService;
    }

    @Transactional
    public void register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered", ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        String fullName = resolveFullName(request);
        if (fullName.isBlank()) {
            throw new BadRequestException("First name and last name are required");
        }

        Set<Role> roles = new HashSet<>();

        // Every registered account receives ROLE_CUSTOMER by default
        Role customerRole = roleRepository.findByName("ROLE_CUSTOMER")
                .orElseThrow(() -> new BadRequestException("Default Customer Role not found in database"));
        roles.add(customerRole);

        ProviderProfile providerProfile = null;

        if (request.isProvider()) {
            if (request.getBusinessType() == null) {
                throw new BadRequestException("Provider business type is required");
            }

            BusinessType businessType;
            try {
                businessType = BusinessType.valueOf(request.getBusinessType().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid business type: " + request.getBusinessType());
            }

            Role providerRole = roleRepository.findByName(businessType.toRoleName())
                    .orElseThrow(() -> new BadRequestException("Provider role not found for type: " + businessType));
            roles.add(providerRole);

            providerProfile = ProviderProfile.builder()
                    .businessName(request.getBusinessName())
                    .businessType(businessType)
                    .address(request.getAddress() != null ? request.getAddress() : "")
                    .city(request.getCity() != null ? request.getCity() : "")
                    .taxCode(request.getTaxCode())
                    .bankName(request.getBankName())
                    .bankAccountNumber(request.getBankAccountNumber())
                    .bankAccountName(request.getBankAccountName())
                    .verificationStatus(VerificationStatus.PENDING)
                    .build();
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(fullName)
                .phoneNumber(request.getPhoneNumber())
                .roles(roles)
                .isActive(true)
                .build();

        if (providerProfile != null) {
            providerProfile.setUser(user);
            user.setProviderProfile(providerProfile);
        }

        userRepository.save(user);
        log.info("Successfully registered user: {}", request.getEmail());
    }

    private String resolveFullName(RegisterRequest request) {
        String firstName = trimToEmpty(request.getFirstName());
        String lastName = trimToEmpty(request.getLastName());

        if (!firstName.isBlank() || !lastName.isBlank()) {
            return (firstName + " " + lastName).trim();
        }

        return trimToEmpty(request.getFullName());
    }

    private String trimToEmpty(String value) {
        return value == null ? "" : value.trim();
    }

    public TokenResponse login(LoginRequest request) {
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (DisabledException ex) {
            log.warn("Disabled account login attempt for {}", request.getEmail());
            throw resolveDisabledAccountException(request.getEmail());
        } catch (LockedException ex) {
            log.warn("Locked account login attempt for {}", request.getEmail());
            throw new BusinessException(
                    ErrorCode.ACCOUNT_LOCKED,
                    "Your account is temporarily locked.",
                    HttpStatus.LOCKED
            );
        } catch (AccountExpiredException ex) {
            log.warn("Expired account login attempt for {}", request.getEmail());
            throw new BusinessException(
                    ErrorCode.ACCOUNT_EXPIRED,
                    "Your account has expired.",
                    HttpStatus.FORBIDDEN
            );
        } catch (CredentialsExpiredException ex) {
            log.warn("Expired credentials login attempt for {}", request.getEmail());
            throw new BusinessException(
                    ErrorCode.CREDENTIALS_EXPIRED,
                    "Your credentials have expired.",
                    HttpStatus.FORBIDDEN
            );
        } catch (BadCredentialsException ex) {
            log.warn("Invalid login credentials for {}", request.getEmail());
            throw new BusinessException(
                    ErrorCode.INVALID_CREDENTIALS,
                    "Email or password is incorrect.",
                    HttpStatus.UNAUTHORIZED
            );
        }

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        String accessToken = tokenProvider.generateAccessToken(userPrincipal);
        String refreshToken = tokenProvider.generateRefreshToken(userPrincipal);

        // Store refresh token in-memory
        refreshTokenStore.put(userPrincipal.getEmail(), refreshToken);

        log.info("User logged in: {}", userPrincipal.getEmail());
        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    public TokenResponse refreshToken(TokenRefreshRequest request) {
        String refreshToken = request.getRefreshToken();

        if (!tokenProvider.validateToken(refreshToken)) {
            throw new BadRequestException("Invalid refresh token", ErrorCode.TOKEN_INVALID);
        }

        String email = tokenProvider.getEmailFromToken(refreshToken);
        String storedToken = refreshTokenStore.get(email);

        if (storedToken == null || !storedToken.equals(refreshToken)) {
            throw new BadRequestException("Refresh token has expired or been revoked", ErrorCode.TOKEN_EXPIRED);
        }

        UserPrincipal userPrincipal = (UserPrincipal) userDetailsService.loadUserByUsername(email);
        if (!userPrincipal.isEnabled()) {
            refreshTokenStore.remove(email);
            throw resolveDisabledAccountException(email);
        }

        String newAccessToken = tokenProvider.generateAccessToken(userPrincipal);
        String newRefreshToken = tokenProvider.generateRefreshToken(userPrincipal);

        // Rotate refresh token (invalidate old, store new)
        refreshTokenStore.put(email, newRefreshToken);

        log.info("Refreshed access token for user: {}", email);
        return TokenResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .build();
    }

    public void logout(String email) {
        refreshTokenStore.remove(email);
        log.info("User logged out, refresh token revoked for: {}", email);
    }

    private BusinessException resolveDisabledAccountException(String email) {
        return userRepository.findByEmail(email)
                .map(user -> {
                    if (user.getBannedAt() != null) {
                        String reasonCode = normalizeBanReasonCode(user.getBanReasonCode());
                        return new BusinessException(
                                ErrorCode.ACCOUNT_BANNED,
                                "Your account has been banned. Please contact support for assistance.",
                                HttpStatus.FORBIDDEN,
                                Map.of(
                                        "email", user.getEmail(),
                                        "reasonCode", reasonCode,
                                        "reasonLabel", resolveBanReasonLabel(reasonCode),
                                        "reason", user.getBanReason() != null && !user.getBanReason().isBlank()
                                                ? user.getBanReason()
                                                : "Your account was restricted for violating platform policies.",
                                        "bannedAt", user.getBannedAt().toString()
                                )
                        );
                    }
                    if (!user.isActive()) {
                        return new BusinessException(
                                ErrorCode.ACCOUNT_INACTIVE,
                                "Your account is currently inactive. Please contact support for assistance.",
                                HttpStatus.FORBIDDEN
                        );
                    }
                    return new BusinessException(
                            ErrorCode.ACCOUNT_LOCKED,
                            "Your account is temporarily locked.",
                            HttpStatus.LOCKED
                    );
                })
                .orElseGet(() -> new BusinessException(
                        ErrorCode.INVALID_CREDENTIALS,
                        "Email or password is incorrect.",
                        HttpStatus.UNAUTHORIZED
                ));
    }

    private String normalizeBanReasonCode(String value) {
        if (value == null || value.isBlank()) {
            return "POLICY_VIOLATION";
        }
        String normalized = value.trim()
                .toUpperCase()
                .replace("&", "AND")
                .replaceAll("[^A-Z0-9]+", "_")
                .replaceAll("^_+|_+$", "");
        return switch (normalized) {
            case "SPAM_OR_ABUSE", "SPAM_ABUSE" -> "SPAM_ABUSE";
            case "FRAUD_OR_SUSPICIOUS_ACTIVITY", "FRAUD_SUSPICIOUS_ACTIVITY" -> "FRAUD_SUSPICIOUS_ACTIVITY";
            case "POLICY_VIOLATION" -> "POLICY_VIOLATION";
            case "PAYMENT_ABUSE" -> "PAYMENT_ABUSE";
            case "SECURITY_RISK" -> "SECURITY_RISK";
            case "DUPLICATE_ACCOUNT" -> "DUPLICATE_ACCOUNT";
            case "OTHER" -> "OTHER";
            default -> normalized;
        };
    }

    private String resolveBanReasonLabel(String reasonCode) {
        return switch (reasonCode) {
            case "SPAM_ABUSE" -> "Spam or abuse";
            case "FRAUD_SUSPICIOUS_ACTIVITY" -> "Fraud or suspicious activity";
            case "POLICY_VIOLATION" -> "Policy violation";
            case "PAYMENT_ABUSE" -> "Payment abuse";
            case "SECURITY_RISK" -> "Security risk";
            case "DUPLICATE_ACCOUNT" -> "Duplicate account";
            case "OTHER" -> "Other";
            default -> "Account restriction";
        };
    }
}
