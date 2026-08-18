package com.travel.marketplace.modules.notification.email.provider;

import com.travel.marketplace.modules.notification.email.EmailMessage;
import com.travel.marketplace.modules.notification.email.EmailSendResult;
import com.travel.marketplace.modules.notification.email.EmailSendResult.ErrorCategory;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SmtpEmailProviderTest {

    @Mock
    private JavaMailSender mailSender;

    private SmtpEmailProvider provider;

    @BeforeEach
    void setUp() {
        provider = new SmtpEmailProvider(mailSender);
        ReflectionTestUtils.setField(provider, "defaultMailFrom", "noreply@travel.com");
        ReflectionTestUtils.setField(provider, "defaultMailFromName", "AI Travel");
    }

    @Test
    void sendShouldSucceedWhenMailSenderSendsSuccessfully() {
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        EmailMessage message = EmailMessage.builder()
                .from("AI Travel <noreply@travel.com>")
                .to("user@example.com")
                .subject("Test Subject")
                .html("<p>Test Content</p>")
                .build();

        EmailSendResult result = provider.send(message);

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getProvider()).isEqualTo("SMTP");
        assertThat(result.getErrorCategory()).isEqualTo(ErrorCategory.NONE);
        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    void sendShouldReturnFailureWhenMailSenderThrowsException() {
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doThrow(new MailSendException("SMTP connection timeout")).when(mailSender).send(any(MimeMessage.class));

        EmailMessage message = EmailMessage.builder()
                .from("AI Travel <noreply@travel.com>")
                .to("user@example.com")
                .subject("Test Subject")
                .html("<p>Test Content</p>")
                .build();

        EmailSendResult result = provider.send(message);

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getProvider()).isEqualTo("SMTP");
        assertThat(result.isRetryable()).isTrue();
        assertThat(result.getErrorCategory()).isEqualTo(ErrorCategory.SERVER_ERROR);
    }

    @Test
    void sendShouldReturnFailureWhenMailSenderIsNull() {
        SmtpEmailProvider providerNoSender = new SmtpEmailProvider(null);

        EmailMessage message = EmailMessage.builder()
                .to("user@example.com")
                .subject("Test")
                .html("Hello")
                .build();

        EmailSendResult result = providerNoSender.send(message);

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getErrorCategory()).isEqualTo(ErrorCategory.CONFIGURATION_ERROR);
    }
}
