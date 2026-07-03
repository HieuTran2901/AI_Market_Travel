package com.travel.marketplace.modules.payment.gateway;

import com.travel.marketplace.modules.payment.dto.WebhookPayload;

public interface WebhookSignatureValidator {
    /**
     * Validates the signature of an incoming webhook payload.
     * @param payload the incoming payload
     * @param signatureHeader the signature provided in the request headers
     * @return true if valid, false otherwise
     */
    boolean isValid(WebhookPayload payload, String signatureHeader);
}
