package com.travel.marketplace.modules.notification.email.provider;

import com.travel.marketplace.modules.notification.email.EmailMessage;
import com.travel.marketplace.modules.notification.email.EmailSendResult;
import com.travel.marketplace.modules.notification.email.EmailSendResult.ErrorCategory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ResendEmailProviderTest {

    @Mock
    private RestClient restClient;

    @Mock
    private RestClient.RequestBodyUriSpec requestBodyUriSpec;

    @Mock
    private RestClient.RequestBodySpec requestBodySpec;

    @Mock
    private RestClient.ResponseSpec responseSpec;

    private ResendEmailProvider provider;

    @BeforeEach
    void setUp() {
        provider = new ResendEmailProvider("re_test_12345", "https://api.resend.com", restClient);
    }

    private void setupRestClientChain() {
        when(restClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.header(anyString(), anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.contentType(any(MediaType.class))).thenReturn(requestBodySpec);
        when(requestBodySpec.body(any(Object.class))).thenReturn(requestBodySpec);
        when(requestBodySpec.retrieve()).thenReturn(responseSpec);
    }

    @Test
    void sendShouldSucceedWhenResendReturns200() {
        setupRestClientChain();
        ResendEmailProvider.ResendSendEmailResponse responseBody = new ResendEmailProvider.ResendSendEmailResponse();
        responseBody.setId("resend-id-12345");
        ResponseEntity<ResendEmailProvider.ResendSendEmailResponse> responseEntity =
                new ResponseEntity<>(responseBody, HttpStatus.OK);

        when(responseSpec.toEntity(ResendEmailProvider.ResendSendEmailResponse.class)).thenReturn(responseEntity);

        EmailMessage message = EmailMessage.builder()
                .from("AI Travel <onboarding@resend.dev>")
                .to("traveler@example.com")
                .subject("Verify OTP")
                .html("<p>123456</p>")
                .build();

        EmailSendResult result = provider.send(message);

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getMessageId()).isEqualTo("resend-id-12345");
        assertThat(result.getProvider()).isEqualTo("RESEND");
        assertThat(result.getErrorCategory()).isEqualTo(ErrorCategory.NONE);
    }

    @Test
    void sendShouldReturnRetryableFailureOn429RateLimit() {
        setupRestClientChain();
        HttpClientErrorException exception = HttpClientErrorException.create(
                HttpStatus.TOO_MANY_REQUESTS,
                "Too Many Requests",
                HttpHeaders.EMPTY,
                "Rate limit exceeded".getBytes(StandardCharsets.UTF_8),
                StandardCharsets.UTF_8
        );
        when(responseSpec.toEntity(ResendEmailProvider.ResendSendEmailResponse.class)).thenThrow(exception);

        EmailMessage message = EmailMessage.builder()
                .from("AI Travel <onboarding@resend.dev>")
                .to("traveler@example.com")
                .subject("Verify OTP")
                .html("<p>123456</p>")
                .build();

        EmailSendResult result = provider.send(message);

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.isRetryable()).isTrue();
        assertThat(result.getErrorCategory()).isEqualTo(ErrorCategory.RATE_LIMITED);
    }

    @Test
    void sendShouldReturnRetryableFailureOn500ServerError() {
        setupRestClientChain();
        HttpServerErrorException exception = HttpServerErrorException.create(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Internal Server Error",
                HttpHeaders.EMPTY,
                "Server Error".getBytes(StandardCharsets.UTF_8),
                StandardCharsets.UTF_8
        );
        when(responseSpec.toEntity(ResendEmailProvider.ResendSendEmailResponse.class)).thenThrow(exception);

        EmailMessage message = EmailMessage.builder()
                .from("AI Travel <onboarding@resend.dev>")
                .to("traveler@example.com")
                .subject("Verify OTP")
                .html("<p>123456</p>")
                .build();

        EmailSendResult result = provider.send(message);

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.isRetryable()).isTrue();
        assertThat(result.getErrorCategory()).isEqualTo(ErrorCategory.SERVER_ERROR);
    }

    @Test
    void sendShouldReturnNonRetryableFailureOn400BadRequest() {
        setupRestClientChain();
        HttpClientErrorException exception = HttpClientErrorException.create(
                HttpStatus.BAD_REQUEST,
                "Bad Request",
                HttpHeaders.EMPTY,
                "Invalid recipient format".getBytes(StandardCharsets.UTF_8),
                StandardCharsets.UTF_8
        );
        when(responseSpec.toEntity(ResendEmailProvider.ResendSendEmailResponse.class)).thenThrow(exception);

        EmailMessage message = EmailMessage.builder()
                .from("AI Travel <onboarding@resend.dev>")
                .to("invalid-email")
                .subject("Verify OTP")
                .html("<p>123456</p>")
                .build();

        EmailSendResult result = provider.send(message);

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.isRetryable()).isFalse();
        assertThat(result.getErrorCategory()).isEqualTo(ErrorCategory.CLIENT_ERROR);
    }

    @Test
    void sendShouldReturnRetryableFailureOnTimeout() {
        setupRestClientChain();
        ResourceAccessException exception = new ResourceAccessException("Connect timed out");
        when(responseSpec.toEntity(ResendEmailProvider.ResendSendEmailResponse.class)).thenThrow(exception);

        EmailMessage message = EmailMessage.builder()
                .from("AI Travel <onboarding@resend.dev>")
                .to("traveler@example.com")
                .subject("Verify OTP")
                .html("<p>123456</p>")
                .build();

        EmailSendResult result = provider.send(message);

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.isRetryable()).isTrue();
        assertThat(result.getErrorCategory()).isEqualTo(ErrorCategory.TIMEOUT);
    }

    @Test
    void sendShouldReturnConfigurationErrorWhenApiKeyIsBlank() {
        ResendEmailProvider providerNoKey = new ResendEmailProvider("", "https://api.resend.com", restClient);

        EmailMessage message = EmailMessage.builder()
                .from("AI Travel <onboarding@resend.dev>")
                .to("traveler@example.com")
                .subject("Verify OTP")
                .html("<p>123456</p>")
                .build();

        EmailSendResult result = providerNoKey.send(message);

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.isRetryable()).isTrue();
        assertThat(result.getErrorCategory()).isEqualTo(ErrorCategory.CONFIGURATION_ERROR);
        verify(restClient, never()).post();
    }
}
