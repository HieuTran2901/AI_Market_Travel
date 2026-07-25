package com.travel.marketplace.modules.payment.momo;

public record MomoCreatePaymentRequest(
        String partnerCode,
        String requestId,
        Long amount,
        String orderId,
        String orderInfo,
        String redirectUrl,
        String ipnUrl,
        String requestType,
        String extraData,
        Boolean autoCapture,
        String lang,
        String signature
) {
}
