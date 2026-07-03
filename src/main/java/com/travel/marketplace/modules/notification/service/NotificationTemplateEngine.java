package com.travel.marketplace.modules.notification.service;

import java.util.Map;

public interface NotificationTemplateEngine {
    String render(String templateName, Map<String, Object> data);
}
