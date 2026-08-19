package com.travel.marketplace.modules.payment.momo;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class MomoPropertiesTest {

    @Test
    @DisplayName("Fails fast when secret key is missing")
    void failsFastWhenSecretKeyIsMissing() {
        MomoProperties properties = validProperties();
        properties.setSecretKey("");

        assertThatThrownBy(properties::validate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("MOMO_SECRETKEY");
    }

    @Test
    @DisplayName("Fails fast when access key is missing")
    void failsFastWhenAccessKeyIsMissing() {
        MomoProperties properties = validProperties();
        properties.setAccessKey("");

        assertThatThrownBy(properties::validate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("MOMO_ACCESSKEY");
    }

    @Test
    @DisplayName("Fails fast when MOMO_REDIRECT_URL is missing")
    void failsFastWhenRedirectUrlIsMissing() {
        MomoProperties properties = validProperties();
        properties.setRedirectUrl("");

        assertThatThrownBy(properties::validate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("MOMO_REDIRECT_URL");
    }

    @Test
    @DisplayName("Fails fast when MOMO_AI_COIN_REDIRECT_URL is missing")
    void failsFastWhenAiCoinRedirectUrlIsMissing() {
        MomoProperties properties = validProperties();
        properties.setAiCoinRedirectUrl("");

        assertThatThrownBy(properties::validate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("MOMO_AI_COIN_REDIRECT_URL");
    }

    @Test
    @DisplayName("Fails fast when MOMO_IPN_URL is missing")
    void failsFastWhenIpnUrlIsMissing() {
        MomoProperties properties = validProperties();
        properties.setIpnUrl("");

        assertThatThrownBy(properties::validate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("MOMO_IPN_URL");
    }

    @Test
    @DisplayName("Rejects non-HTTPS IPN URL")
    void rejectsNonHttpsIpnUrl() {
        MomoProperties properties = validProperties();
        properties.setIpnUrl("http://localhost:8080/api/v1/payments/momo/ipn");

        assertThatThrownBy(properties::validate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("HTTPS");
    }

    @Test
    @DisplayName("Rejects timeout less than 30 seconds")
    void rejectsShortTimeout() {
        MomoProperties properties = validProperties();
        properties.setTimeout(Duration.ofSeconds(10));

        assertThatThrownBy(properties::validate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("at least 30 seconds");
    }

    @Test
    @DisplayName("Accepts complete valid Sandbox configuration")
    void acceptsCompleteSandboxConfiguration() {
        MomoProperties properties = validProperties();
        properties.setEndpoint("https://test-payment.momo.vn/v2/gateway/api/create");
        properties.setRedirectUrl("https://ai-market-travel.vercel.app/payments/momo/return");
        properties.setAiCoinRedirectUrl("https://ai-market-travel.vercel.app/ai-coins/payment-result");
        properties.setIpnUrl("https://aimarkettravel-production.up.railway.app/api/v1/payments/momo/ipn");

        assertThatCode(properties::validate).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Accepts complete valid Production configuration")
    void acceptsCompleteProductionConfiguration() {
        MomoProperties properties = validProperties();
        properties.setEndpoint("https://payment.momo.vn/v2/gateway/api/create");
        properties.setRedirectUrl("https://ai-market-travel.vercel.app/payments/momo/return");
        properties.setAiCoinRedirectUrl("https://ai-market-travel.vercel.app/ai-coins/payment-result");
        properties.setIpnUrl("https://aimarkettravel-production.up.railway.app/api/v1/payments/momo/ipn");

        assertThatCode(properties::validate).doesNotThrowAnyException();
    }

    private MomoProperties validProperties() {
        MomoProperties properties = new MomoProperties();
        properties.setEnabled(true);
        properties.setAccessKey("testAccess");
        properties.setSecretKey("testSecret");
        properties.setEndpoint("https://test-payment.momo.vn/v2/gateway/api/create");
        properties.setRedirectUrl("https://ai-market-travel.vercel.app/payments/momo/return");
        properties.setAiCoinRedirectUrl("https://ai-market-travel.vercel.app/ai-coins/payment-result");
        properties.setIpnUrl("https://aimarkettravel-production.up.railway.app/api/v1/payments/momo/ipn");
        return properties;
    }
}
