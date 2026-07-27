package com.travel.marketplace.modules.payment.gateway;

import com.travel.marketplace.modules.payment.entity.Payment;
import com.travel.marketplace.modules.payment.sepay.SepayProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.StringJoiner;

@Slf4j
@Component
@RequiredArgsConstructor
public class SepayPaymentGateway implements PaymentGateway {

    private final SepayProperties properties;

    @Override
    public GatewayResponse processPayment(Payment payment) {
        if (!properties.isEnabled()) {
            throw new IllegalStateException("SePay payment gateway is disabled");
        }

        String invoiceNumber = "AICOIN_" + payment.getId() + "_" + payment.getIdempotencyKey().substring(0, Math.min(8, payment.getIdempotencyKey().length()));
        String amountStr = String.valueOf(payment.getAmount().longValue());

        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("operation", "PURCHASE");
        fields.put("payment_method", "BANK_TRANSFER");
        fields.put("order_invoice_number", invoiceNumber);
        fields.put("order_amount", amountStr);
        fields.put("currency", "VND");
        fields.put("order_description", "AI Coin package payment");
        fields.put("success_url", properties.getSuccessUrl());
        fields.put("error_url", properties.getErrorUrl());
        fields.put("cancel_url", properties.getCancelUrl());
        fields.put("merchant", properties.getMerchantId());

        String signature = generateSignature(fields, properties.getSecretKey());
        fields.put("signature", signature);

        String checkoutUrl = "sandbox".equalsIgnoreCase(properties.getEnvironment()) 
            ? "https://pay-sandbox.sepay.vn/v1/checkout/init" 
            : "https://pay.sepay.vn/v1/checkout/init";

        Map<String, Object> rawResponse = new LinkedHashMap<>();
        rawResponse.put("checkoutUrl", checkoutUrl);
        rawResponse.put("checkoutFields", fields);
        rawResponse.put("invoiceNumber", invoiceNumber);

        log.info("Created SePay checkout for payment {}, invoice {}", payment.getId(), invoiceNumber);

        return GatewayResponse.builder()
                .success(true)
                .gatewayTransactionId(invoiceNumber)
                .gatewayStatus("PENDING")
                .rawResponse(rawResponse)
                .build();
    }

    @Override
    public GatewayResponse processRefund(Payment payment, BigDecimal amount, String reason) {
        throw new UnsupportedOperationException("Refund is not supported via SePay Bank Transfer");
    }

    private String generateSignature(Map<String, String> fields, String secretKey) {
        try {
            StringJoiner joiner = new StringJoiner(",");
            for (Map.Entry<String, String> entry : fields.entrySet()) {
                if (entry.getValue() != null && !entry.getValue().isEmpty()) {
                    joiner.add(entry.getKey() + "=" + entry.getValue());
                }
            }
            String signString = joiner.toString();
            
            Mac sha256_HMAC = Mac.getInstance("HmacSHA256");
            SecretKeySpec secret_key = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256_HMAC.init(secret_key);

            byte[] hash = sha256_HMAC.doFinal(signString.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            log.error("Failed to generate SePay signature", e);
            throw new IllegalStateException("Failed to generate signature for checkout");
        }
    }
}
