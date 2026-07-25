package com.travel.marketplace.modules.payment.momo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record MomoCreatePaymentResponse(
        String partnerCode,
        String orderId,
        String requestId,
        Long amount,
        Long responseTime,
        String message,
        Integer resultCode,
        String payUrl,
        String deeplink,
        String qrCodeUrl,
        String signature
) {
}
