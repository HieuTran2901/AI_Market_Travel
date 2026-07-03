package com.travel.marketplace.modules.notification.service;

import com.travel.marketplace.modules.notification.dto.SendNotificationRequest;

/**
 * Abstraction for publishing notifications. 
 * Allows future substitution with RabbitMQ/Kafka async queuing without changing business callers.
 */
public interface NotificationPublisher {
    void publish(SendNotificationRequest request);
}
