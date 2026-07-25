package com.travel.marketplace.modules.payment.service;

import com.travel.marketplace.modules.payment.dto.PaymentRequest;
import com.travel.marketplace.modules.payment.dto.PaymentResponse;
import com.travel.marketplace.modules.payment.dto.WebhookPayload;

import com.travel.marketplace.modules.payment.dto.PaymentDetailResponse;

import java.util.List;

public interface PaymentService {
    PaymentResponse createPayment(PaymentRequest request, Long userId);
    PaymentDetailResponse getPayment(Long id, Long userId);
    PaymentResponse getMomoPaymentByGatewayOrderId(String gatewayOrderId, Long userId);
    List<PaymentResponse> getPaymentsForUser(Long userId);
    PaymentResponse cancelPayment(Long id, Long userId);
    void applyVerifiedGatewayStatus(Long paymentId, com.travel.marketplace.modules.payment.enums.PaymentStatus status);
    void handleWebhook(WebhookPayload payload);
}
