package com.travel.marketplace.modules.notification.service;

import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class SimpleNotificationTemplateEngine implements NotificationTemplateEngine {

    @Override
    public String render(String templateName, Map<String, Object> data) {
        // Very basic placeholder. In production, use Thymeleaf, FreeMarker, etc.
        return "Rendered template: " + templateName + " with data: " + data;
    }
}
