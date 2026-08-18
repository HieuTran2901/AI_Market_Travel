package com.travel.marketplace.modules.notification.service;

import com.travel.marketplace.modules.notification.dto.SendNotificationRequest;
import com.travel.marketplace.modules.notification.entity.Notification;
import com.travel.marketplace.modules.notification.enums.NotificationStatus;
import com.travel.marketplace.modules.notification.enums.NotificationType;
import com.travel.marketplace.modules.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class InAppNotificationChannel implements NotificationChannel {

    private final NotificationRepository notificationRepository;

    @Override
    public void send(SendNotificationRequest request) {
        if (request.getUserId() == null) {
            log.debug("Skipping In-App notification: userId is null for type {}", request.getType());
            return;
        }

        Notification notification = Notification.builder()
                .userId(request.getUserId())
                .type(request.getType())
                .title(request.getTitle())
                .message(request.getMessage())
                .status(NotificationStatus.UNREAD)
                .build();
                
        notificationRepository.save(notification);
        log.debug("Saved In-App notification for user {}", request.getUserId());
    }

    @Override
    public boolean supports(NotificationType type) {
        // In-App supports all notification types except direct email-only transactional verifications
        return type != NotificationType.OTP_VERIFICATION;
    }
}
