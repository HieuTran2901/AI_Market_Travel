package com.travel.marketplace.modules.payment.controller;

import com.travel.marketplace.modules.payment.enums.PaymentStatus;
import com.travel.marketplace.modules.payment.entity.Payment;
import com.travel.marketplace.modules.payment.enums.PaymentPurpose;
import com.travel.marketplace.modules.payment.repository.PaymentRepository;
import com.travel.marketplace.modules.payment.sepay.SepayIpnRequest;
import com.travel.marketplace.modules.payment.sepay.SepayProperties;
import com.travel.marketplace.modules.payment.service.AiCoinPaymentService;
import com.travel.marketplace.modules.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

import org.springframework.http.HttpStatus;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/v1/payments/sepay")
@RequiredArgsConstructor
public class SepayController {

    private final AiCoinPaymentService aiCoinPaymentService;
    private final PaymentService paymentService;
    private final PaymentRepository paymentRepository;
    private final SepayProperties sepayProperties;

    @PostMapping("/ipn")
    public ResponseEntity<?> handleIpn(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestHeader(value = "X-Secret-Key", required = false) String secretKey,
            @RequestBody SepayIpnRequest request
    ) {
        log.info("Received SePay IPN: {}", request);
        
        String providedSecret = secretKey;
        if (providedSecret == null && authorization != null) {
            if (authorization.toLowerCase().startsWith("apikey ")) {
                providedSecret = authorization.substring(7).trim();
            } else if (authorization.toLowerCase().startsWith("bearer ")) {
                providedSecret = authorization.substring(7).trim();
            } else {
                providedSecret = authorization.trim();
            }
        }

        if (providedSecret != null) {
            providedSecret = providedSecret.trim();
        }

        String configuredIpnSecret = sepayProperties.getIpnSecret();
        
        if (configuredIpnSecret == null || configuredIpnSecret.isBlank()) {
            log.error("SEPAY_IPN_SECRET is not configured");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "SEPAY_IPN_SECRET_NOT_CONFIGURED"));
        }
        
        boolean headerPresent = providedSecret != null && !providedSecret.isBlank();
        boolean secretsMatch = secretsMatch(providedSecret, configuredIpnSecret.trim());
        
        log.info("SePay IPN authentication headerPresent={}, secretConfigured={}, matched={}",
                headerPresent, true, secretsMatch);

        if (!secretsMatch) {
            log.warn("Invalid or missing authentication in SePay IPN");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "SEPAY_IPN_AUTHENTICATION_FAILED"));
        }

        try {
            String invoiceNumber = resolveInvoiceNumber(request);
            if ("ORDER_PAID".equals(request.getNotification_type()) || "PAID".equalsIgnoreCase(request.getNotification_type())) {
                Optional<Payment> resolvedPayment = resolvePayment(invoiceNumber);
                if (resolvedPayment.isPresent()) {
                    Payment payment = resolvedPayment.get();
                    Long paymentId = payment.getId();
                    validateAmountIfPresent(payment, request);
                    if (payment.getPurpose() == PaymentPurpose.AI_COIN_PURCHASE) {
                        aiCoinPaymentService.handlePaymentStatusUpdate(paymentId, PaymentStatus.SUCCESS);
                    } else {
                        paymentService.handleWebhook(com.travel.marketplace.modules.payment.dto.WebhookPayload.builder()
                                .gateway("SEPAY")
                                .eventType("SUCCESS")
                                .transactionId(resolveWebhookTransactionId(request, invoiceNumber))
                                .referenceId(String.valueOf(paymentId))
                                .rawData(toRawData(request, invoiceNumber))
                                .build());
                    }
                    log.info("Successfully processed SePay IPN for paymentId={} purpose={}", paymentId, payment.getPurpose());
                }
            } else if ("TRANSACTION_VOID".equals(request.getNotification_type()) || "VOID".equalsIgnoreCase(request.getNotification_type())) {
                Optional<Payment> resolvedPayment = resolvePayment(invoiceNumber);
                if (resolvedPayment.isPresent()) {
                    Payment payment = resolvedPayment.get();
                    Long paymentId = payment.getId();
                    if (payment.getPurpose() == PaymentPurpose.AI_COIN_PURCHASE) {
                        aiCoinPaymentService.handlePaymentStatusUpdate(paymentId, PaymentStatus.FAILED);
                    } else {
                        paymentService.handleWebhook(com.travel.marketplace.modules.payment.dto.WebhookPayload.builder()
                                .gateway("SEPAY")
                                .eventType("FAILED")
                                .transactionId(resolveWebhookTransactionId(request, invoiceNumber))
                                .referenceId(String.valueOf(paymentId))
                                .rawData(toRawData(request, invoiceNumber))
                                .build());
                    }
                    log.info("Processed VOID SePay IPN for paymentId={} purpose={}", paymentId, payment.getPurpose());
                }
            }

            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            log.error("Error processing SePay IPN", e);
            // Return 200 so they stop retrying if it's our internal logic error that we can't recover from, 
            // or 500 if we want them to retry. SePay expects 200 for processed webhooks.
            return ResponseEntity.ok(Map.of("success", false, "message", "Internal processing error"));
        }
    }

    @GetMapping("/return/success")
    public RedirectView handleReturnSuccess(@RequestParam(value = "paymentRef", required = false) String paymentRef) {
        return new RedirectView(resolveFrontendReturnUrl(paymentRef, "success"));
    }

    @GetMapping("/return/error")
    public RedirectView handleReturnError(@RequestParam(value = "paymentRef", required = false) String paymentRef) {
        return new RedirectView(resolveFrontendReturnUrl(paymentRef, "error"));
    }

    @GetMapping("/return/cancel")
    public RedirectView handleReturnCancel(@RequestParam(value = "paymentRef", required = false) String paymentRef) {
        return new RedirectView(resolveFrontendReturnUrl(paymentRef, "cancel"));
    }

    private boolean secretsMatch(String provided, String configured) {
        if (provided == null || configured == null || provided.isBlank() || configured.isBlank()) {
            return false;
        }
        return MessageDigest.isEqual(
                provided.getBytes(StandardCharsets.UTF_8),
                configured.getBytes(StandardCharsets.UTF_8)
        );
    }

    private String resolveFrontendReturnUrl(String paymentRef, String result) {
        Optional<Payment> resolvedPayment = resolvePayment(paymentRef);
        if (resolvedPayment.isPresent()) {
            Payment payment = resolvedPayment.get();
            String baseUrl = payment.getPurpose() == PaymentPurpose.AI_COIN_PURCHASE
                    ? sepayProperties.getFrontendRedirectUrl()
                    : sepayProperties.getBookingFrontendRedirectUrl();
            return appendQuery(baseUrl, payment.getPurpose() == PaymentPurpose.AI_COIN_PURCHASE ? "result" : "sepayResult", result)
                    + "&paymentId=" + payment.getId();
        }

        log.warn("Unable to resolve SePay return paymentRef={}; redirecting to payment history", paymentRef);
        return appendQuery("http://localhost:5173/payments/history", "sepayResult", result);
    }

    private Optional<Payment> resolvePayment(String paymentRef) {
        Long paymentId = parsePaymentId(paymentRef);
        return paymentId == null ? Optional.empty() : paymentRepository.findById(paymentId);
    }

    private Long parsePaymentId(String paymentRef) {
        if (paymentRef == null || paymentRef.isBlank()) {
            return null;
        }
        String[] parts = paymentRef.split("_");
        if (parts.length >= 2) {
            try {
                return Long.parseLong(parts[1]);
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        try {
            return Long.parseLong(paymentRef);
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private String resolveInvoiceNumber(SepayIpnRequest request) {
        if (request.getOrder() != null && request.getOrder().getOrder_invoice_number() != null) {
            return request.getOrder().getOrder_invoice_number();
        }
        Object value = request.getAdditionalProperties().get("order_invoice_number");
        return value == null ? null : String.valueOf(value);
    }

    private void validateAmountIfPresent(Payment payment, SepayIpnRequest request) {
        if (request.getOrder() == null || request.getOrder().getOrder_amount() == null) {
            return;
        }
        BigDecimal providerAmount = new BigDecimal(request.getOrder().getOrder_amount());
        if (payment.getAmount().compareTo(providerAmount) != 0) {
            throw new IllegalArgumentException("SePay IPN amount mismatch for paymentId=" + payment.getId());
        }
    }

    private String resolveWebhookTransactionId(SepayIpnRequest request, String invoiceNumber) {
        Object transactionId = request.getAdditionalProperties().get("transaction_id");
        if (transactionId == null) {
            transactionId = request.getAdditionalProperties().get("transaction_reference");
        }
        return "sepay:"
                + (request.getNotification_type() != null ? request.getNotification_type() : "unknown")
                + ":"
                + (invoiceNumber != null ? invoiceNumber : "unknown")
                + ":"
                + (transactionId != null ? transactionId : "provider");
    }

    private Map<String, Object> toRawData(SepayIpnRequest request, String invoiceNumber) {
        Map<String, Object> rawData = new LinkedHashMap<>(request.getAdditionalProperties());
        rawData.put("notification_type", request.getNotification_type());
        rawData.put("order_invoice_number", invoiceNumber);
        if (request.getOrder() != null) {
            rawData.put("order_amount", request.getOrder().getOrder_amount());
            rawData.put("order_status", request.getOrder().getOrder_status());
        }
        return rawData;
    }

    private String appendQuery(String url, String key, String value) {
        String separator = url.contains("?") ? "&" : "?";
        return url + separator + key + "=" + URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
