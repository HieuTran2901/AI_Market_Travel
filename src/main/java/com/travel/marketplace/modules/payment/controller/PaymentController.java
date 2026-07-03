package com.travel.marketplace.modules.payment.controller;

import com.travel.marketplace.dto.ApiResponse;
import com.travel.marketplace.modules.payment.dto.PaymentRequest;
import com.travel.marketplace.modules.payment.dto.PaymentResponse;
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
    public ApiResponse<PaymentResponse> createPayment(@RequestBody PaymentRequest request) {
        PaymentResponse response = paymentService.createPayment(request);
        return ApiResponse.success("Payment created successfully", response);
    }

    @GetMapping("/{id}")
    public ApiResponse<PaymentResponse> getPayment(@PathVariable Long id) {
        PaymentResponse response = paymentService.getPayment(id);
        return ApiResponse.success("Payment retrieved successfully", response);
    }

    @GetMapping
    public ApiResponse<List<PaymentResponse>> getMyPayments(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<PaymentResponse> response = paymentService.getPaymentsForUser(userPrincipal.getId());
        return ApiResponse.success("Payments retrieved successfully", response);
    }

    @PostMapping("/{id}/cancel")
    public ApiResponse<PaymentResponse> cancelPayment(@PathVariable Long id) {
        PaymentResponse response = paymentService.cancelPayment(id);
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
