package com.travel.marketplace.modules.payment.gateway;

import com.travel.marketplace.modules.payment.entity.Payment;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@Service
public class MockPaymentGateway implements PaymentGateway {

    @Override
    public GatewayResponse processPayment(Payment payment) {
        String scenario = payment.getIdempotencyKey() != null
                ? payment.getIdempotencyKey().toLowerCase()
                : "";

        if (scenario.contains("timeout") || scenario.contains("expired")) {
            return GatewayResponse.builder()
                    .success(false)
                    .gatewayTransactionId("mock-timeout-" + UUID.randomUUID())
                    .gatewayStatus("EXPIRED")
                    .errorMessage("Mock payment session expired")
                    .rawResponse(Map.of("mock", true, "scenario", "timeout", "amount", payment.getAmount()))
                    .build();
        }

        if (scenario.contains("fail") || scenario.contains("failed")) {
            return GatewayResponse.builder()
                    .success(false)
                    .gatewayTransactionId("mock-failed-" + UUID.randomUUID())
                    .gatewayStatus("FAILED")
                    .errorMessage("Mock payment failed")
                    .rawResponse(Map.of("mock", true, "scenario", "failure", "amount", payment.getAmount()))
                    .build();
        }

        return GatewayResponse.builder()
                .success(true)
                .gatewayTransactionId("mock-txn-" + UUID.randomUUID())
                .gatewayStatus("SUCCESS")
                .rawResponse(Map.of("mock", true, "amount", payment.getAmount()))
                .build();
    }

    @Override
    public GatewayResponse processRefund(Payment payment, BigDecimal amount, String reason) {
        // Simulate a successful refund
        return GatewayResponse.builder()
                .success(true)
                .gatewayTransactionId("mock-ref-" + UUID.randomUUID())
                .gatewayStatus("REFUNDED")
                .rawResponse(Map.of("mock", true, "refundAmount", amount, "reason", reason))
                .build();
    }
}
