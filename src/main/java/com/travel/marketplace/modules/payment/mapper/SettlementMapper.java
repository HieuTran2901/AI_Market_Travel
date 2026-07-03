package com.travel.marketplace.modules.payment.mapper;

import com.travel.marketplace.modules.payment.dto.SettlementResponse;
import com.travel.marketplace.modules.payment.entity.Settlement;
import org.springframework.stereotype.Component;

@Component
public class SettlementMapper {

    public SettlementResponse toResponse(Settlement settlement) {
        if (settlement == null) {
            return null;
        }

        return SettlementResponse.builder()
                .id(settlement.getId())
                .providerId(settlement.getProvider() != null ? settlement.getProvider().getId() : null)
                .amount(settlement.getAmount())
                .grossAmount(settlement.getGrossAmount())
                .platformFee(settlement.getPlatformFee())
                .providerAmount(settlement.getProviderAmount())
                .taxAmount(settlement.getTaxAmount())
                .currency(settlement.getCurrency())
                .status(settlement.getStatus())
                .periodStart(settlement.getPeriodStart())
                .periodEnd(settlement.getPeriodEnd())
                .createdAt(settlement.getCreatedAt())
                .updatedAt(settlement.getUpdatedAt())
                .build();
    }
}
