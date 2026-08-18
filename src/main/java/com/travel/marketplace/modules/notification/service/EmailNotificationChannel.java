package com.travel.marketplace.modules.notification.service;

import com.travel.marketplace.modules.notification.dto.SendNotificationRequest;
import com.travel.marketplace.modules.notification.email.EmailMessage;
import com.travel.marketplace.modules.notification.email.EmailService;
import com.travel.marketplace.modules.notification.enums.NotificationType;
import com.travel.marketplace.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailNotificationChannel implements NotificationChannel {

    private final EmailService emailService;
    private final UserRepository userRepository;

    @Override
    public void send(SendNotificationRequest request) {
        String recipientEmail = resolveRecipientEmail(request);
        if (recipientEmail == null || recipientEmail.isBlank()) {
            log.warn("Cannot send email: No recipient email found for notification type {} (userId: {})", 
                     request.getType(), request.getUserId());
            return;
        }

        try {
            boolean isHtml = request.isHtml() || (request.getMessage() != null && request.getMessage().trim().startsWith("<"));
            EmailMessage emailMessage = EmailMessage.builder()
                    .to(recipientEmail)
                    .subject(request.getTitle() != null ? request.getTitle() : "AI Travel Notification")
                    .html(isHtml ? request.getMessage() : null)
                    .text(!isHtml ? request.getMessage() : null)
                    .isHtml(isHtml)
                    .build();

            emailService.send(emailMessage);
            log.info("Email notification sent successfully to domain: {} [Subject: {}]", 
                     extractDomain(recipientEmail), request.getTitle());
        } catch (Exception e) {
            log.error("Failed to send email notification to domain: {} [Subject: {}]: {}", 
                      extractDomain(recipientEmail), request.getTitle(), e.getMessage());
            throw new RuntimeException("Failed to send email notification: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean supports(NotificationType type) {
        return type == NotificationType.BOOKING_CONFIRMED ||
               type == NotificationType.PAYMENT_SUCCESSFUL ||
               type == NotificationType.REFUND_APPROVED ||
               type == NotificationType.SETTLEMENT_COMPLETED ||
               type == NotificationType.OTP_VERIFICATION;
    }

    private String resolveRecipientEmail(SendNotificationRequest request) {
        if (request.getRecipientEmail() != null && !request.getRecipientEmail().isBlank()) {
            return request.getRecipientEmail().trim();
        }
        if (request.getUserId() != null) {
            return userRepository.findById(request.getUserId())
                    .map(u -> u.getEmail())
                    .orElse(null);
        }
        return null;
    }

    private String extractDomain(String email) {
        if (email == null || !email.contains("@")) {
            return "unknown";
        }
        return email.substring(email.indexOf("@"));
    }
}
