package com.travel.marketplace.modules.payment.gateway;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GatewayResponse {
    private boolean success;
    private String gatewayTransactionId;
    private String gatewayStatus;
    private String errorMessage;
    private Map<String, Object> rawResponse;
}
