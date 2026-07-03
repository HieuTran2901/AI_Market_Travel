package com.travel.marketplace.modules.payment.service;

import com.travel.marketplace.modules.payment.entity.Settlement;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public interface SettlementService {
    Settlement createSettlement(Long providerId, BigDecimal grossAmount, BigDecimal platformFee, BigDecimal taxAmount, Instant periodStart, Instant periodEnd);
    Settlement processSettlement(Long settlementId);
    Settlement completeSettlement(Long settlementId);
    Settlement failSettlement(Long settlementId);
    Settlement cancelSettlement(Long settlementId);
    List<Settlement> getSettlementsByProvider(Long providerId);
}
