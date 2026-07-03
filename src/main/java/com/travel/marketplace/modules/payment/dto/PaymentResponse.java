package com.travel.marketplace.modules.payment.dto;

import com.travel.marketplace.modules.payment.enums.PaymentMethod;
import com.travel.marketplace.modules.payment.enums.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {
    private Long id;
    private Long orderId;
    private BigDecimal amount;
    private String currency;
    private PaymentStatus status;
    private PaymentMethod paymentMethod;
    private Instant expiresAt;
    private Instant createdAt;
    private Instant updatedAt;
}
