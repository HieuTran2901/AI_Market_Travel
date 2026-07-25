package com.travel.marketplace.modules.payment.momo;

import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class MomoPropertiesTest {

    @Test
    void failsFastWhenEnabledCredentialsAreMissing() {
        MomoProperties properties = validProperties();
        properties.setSecretKey("");

        assertThatThrownBy(properties::validate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("MOMO_SECRETKEY");
    }

    @Test
    void rejectsNonPublicIpnUrlAndShortTimeout() {
        MomoProperties properties = validProperties();
        properties.setIpnUrl("http://localhost:8080/api/v1/payments/momo/ipn");
        assertThatThrownBy(properties::validate).hasMessageContaining("HTTPS");

        properties = validProperties();
        properties.setTimeout(Duration.ofSeconds(10));
        assertThatThrownBy(properties::validate).hasMessageContaining("at least 30 seconds");
    }

    @Test
    void acceptsCompleteSandboxConfiguration() {
        assertThatCode(validProperties()::validate).doesNotThrowAnyException();
    }

    private MomoProperties validProperties() {
        MomoProperties properties = new MomoProperties();
        properties.setEnabled(true);
        properties.setAccessKey("testAccess");
        properties.setSecretKey("testSecret");
        properties.setIpnUrl("https://api.example.com/api/v1/payments/momo/ipn");
        return properties;
    }
}
