package com.travel.marketplace.modules.payment.gateway;

import com.travel.marketplace.modules.payment.entity.Payment;

public interface PaymentGateway {
    GatewayResponse processPayment(Payment payment);
    GatewayResponse processRefund(Payment payment, java.math.BigDecimal amount, String reason);
}
