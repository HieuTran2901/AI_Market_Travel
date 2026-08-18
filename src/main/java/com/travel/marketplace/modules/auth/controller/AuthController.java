package com.travel.marketplace.modules.auth.controller;

import com.travel.marketplace.dto.ApiResponse;
import com.travel.marketplace.modules.auth.dto.LoginRequest;
import com.travel.marketplace.modules.auth.dto.RegisterRequest;
import com.travel.marketplace.modules.auth.dto.SendOtpRequest;
import com.travel.marketplace.modules.auth.dto.TokenRefreshRequest;
import com.travel.marketplace.modules.auth.dto.TokenResponse;
import com.travel.marketplace.modules.auth.dto.VerifyOtpRequest;
import com.travel.marketplace.modules.auth.service.AuthService;
import com.travel.marketplace.modules.auth.service.OtpService;
import com.travel.marketplace.modules.user.dto.UserResponse;
import com.travel.marketplace.modules.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "Authentication and User Registration endpoints")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;
    private final OtpService otpService;

    public AuthController(AuthService authService, UserService userService, OtpService otpService) {
        this.authService = authService;
        this.userService = userService;
        this.otpService = otpService;
    }

    @PostMapping("/otp/send")
    @Operation(summary = "Send an email OTP verification code")
    public ResponseEntity<ApiResponse<String>> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        otpService.sendOtp(request);
        return ResponseEntity.ok(ApiResponse.success("OTP has been sent to your email."));
    }

    @PostMapping("/otp/verify")
    @Operation(summary = "Verify an email OTP code")
    public ResponseEntity<ApiResponse<String>> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        otpService.verifyOtp(request);
        return ResponseEntity.ok(ApiResponse.success("OTP verified successfully."));
    }

    @PostMapping("/signup")
    @Operation(summary = "Register a new Customer or Service Provider")
    public ResponseEntity<ApiResponse<String>> registerUser(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.ok(ApiResponse.success("User registered successfully. You can now login."));
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user and return JWT Access & Refresh tokens")
    public ResponseEntity<ApiResponse<TokenResponse>> authenticateUser(@Valid @RequestBody LoginRequest request) {
        TokenResponse tokenResponse = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Authentication successful", tokenResponse));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Rotate expired Access Token using a valid Refresh Token")
    public ResponseEntity<ApiResponse<TokenResponse>> refreshAccessToken(@Valid @RequestBody TokenRefreshRequest request) {
        TokenResponse tokenResponse = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success("Access Token rotated successfully", tokenResponse));
    }

    @PostMapping("/logout")
    @Operation(summary = "Revoke user sessions and invalidate Refresh Tokens")
    public ResponseEntity<ApiResponse<String>> logoutUser(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails != null) {
            authService.logout(userDetails.getUsername());
        }
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully"));
    }

    @GetMapping("/me")
    @Operation(summary = "Get details of the currently authenticated user session")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("UNAUTHORIZED", "Not authenticated"));
        }
        UserResponse userResponse = userService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Current user profile retrieved", userResponse));
    }
}
