package com.travel.marketplace.modules.payment.momo;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "payment.momo")
public class MomoProperties {

    private boolean enabled = true;
    private String partnerCode = "MOMO";
    private String accessKey;
    private String secretKey;
    private String endpoint = "https://test-payment.momo.vn/v2/gateway/api/create";
    private String redirectUrl = "http://localhost:5173/payments/momo/return";
    private String aiCoinRedirectUrl = "http://localhost:5173/ai-coins/payment-result";
    private String ipnUrl;
    private String requestType = "captureWallet";
    private String language = "en";
    private Duration timeout = Duration.ofSeconds(30);

    @PostConstruct
    void validate() {
        if (!enabled) {
            return;
        }
        requireConfigured("MOMO_ACCESSKEY", accessKey);
        requireConfigured("MOMO_SECRETKEY", secretKey);
        requireConfigured("MOMO_IPN_URL", ipnUrl);
        requireConfigured("MOMO_REDIRECT_URL", redirectUrl);
        requireConfigured("MOMO_AI_COIN_REDIRECT_URL", aiCoinRedirectUrl);
        requireConfigured("MOMO_ENDPOINT", endpoint);

        validateUri("MOMO_IPN_URL", ipnUrl, true);
        validateUri("MOMO_REDIRECT_URL", redirectUrl, false);
        validateUri("MOMO_AI_COIN_REDIRECT_URL", aiCoinRedirectUrl, false);
        validateUri("MOMO_ENDPOINT", endpoint, true);

        if (!ipnUrl.startsWith("https://")) {
            throw new IllegalStateException("MOMO_IPN_URL must be a publicly reachable HTTPS URL");
        }
        if (timeout.compareTo(Duration.ofSeconds(30)) < 0) {
            throw new IllegalStateException("MOMO_TIMEOUT must be at least 30 seconds");
        }
    }

    private void validateUri(String name, String uriString, boolean requireHttps) {
        try {
            java.net.URI uri = java.net.URI.create(uriString);
            if (uri.getScheme() == null || uri.getHost() == null) {
                throw new IllegalStateException(name + " must be a valid absolute URL");
            }
            if (requireHttps && !"https".equalsIgnoreCase(uri.getScheme())) {
                throw new IllegalStateException(name + " must use HTTPS scheme");
            }
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException(name + " is not a valid URI: " + e.getMessage(), e);
        }
    }

    private void requireConfigured(String environmentName, String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(environmentName + " must be configured when MoMo is enabled");
        }
    }
}
