package com.travel.marketplace.modules.payment.gateway;

import com.travel.marketplace.modules.payment.enums.PaymentMethod;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Component;

@Component
public class PaymentGatewayFactory {

    private final MockPaymentGateway mockPaymentGateway;
    private final ObjectProvider<MomoPaymentGateway> momoPaymentGateway;
    private final ObjectProvider<SepayPaymentGateway> sepayPaymentGateway;

    public PaymentGatewayFactory(
            MockPaymentGateway mockPaymentGateway,
            ObjectProvider<MomoPaymentGateway> momoPaymentGateway,
            ObjectProvider<SepayPaymentGateway> sepayPaymentGateway
    ) {
        this.mockPaymentGateway = mockPaymentGateway;
        this.momoPaymentGateway = momoPaymentGateway;
        this.sepayPaymentGateway = sepayPaymentGateway;
    }

    public PaymentGateway getGateway(PaymentMethod method) {
        return switch (method) {
            case MOCK -> mockPaymentGateway;
            case MOMO -> momoPaymentGateway.getIfAvailable(() -> {
                throw new IllegalStateException("MoMo payment gateway is disabled");
            });
            case BANK_TRANSFER -> sepayPaymentGateway.getIfAvailable(() -> {
                throw new IllegalStateException("SePay payment gateway is disabled");
            });
            case COD, VNPAY, ZALOPAY, STRIPE, PAYPAL ->
                throw new UnsupportedOperationException("Gateway for " + method + " is not yet implemented.");
        };
    }
}
