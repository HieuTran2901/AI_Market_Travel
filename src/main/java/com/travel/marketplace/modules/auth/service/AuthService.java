package com.travel.marketplace.modules.auth.service;

import com.travel.marketplace.exception.BadRequestException;
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
import org.springframework.security.authentication.AuthenticationManager;
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
                .fullName(request.getFullName())
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

    public TokenResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

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
}
