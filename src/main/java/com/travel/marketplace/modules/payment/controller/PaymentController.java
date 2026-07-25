package com.travel.marketplace.modules.payment.controller;

import com.travel.marketplace.dto.ApiResponse;
import com.travel.marketplace.modules.payment.dto.PaymentRequest;
import com.travel.marketplace.modules.payment.dto.PaymentResponse;
import com.travel.marketplace.modules.payment.dto.PaymentDetailResponse;
import com.travel.marketplace.modules.payment.dto.WebhookPayload;
import com.travel.marketplace.modules.payment.service.PaymentService;
import com.travel.marketplace.modules.payment.webhook.WebhookService;
import com.travel.marketplace.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final WebhookService webhookService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<PaymentResponse> createPayment(
            @RequestBody PaymentRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        PaymentResponse response = paymentService.createPayment(request, userPrincipal.getId());
        return ApiResponse.success("Payment created successfully", response);
    }

    @GetMapping("/{id}")
    public ApiResponse<PaymentDetailResponse> getPayment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        PaymentDetailResponse response = paymentService.getPayment(id, userPrincipal.getId());
        return ApiResponse.success("Payment retrieved successfully", response);
    }

    @GetMapping
    public ApiResponse<List<PaymentResponse>> getMyPayments(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<PaymentResponse> response = paymentService.getPaymentsForUser(userPrincipal.getId());
        return ApiResponse.success("Payments retrieved successfully", response);
    }

    @GetMapping("/momo/status")
    public ApiResponse<PaymentResponse> getMomoPaymentStatus(
            @RequestParam String orderId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        PaymentResponse response = paymentService.getMomoPaymentByGatewayOrderId(orderId, userPrincipal.getId());
        return ApiResponse.success("MoMo payment retrieved successfully", response);
    }

    @PostMapping("/{id}/cancel")
    public ApiResponse<PaymentResponse> cancelPayment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        PaymentResponse response = paymentService.cancelPayment(id, userPrincipal.getId());
        return ApiResponse.success("Payment cancelled successfully", response);
    }

    @PostMapping("/webhook")
    public ApiResponse<Void> handleWebhook(
            @RequestHeader(value = "X-Signature", required = false) String signature,
            @RequestBody WebhookPayload payload) {
        webhookService.processWebhook(payload, signature);
        return ApiResponse.success("Webhook processed successfully", null);
    }
}
