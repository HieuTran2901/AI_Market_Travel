package com.travel.marketplace.modules.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebhookPayload {
    private String gateway;
    private String eventType;
    private String transactionId;
    private String referenceId; // e.g., Payment ID
    private Map<String, Object> rawData;
}
