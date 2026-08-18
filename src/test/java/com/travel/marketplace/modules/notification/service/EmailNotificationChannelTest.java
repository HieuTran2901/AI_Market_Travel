package com.travel.marketplace.modules.notification.service;

import com.travel.marketplace.modules.notification.dto.SendNotificationRequest;
import com.travel.marketplace.modules.notification.email.EmailMessage;
import com.travel.marketplace.modules.notification.email.EmailService;
import com.travel.marketplace.modules.notification.email.exception.EmailSendException;
import com.travel.marketplace.modules.notification.enums.NotificationType;
import com.travel.marketplace.modules.user.entity.User;
import com.travel.marketplace.modules.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailNotificationChannelTest {

    @Mock
    private EmailService emailService;

    @Mock
    private UserRepository userRepository;

    private EmailNotificationChannel emailNotificationChannel;

    @BeforeEach
    void setUp() {
        emailNotificationChannel = new EmailNotificationChannel(emailService, userRepository);
    }

    @Test
    void sendShouldDeliverEmailWhenRecipientEmailIsProvidedDirectly() {
        SendNotificationRequest request = SendNotificationRequest.builder()
                .recipientEmail("traveler@example.com")
                .type(NotificationType.OTP_VERIFICATION)
                .title("Verify your email")
                .message("<p>Your OTP code is 123456</p>")
                .isHtml(true)
                .build();

        emailNotificationChannel.send(request);

        ArgumentCaptor<EmailMessage> captor = ArgumentCaptor.forClass(EmailMessage.class);
        verify(emailService, times(1)).send(captor.capture());
        EmailMessage sent = captor.getValue();
        assertThat(sent.getTo()).isEqualTo("traveler@example.com");
        assertThat(sent.getSubject()).isEqualTo("Verify your email");
        assertThat(sent.getHtml()).isEqualTo("<p>Your OTP code is 123456</p>");
        assertThat(sent.isHtml()).isTrue();
        verify(userRepository, never()).findById(anyLong());
    }

    @Test
    void sendShouldResolveEmailFromUserRepositoryWhenUserIdIsProvided() {
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
        ArgumentCaptor<EmailMessage> captor = ArgumentCaptor.forClass(EmailMessage.class);
        verify(emailService, times(1)).send(captor.capture());
        assertThat(captor.getValue().getTo()).isEqualTo("user100@example.com");
    }

    @Test
    void sendShouldSkipWhenNoRecipientCanBeResolved() {
        SendNotificationRequest request = SendNotificationRequest.builder()
                .type(NotificationType.BOOKING_CONFIRMED)
                .title("Booking Confirmed")
                .message("No recipient provided.")
                .build();

        emailNotificationChannel.send(request);

        verify(emailService, never()).send(any(EmailMessage.class));
    }

    @Test
    void sendShouldThrowExceptionWhenEmailServiceFails() {
        doThrow(new EmailSendException("Failed to send email")).when(emailService).send(any(EmailMessage.class));

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
