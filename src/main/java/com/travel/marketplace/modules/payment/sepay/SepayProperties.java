package com.travel.marketplace.modules.payment.sepay;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "payment.sepay")
public class SepayProperties {

    private boolean enabled = true;
    private String environment = "sandbox";
    private String merchantId;
    private String secretKey;
    private String ipnSecret;
    private String ipnUrl;
    private String successUrl;
    private String errorUrl;
    private String cancelUrl;
    private String frontendRedirectUrl = "http://localhost:5173/ai-coins/payment-result";
    private String bookingFrontendRedirectUrl = "http://localhost:5173/checkout";

    @PostConstruct
    void validate() {
        if (!enabled) {
            return;
        }
        requireConfigured("MERCHANTID", merchantId);
        requireConfigured("SEPAY_SECRETKEY", secretKey);
        requireConfigured("SEPAY_IPN_URL", ipnUrl);
        requireConfigured("SEPAY_SUCCESS_URL", successUrl);
        requireConfigured("SEPAY_ERROR_URL", errorUrl);
        requireConfigured("SEPAY_CANCEL_URL", cancelUrl);
    }

    private void requireConfigured(String environmentName, String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(environmentName + " must be configured when SePay is enabled");
        }
    }
}
