package com.travel.marketplace.modules.notification.dto;

import com.travel.marketplace.modules.notification.enums.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendNotificationRequest {
    private Long userId;
    private String recipientEmail;
    private NotificationType type;
    private String title;
    private String message;
    private boolean isHtml;
    
    /** Used by email channels to render templates */
    private Map<String, Object> templateData;
}
