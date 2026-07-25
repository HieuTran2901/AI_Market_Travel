package com.travel.marketplace.modules.payment.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
public class AiCoinPaymentStatusResponse {
    private Long paymentId;
    private Long purchaseId;
    private String status;
    private String purchaseStatus;
    private boolean credited;
    private BigDecimal amount;
    private String currency;
    private Integer gatewayResultCode;
    private int baseCoins;
    private int bonusCoins;
    private int totalCoins;
    private Instant updatedAt;
}
