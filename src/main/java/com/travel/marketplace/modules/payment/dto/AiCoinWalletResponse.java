package com.travel.marketplace.modules.payment.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class AiCoinWalletResponse {
    private long balance;
    private long lifetimeEarned;
    private long lifetimeSpent;
    private Instant updatedAt;
}
