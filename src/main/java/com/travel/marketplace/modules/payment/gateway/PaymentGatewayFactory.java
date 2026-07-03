package com.travel.marketplace.modules.payment.gateway;

import com.travel.marketplace.modules.payment.enums.PaymentMethod;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class PaymentGatewayFactory {

    private final Map<String, PaymentGateway> gateways;
    
    // We can inject specific beans or rely on Spring's map injection if we name the beans properly
    private final MockPaymentGateway mockPaymentGateway;

    public PaymentGateway getGateway(PaymentMethod method) {
        return switch (method) {
            case MOCK -> mockPaymentGateway;
            case COD, VNPAY, MOMO, ZALOPAY, STRIPE, PAYPAL -> 
                throw new UnsupportedOperationException("Gateway for " + method + " is not yet implemented.");
        };
    }
}
