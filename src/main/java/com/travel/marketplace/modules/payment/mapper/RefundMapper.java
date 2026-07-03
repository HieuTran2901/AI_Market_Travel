package com.travel.marketplace.modules.payment.mapper;

import com.travel.marketplace.modules.payment.dto.RefundResponse;
import com.travel.marketplace.modules.payment.entity.Refund;
import org.springframework.stereotype.Component;

@Component
public class RefundMapper {

    public RefundResponse toResponse(Refund refund) {
        if (refund == null) {
            return null;
        }

        return RefundResponse.builder()
                .id(refund.getId())
                .paymentId(refund.getPayment() != null ? refund.getPayment().getId() : null)
                .amount(refund.getAmount())
                .reason(refund.getReason())
                .status(refund.getStatus())
                .refundMethod(refund.getRefundMethod())
                .requestedBy(refund.getRequestedBy() != null ? refund.getRequestedBy().getId() : null)
                .processedBy(refund.getProcessedBy() != null ? refund.getProcessedBy().getId() : null)
                .processedAt(refund.getProcessedAt())
                .createdAt(refund.getCreatedAt())
                .updatedAt(refund.getUpdatedAt())
                .build();
    }
}
