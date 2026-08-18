package com.travel.marketplace.modules.auth.controller;

import com.travel.marketplace.dto.ApiResponse;
import com.travel.marketplace.modules.auth.dto.SendOtpRequest;
import com.travel.marketplace.modules.auth.dto.VerifyOtpRequest;
import com.travel.marketplace.modules.auth.enums.OtpPurpose;
import com.travel.marketplace.modules.auth.service.AuthService;
import com.travel.marketplace.modules.auth.service.OtpService;
import com.travel.marketplace.modules.user.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerOtpTest {

    @Mock
    private AuthService authService;

    @Mock
    private UserService userService;

    @Mock
    private OtpService otpService;

    private AuthController authController;

    @BeforeEach
    void setUp() {
        authController = new AuthController(authService, userService, otpService);
    }

    @Test
    void sendOtp_shouldDelegateToOtpServiceAndReturnSuccessApiResponse() {
        SendOtpRequest request = SendOtpRequest.builder()
                .email("user@example.com")
                .purpose(OtpPurpose.REGISTER)
                .build();

        doNothing().when(otpService).sendOtp(request);

        ResponseEntity<ApiResponse<String>> response = authController.sendOtp(request);

        verify(otpService, times(1)).sendOtp(request);
        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();
        assertThat(response.getBody().getData()).isEqualTo("OTP has been sent to your email.");
    }

    @Test
    void sendOtp_shouldNotExposeRawOtpOrHashInResponse() {
        SendOtpRequest request = SendOtpRequest.builder()
                .email("user@example.com")
                .purpose(OtpPurpose.REGISTER)
                .build();

        ResponseEntity<ApiResponse<String>> response = authController.sendOtp(request);

        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData()).doesNotMatch(".*\\d{6}.*");
    }

    @Test
    void verifyOtp_shouldDelegateToOtpServiceAndReturnSuccessApiResponse() {
        VerifyOtpRequest request = VerifyOtpRequest.builder()
                .email("user@example.com")
                .purpose(OtpPurpose.REGISTER)
                .code("482913")
                .build();

        doNothing().when(otpService).verifyOtp(request);

        ResponseEntity<ApiResponse<String>> response = authController.verifyOtp(request);

        verify(otpService, times(1)).verifyOtp(request);
        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();
        assertThat(response.getBody().getData()).isEqualTo("OTP verified successfully.");
    }

    @Test
    void verifyOtp_shouldNotExposeSensitiveDataInResponse() {
        VerifyOtpRequest request = VerifyOtpRequest.builder()
                .email("user@example.com")
                .purpose(OtpPurpose.REGISTER)
                .code("482913")
                .build();

        ResponseEntity<ApiResponse<String>> response = authController.verifyOtp(request);

        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData()).doesNotMatch(".*\\d{6}.*");
    }

    @Test
    void signup_shouldDelegateToAuthServiceAndReturnSuccess() {
        com.travel.marketplace.modules.auth.dto.RegisterRequest request = com.travel.marketplace.modules.auth.dto.RegisterRequest.builder()
                .email("verified@example.com")
                .password("Password123!")
                .firstName("Alice")
                .lastName("Wonderland")
                .build();

        doNothing().when(authService).register(request);

        ResponseEntity<ApiResponse<String>> response = authController.registerUser(request);

        verify(authService, times(1)).register(request);
        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();
        assertThat(response.getBody().getData()).isEqualTo("User registered successfully. You can now login.");
    }

    @Test
    void signup_shouldPropagateExceptionWhenAuthServiceThrowsBadRequest() {
        com.travel.marketplace.modules.auth.dto.RegisterRequest request = com.travel.marketplace.modules.auth.dto.RegisterRequest.builder()
                .email("unverified@example.com")
                .password("Password123!")
                .firstName("Alice")
                .lastName("Wonderland")
                .build();

        doThrow(new com.travel.marketplace.exception.BadRequestException("Email verification is required"))
                .when(authService).register(request);

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> authController.registerUser(request))
                .isInstanceOf(com.travel.marketplace.exception.BadRequestException.class)
                .hasMessage("Email verification is required");

        verify(authService, times(1)).register(request);
    }
}
