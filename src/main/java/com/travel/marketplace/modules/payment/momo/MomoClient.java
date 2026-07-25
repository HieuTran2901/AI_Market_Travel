package com.travel.marketplace.modules.payment.momo;

public interface MomoClient {
    MomoCreatePaymentResponse createPayment(MomoCreatePaymentRequest request);
}
