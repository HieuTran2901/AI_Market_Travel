package com.travel.marketplace.modules.payment.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiCoinMomoReturnRequest {
    @NotNull
    private Long paymentId;
    
    private String orderId;
    private String requestId;
    private Integer resultCode;
    private String message;
    private Long transId;
    private Long amount;
    private String extraData;
}
