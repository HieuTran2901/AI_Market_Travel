package com.travel.marketplace.modules.notification.service;

import com.travel.marketplace.modules.notification.dto.SendNotificationRequest;

/**
 * Interface representing a destination channel for a notification (e.g. In-App, Email, SMS).
 */
public interface NotificationChannel {
    void send(SendNotificationRequest request);
    boolean supports(com.travel.marketplace.modules.notification.enums.NotificationType type);
}
