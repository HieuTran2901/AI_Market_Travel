package com.travel.marketplace.modules.payment.dto;

import com.travel.marketplace.modules.payment.enums.RefundMethod;
import com.travel.marketplace.modules.payment.enums.RefundReason;
import com.travel.marketplace.modules.payment.enums.RefundStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
public class RefundResponse {
    private Long id;
    private Long paymentId;
    private BigDecimal amount;
    private RefundReason reason;
    private RefundStatus status;
    private RefundMethod refundMethod;
    private Long requestedBy;
    private Long processedBy;
    private Instant processedAt;
    private Instant createdAt;
    private Instant updatedAt;
}
