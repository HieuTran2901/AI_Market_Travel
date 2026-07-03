package com.travel.marketplace.modules.notification.service;

import com.travel.marketplace.modules.notification.dto.SendNotificationRequest;
import com.travel.marketplace.modules.notification.enums.NotificationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailNotificationChannel implements NotificationChannel {

    // Inject JavaMailSender here in real production

    @Override
    public void send(SendNotificationRequest request) {
        // Simulated SMTP send
        log.info("Sending EMAIL notification to user {}: [Subject: {}] {}", 
                 request.getUserId(), request.getTitle(), request.getMessage());
    }

    @Override
    public boolean supports(NotificationType type) {
        // Email only critical alerts
        return type == NotificationType.BOOKING_CONFIRMED ||
               type == NotificationType.PAYMENT_SUCCESSFUL ||
               type == NotificationType.REFUND_APPROVED ||
               type == NotificationType.SETTLEMENT_COMPLETED;
    }
}
