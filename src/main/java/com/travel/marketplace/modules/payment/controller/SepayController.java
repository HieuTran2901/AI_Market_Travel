package com.travel.marketplace.modules.payment.controller;

import com.travel.marketplace.modules.payment.enums.PaymentStatus;
import com.travel.marketplace.modules.payment.sepay.SepayIpnRequest;
import com.travel.marketplace.modules.payment.sepay.SepayProperties;
import com.travel.marketplace.modules.payment.service.AiCoinPaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

import org.springframework.http.HttpStatus;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/payments/sepay")
@RequiredArgsConstructor
public class SepayController {

    private final AiCoinPaymentService aiCoinPaymentService;
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
            if ("ORDER_PAID".equals(request.getNotification_type()) || "PAID".equalsIgnoreCase(request.getNotification_type())) {
                String invoiceNumber = null;
                if (request.getOrder() != null) {
                    invoiceNumber = request.getOrder().getOrder_invoice_number();
                } else if (request.getAdditionalProperties().containsKey("order_invoice_number")) {
                    invoiceNumber = (String) request.getAdditionalProperties().get("order_invoice_number");
                }

                if (invoiceNumber != null && invoiceNumber.startsWith("AICOIN_")) {
                    String[] parts = invoiceNumber.split("_");
                    if (parts.length >= 2) {
                        Long paymentId = Long.parseLong(parts[1]);
                        aiCoinPaymentService.handlePaymentStatusUpdate(paymentId, PaymentStatus.SUCCESS);
                        log.info("Successfully processed SePay IPN for paymentId={}", paymentId);
                    }
                }
            } else if ("TRANSACTION_VOID".equals(request.getNotification_type()) || "VOID".equalsIgnoreCase(request.getNotification_type())) {
                String invoiceNumber = null;
                if (request.getOrder() != null) {
                    invoiceNumber = request.getOrder().getOrder_invoice_number();
                }
                
                if (invoiceNumber != null && invoiceNumber.startsWith("AICOIN_")) {
                    String[] parts = invoiceNumber.split("_");
                    if (parts.length >= 2) {
                        Long paymentId = Long.parseLong(parts[1]);
                        aiCoinPaymentService.handlePaymentStatusUpdate(paymentId, PaymentStatus.FAILED);
                        log.info("Processed VOID SePay IPN for paymentId={}", paymentId);
                    }
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
    public RedirectView handleReturnSuccess() {
        String frontendUrl = sepayProperties.getFrontendRedirectUrl() + "?result=success";
        return new RedirectView(frontendUrl);
    }

    @GetMapping("/return/error")
    public RedirectView handleReturnError() {
        String frontendUrl = sepayProperties.getFrontendRedirectUrl() + "?result=error";
        return new RedirectView(frontendUrl);
    }

    @GetMapping("/return/cancel")
    public RedirectView handleReturnCancel() {
        String frontendUrl = sepayProperties.getFrontendRedirectUrl() + "?result=cancel";
        return new RedirectView(frontendUrl);
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
}
