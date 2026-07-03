package com.travel.marketplace.modules.notification.service;

import com.travel.marketplace.modules.notification.entity.Notification;
import com.travel.marketplace.modules.notification.enums.NotificationStatus;
import com.travel.marketplace.modules.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public Page<Notification> getUserNotifications(Long userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndStatus(userId, NotificationStatus.UNREAD);
    }

    public void markAsRead(Long notificationId, Long userId) {
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            if (notification.getUserId().equals(userId)) {
                notification.setStatus(NotificationStatus.READ);
                notificationRepository.save(notification);
            }
        });
    }

    public void markAllAsRead(Long userId) {
        // Simplified for this phase. In production, use a bulk update query.
        Page<Notification> unread = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, Pageable.unpaged());
        unread.forEach(n -> {
            if (n.getStatus() == NotificationStatus.UNREAD) {
                n.setStatus(NotificationStatus.READ);
                notificationRepository.save(n);
            }
        });
    }
}
