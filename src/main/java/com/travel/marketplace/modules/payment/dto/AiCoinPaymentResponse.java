package com.travel.marketplace.modules.payment.dto;

import com.travel.marketplace.modules.payment.enums.PaymentMethod;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
public class AiCoinPaymentResponse {
    private Long purchaseId;
    private Long paymentId;
    private String transactionId;
    private String status;
    private PaymentMethod paymentMethod;
    private BigDecimal amount;
    private String currency;
    private String paymentUrl;
    private String deeplink;
    private String qrCodeUrl;
    private Instant expiresAt;
}
