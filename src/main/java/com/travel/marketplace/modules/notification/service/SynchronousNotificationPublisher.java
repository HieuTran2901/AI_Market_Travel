package com.travel.marketplace.modules.notification.service;

import com.travel.marketplace.modules.notification.dto.SendNotificationRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SynchronousNotificationPublisher implements NotificationPublisher {

    private final List<NotificationChannel> channels;

    @Override
    public void publish(SendNotificationRequest request) {
        log.debug("Publishing notification: {}", request.getType());
        for (NotificationChannel channel : channels) {
            if (channel.supports(request.getType())) {
                try {
                    channel.send(request);
                } catch (Exception e) {
                    log.error("Failed to send notification via channel {}", channel.getClass().getSimpleName(), e);
                    throw new RuntimeException("Failed to deliver notification via " + channel.getClass().getSimpleName() + ": " + e.getMessage(), e);
                }
            }
        }
    }
}
