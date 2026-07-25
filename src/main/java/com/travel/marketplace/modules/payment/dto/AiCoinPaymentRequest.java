package com.travel.marketplace.modules.payment.dto;

import com.travel.marketplace.modules.payment.enums.PaymentMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AiCoinPaymentRequest {
    @NotBlank
    private String packageId;

    @NotNull
    private PaymentMethod paymentMethod;

    private String promoCode;

    @NotBlank
    private String idempotencyKey;
}
