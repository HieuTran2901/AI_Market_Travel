package com.travel.marketplace.modules.payment.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AiCoinCreditResult {
    private long balance;
    private long creditedAmount;
    private boolean duplicate;
}
