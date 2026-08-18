package com.travel.marketplace.modules.notification.service;

import com.travel.marketplace.modules.notification.dto.SendNotificationRequest;
import com.travel.marketplace.modules.notification.enums.NotificationType;
import com.travel.marketplace.modules.user.entity.User;
import com.travel.marketplace.modules.user.repository.UserRepository;
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

import java.util.Optional;
import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailNotificationChannelTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private UserRepository userRepository;

    private EmailNotificationChannel emailNotificationChannel;

    @BeforeEach
    void setUp() {
        emailNotificationChannel = new EmailNotificationChannel(mailSender, userRepository);
        ReflectionTestUtils.setField(emailNotificationChannel, "mailFrom", "test@travel.com");
        ReflectionTestUtils.setField(emailNotificationChannel, "mailFromName", "AI Travel");
    }

    @Test
    void sendShouldDeliverEmailWhenRecipientEmailIsProvidedDirectly() {
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        SendNotificationRequest request = SendNotificationRequest.builder()
                .recipientEmail("traveler@example.com")
                .type(NotificationType.OTP_VERIFICATION)
                .title("Verify your email")
                .message("<p>Your OTP code is 123456</p>")
                .isHtml(true)
                .build();

        emailNotificationChannel.send(request);

        verify(mailSender, times(1)).send(any(MimeMessage.class));
        verify(userRepository, never()).findById(anyLong());
    }

    @Test
    void sendShouldResolveEmailFromUserRepositoryWhenUserIdIsProvided() {
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        User user = User.builder()
                .id(100L)
                .email("user100@example.com")
                .build();

        when(userRepository.findById(100L)).thenReturn(Optional.of(user));

        SendNotificationRequest request = SendNotificationRequest.builder()
                .userId(100L)
                .type(NotificationType.BOOKING_CONFIRMED)
                .title("Booking Confirmed")
                .message("Your booking is confirmed.")
                .build();

        emailNotificationChannel.send(request);

        verify(userRepository, times(1)).findById(100L);
        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    void sendShouldSkipWhenNoRecipientCanBeResolved() {
        SendNotificationRequest request = SendNotificationRequest.builder()
                .type(NotificationType.BOOKING_CONFIRMED)
                .title("Booking Confirmed")
                .message("No recipient provided.")
                .build();

        emailNotificationChannel.send(request);

        verify(mailSender, never()).createMimeMessage();
        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    void sendShouldThrowExceptionWhenMailSenderThrowsMailException() {
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doThrow(new MailSendException("SMTP connection refused")).when(mailSender).send(any(MimeMessage.class));

        SendNotificationRequest request = SendNotificationRequest.builder()
                .recipientEmail("failure@example.com")
                .type(NotificationType.OTP_VERIFICATION)
                .title("Test Error")
                .message("Test message")
                .build();

        assertThatThrownBy(() -> emailNotificationChannel.send(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Failed to send email notification");
    }

    @Test
    void supportsShouldReturnTrueForOtpVerificationAndSupportedTypes() {
        assertThat(emailNotificationChannel.supports(NotificationType.OTP_VERIFICATION)).isTrue();
        assertThat(emailNotificationChannel.supports(NotificationType.BOOKING_CONFIRMED)).isTrue();
        assertThat(emailNotificationChannel.supports(NotificationType.PAYMENT_SUCCESSFUL)).isTrue();
        assertThat(emailNotificationChannel.supports(NotificationType.REFUND_APPROVED)).isTrue();
        assertThat(emailNotificationChannel.supports(NotificationType.SETTLEMENT_COMPLETED)).isTrue();
        assertThat(emailNotificationChannel.supports(NotificationType.SYSTEM_ALERT)).isFalse();
    }
}
