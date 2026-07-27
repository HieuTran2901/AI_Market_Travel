package com.travel.marketplace.modules.payment.dto;

import com.travel.marketplace.modules.payment.enums.AiCoinTransactionDirection;
import com.travel.marketplace.modules.payment.enums.AiCoinTransactionType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class AiCoinTransactionResponse {
    private Long id;
    private AiCoinTransactionType type;
    private AiCoinTransactionDirection direction;
    private long amount;
    private long balanceAfter;
    private String reference;
    private String description;
    private Instant createdAt;
}
