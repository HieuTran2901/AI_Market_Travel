package com.travel.marketplace.modules.payment.dto;

import com.travel.marketplace.modules.payment.enums.SettlementStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
public class SettlementResponse {
    private Long id;
    private Long providerId;
    private BigDecimal amount;
    private BigDecimal grossAmount;
    private BigDecimal platformFee;
    private BigDecimal providerAmount;
    private BigDecimal taxAmount;
    private String currency;
    private SettlementStatus status;
    private Instant periodStart;
    private Instant periodEnd;
    private Instant createdAt;
    private Instant updatedAt;
}
