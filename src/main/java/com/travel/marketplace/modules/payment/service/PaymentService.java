package com.travel.marketplace.modules.payment.service;

import com.travel.marketplace.modules.payment.dto.PaymentRequest;
import com.travel.marketplace.modules.payment.dto.PaymentResponse;
import com.travel.marketplace.modules.payment.dto.WebhookPayload;

import java.util.List;

public interface PaymentService {
    PaymentResponse createPayment(PaymentRequest request);
    PaymentResponse getPayment(Long id);
    List<PaymentResponse> getPaymentsForUser(Long userId);
    PaymentResponse cancelPayment(Long id);
    void handleWebhook(WebhookPayload payload);
}
