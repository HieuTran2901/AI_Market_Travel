package com.travel.marketplace.modules.notification.service;

import com.travel.marketplace.modules.notification.dto.SendNotificationRequest;
import com.travel.marketplace.modules.notification.enums.NotificationType;
import com.travel.marketplace.modules.user.repository.UserRepository;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailNotificationChannel implements NotificationChannel {

    private final JavaMailSender mailSender;
    private final UserRepository userRepository;

    @Value("${app.mail.from:noreply@aitravelmarketplace.com}")
    private String mailFrom;

    @Value("${app.mail.from-name:AI Travel Marketplace}")
    private String mailFromName;

    @Override
    public void send(SendNotificationRequest request) {
        String recipientEmail = resolveRecipientEmail(request);
        if (recipientEmail == null || recipientEmail.isBlank()) {
            log.warn("Cannot send email: No recipient email found for notification type {} (userId: {})", 
                     request.getType(), request.getUserId());
            return;
        }

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    mimeMessage, 
                    MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, 
                    StandardCharsets.UTF_8.name()
            );

            helper.setFrom(new InternetAddress(mailFrom, mailFromName, StandardCharsets.UTF_8.name()));
            helper.setTo(recipientEmail);
            helper.setSubject(request.getTitle() != null ? request.getTitle() : "AI Travel Notification");

            boolean isHtml = request.isHtml() || (request.getMessage() != null && request.getMessage().trim().startsWith("<"));
            helper.setText(request.getMessage() != null ? request.getMessage() : "", isHtml);

            mailSender.send(mimeMessage);
            log.info("Email notification sent successfully to domain: {} [Subject: {}]", 
                     extractDomain(recipientEmail), request.getTitle());
        } catch (MessagingException | UnsupportedEncodingException | MailException e) {
            log.error("Failed to send email notification to domain: {} [Subject: {}]: {}", 
                      extractDomain(recipientEmail), request.getTitle(), e.getMessage());
            throw new RuntimeException("Failed to send email notification", e);
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
