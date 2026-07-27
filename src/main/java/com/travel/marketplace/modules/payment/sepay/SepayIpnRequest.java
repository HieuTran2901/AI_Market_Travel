package com.travel.marketplace.modules.payment.sepay;

import com.fasterxml.jackson.annotation.JsonAnySetter;
import lombok.Data;

import java.util.LinkedHashMap;
import java.util.Map;

@Data
public class SepayIpnRequest {
    private String notification_type;
    private SepayOrder order;
    private Map<String, Object> additionalProperties = new LinkedHashMap<>();

    @JsonAnySetter
    public void setAdditionalProperty(String key, Object value) {
        additionalProperties.put(key, value);
    }

    @Data
    public static class SepayOrder {
        private String order_invoice_number;
        private String order_amount;
        private String order_status;
        private Map<String, Object> additionalProperties = new LinkedHashMap<>();

        @JsonAnySetter
        public void setAdditionalProperty(String key, Object value) {
            additionalProperties.put(key, value);
        }
    }
}
