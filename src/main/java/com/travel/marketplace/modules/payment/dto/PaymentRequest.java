package com.travel.marketplace.modules.payment.dto;

import com.travel.marketplace.modules.payment.enums.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequest {
    private Long orderId;
    private PaymentMethod paymentMethod;
    private String idempotencyKey;
}
