package com.travel.marketplace.modules.notification.email;

import com.travel.marketplace.modules.notification.email.EmailSendResult.ErrorCategory;
import com.travel.marketplace.modules.notification.email.exception.EmailSendException;
import com.travel.marketplace.modules.notification.email.exception.NonRetryableEmailException;
import com.travel.marketplace.modules.notification.email.provider.ResendEmailProvider;
import com.travel.marketplace.modules.notification.email.provider.SmtpEmailProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FallbackEmailServiceTest {

    @Mock
    private ResendEmailProvider resendProvider;

    @Mock
    private SmtpEmailProvider smtpProvider;

    private FallbackEmailService emailService;

    @BeforeEach
    void setUp() {
        emailService = new FallbackEmailService(resendProvider, smtpProvider);
        emailService.setConfiguredProvider("resend");
        emailService.setDefaultEmailFrom("AI Travel Marketplace <onboarding@resend.dev>");
        emailService.setFallbackEnabled(true);
    }

    @Test
    void test1_resendSuccess_smtpNotCalled_emailSuccess() {
        when(resendProvider.send(any(EmailMessage.class)))
                .thenReturn(EmailSendResult.success("RESEND", "resend-msg-123"));

        EmailMessage message = EmailMessage.builder()
                .to("traveler@example.com")
                .subject("Welcome")
                .html("<p>Welcome</p>")
                .build();

        emailService.send(message);

        verify(resendProvider, times(1)).send(any(EmailMessage.class));
        verify(smtpProvider, never()).send(any(EmailMessage.class));
    }

    @Test
    void test2_resendTimeout_smtpCalled_emailSuccess() {
        when(resendProvider.send(any(EmailMessage.class)))
                .thenReturn(EmailSendResult.retryableFailure("RESEND", ErrorCategory.TIMEOUT, "Connect timed out", new RuntimeException()));
        when(smtpProvider.send(any(EmailMessage.class)))
                .thenReturn(EmailSendResult.success("SMTP", "smtp-msg-456"));

        EmailMessage message = EmailMessage.builder()
                .to("traveler@example.com")
                .subject("Verify OTP")
                .html("<p>123456</p>")
                .build();

        emailService.send(message);

        verify(resendProvider, times(1)).send(any(EmailMessage.class));
        verify(smtpProvider, times(1)).send(any(EmailMessage.class));
    }

    @Test
    void test3_resend500_smtpCalled() {
        when(resendProvider.send(any(EmailMessage.class)))
                .thenReturn(EmailSendResult.retryableFailure("RESEND", ErrorCategory.SERVER_ERROR, "Internal server error 500", new RuntimeException()));
        when(smtpProvider.send(any(EmailMessage.class)))
                .thenReturn(EmailSendResult.success("SMTP", "smtp-msg-456"));

        EmailMessage message = EmailMessage.builder()
                .to("traveler@example.com")
                .subject("Verify OTP")
                .html("<p>123456</p>")
                .build();

        emailService.send(message);

        verify(resendProvider, times(1)).send(any(EmailMessage.class));
        verify(smtpProvider, times(1)).send(any(EmailMessage.class));
    }

    @Test
    void test4_resend429_smtpCalled() {
        when(resendProvider.send(any(EmailMessage.class)))
                .thenReturn(EmailSendResult.retryableFailure("RESEND", ErrorCategory.RATE_LIMITED, "Rate limit exceeded 429", new RuntimeException()));
        when(smtpProvider.send(any(EmailMessage.class)))
                .thenReturn(EmailSendResult.success("SMTP", "smtp-msg-456"));

        EmailMessage message = EmailMessage.builder()
                .to("traveler@example.com")
                .subject("Verify OTP")
                .html("<p>123456</p>")
                .build();

        emailService.send(message);

        verify(resendProvider, times(1)).send(any(EmailMessage.class));
        verify(smtpProvider, times(1)).send(any(EmailMessage.class));
    }

    @Test
    void test5_resend400_smtpNotCalled_throwsNonRetryableEmailException() {
        when(resendProvider.send(any(EmailMessage.class)))
                .thenReturn(EmailSendResult.nonRetryableFailure("RESEND", ErrorCategory.CLIENT_ERROR, "Invalid email address format", new RuntimeException()));

        EmailMessage message = EmailMessage.builder()
                .to("invalid-email")
                .subject("Verify OTP")
                .html("<p>123456</p>")
                .build();

        assertThatThrownBy(() -> emailService.send(message))
                .isInstanceOf(NonRetryableEmailException.class)
                .hasMessageContaining("Resend client error");

        verify(resendProvider, times(1)).send(any(EmailMessage.class));
        verify(smtpProvider, never()).send(any(EmailMessage.class));
    }

    @Test
    void test6_bothProvidersFail_throwsEmailSendException() {
        when(resendProvider.send(any(EmailMessage.class)))
                .thenReturn(EmailSendResult.retryableFailure("RESEND", ErrorCategory.TIMEOUT, "Resend timeout", new RuntimeException()));
        when(smtpProvider.send(any(EmailMessage.class)))
                .thenReturn(EmailSendResult.retryableFailure("SMTP", ErrorCategory.SERVER_ERROR, "SMTP connection refused", new RuntimeException()));

        EmailMessage message = EmailMessage.builder()
                .to("traveler@example.com")
                .subject("Verify OTP")
                .html("<p>123456</p>")
                .build();

        assertThatThrownBy(() -> emailService.send(message))
                .isInstanceOf(EmailSendException.class)
                .hasMessageContaining("Both email providers failed");

        verify(resendProvider, times(1)).send(any(EmailMessage.class));
        verify(smtpProvider, times(1)).send(any(EmailMessage.class));
    }

    @Test
    void test7_smtpFallbackDisabled_resendFails_smtpNotCalled() {
        emailService.setFallbackEnabled(false);
        when(resendProvider.send(any(EmailMessage.class)))
                .thenReturn(EmailSendResult.retryableFailure("RESEND", ErrorCategory.TIMEOUT, "Resend timeout", new RuntimeException()));

        EmailMessage message = EmailMessage.builder()
                .to("traveler@example.com")
                .subject("Verify OTP")
                .html("<p>123456</p>")
                .build();

        assertThatThrownBy(() -> emailService.send(message))
                .isInstanceOf(EmailSendException.class)
                .hasMessageContaining("fallback is disabled");

        verify(resendProvider, times(1)).send(any(EmailMessage.class));
        verify(smtpProvider, never()).send(any(EmailMessage.class));
    }

    @Test
    void test8_directSmtpMode_resendNotCalled_smtpCalled() {
        emailService.setConfiguredProvider("smtp");
        when(smtpProvider.send(any(EmailMessage.class)))
                .thenReturn(EmailSendResult.success("SMTP", "smtp-msg-789"));

        EmailMessage message = EmailMessage.builder()
                .to("traveler@example.com")
                .subject("Verify OTP")
                .html("<p>123456</p>")
                .build();

        emailService.send(message);

        verify(resendProvider, never()).send(any(EmailMessage.class));
        verify(smtpProvider, times(1)).send(any(EmailMessage.class));
    }
}
