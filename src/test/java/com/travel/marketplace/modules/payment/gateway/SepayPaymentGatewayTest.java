package com.travel.marketplace.modules.payment.gateway;

import com.travel.marketplace.modules.payment.entity.Payment;
import com.travel.marketplace.modules.payment.sepay.SepayProperties;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class SepayPaymentGatewayTest {

    @Test
    @SuppressWarnings("unchecked")
    void checkoutFieldsIncludePaymentRefInReturnUrlsWithoutChangingFieldOrder() {
        SepayProperties properties = new SepayProperties();
        properties.setEnvironment("sandbox");
        properties.setMerchantId("MERCHANT");
        properties.setSecretKey("secret");
        properties.setSuccessUrl("https://example.test/api/v1/payments/sepay/return/success");
        properties.setErrorUrl("https://example.test/api/v1/payments/sepay/return/error");
        properties.setCancelUrl("https://example.test/api/v1/payments/sepay/return/cancel");
        SepayPaymentGateway gateway = new SepayPaymentGateway(properties);
        Payment payment = Payment.builder()
                .id(65L)
                .idempotencyKey("booking-key")
                .amount(BigDecimal.valueOf(9_471_000))
                .build();

        GatewayResponse response = gateway.processPayment(payment);
        Map<String, String> fields = (Map<String, String>) response.getRawResponse().get("checkoutFields");

        assertThat(fields.keySet()).containsExactly(
                "operation",
                "payment_method",
                "order_invoice_number",
                "order_amount",
                "currency",
                "order_description",
                "success_url",
                "error_url",
                "cancel_url",
                "merchant",
                "signature"
        );
        assertThat(fields.get("success_url")).contains("paymentRef=AICOIN_65_booking-");
        assertThat(fields.get("error_url")).contains("paymentRef=AICOIN_65_booking-");
        assertThat(fields.get("cancel_url")).contains("paymentRef=AICOIN_65_booking-");
    }
}
