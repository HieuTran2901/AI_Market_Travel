package com.travel.marketplace.modules.payment.webhook;

import com.travel.marketplace.modules.payment.dto.WebhookPayload;
import com.travel.marketplace.modules.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebhookService {

    private final PaymentService paymentService;

    @Transactional
    public void processWebhook(WebhookPayload payload, String signature) {
        log.info("Processing webhook for gateway {} and event {}", payload.getGateway(), payload.getEventType());
        
        // 1. Validate signature using WebhookSignatureValidator (omitted for mock)
        // 2. Check idempotency (ensure we haven't processed this gateway event id before)
        // 3. Delegate to PaymentService to transition state
        
        paymentService.handleWebhook(payload);
    }
}
