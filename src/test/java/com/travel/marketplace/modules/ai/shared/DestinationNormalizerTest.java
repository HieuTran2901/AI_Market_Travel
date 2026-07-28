package com.travel.marketplace.modules.ai.shared;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class DestinationNormalizerTest {

    @Test
    void normalizesHanoiAliases() {
        assertThat(DestinationNormalizer.key("H\u00e0 N\u1ed9i")).isEqualTo("ha noi");
        assertThat(DestinationNormalizer.key("Ha Noi")).isEqualTo("ha noi");
        assertThat(DestinationNormalizer.key("Hanoi")).isEqualTo("hanoi");
        assertThat(DestinationNormalizer.canonicalize("Hanoi City")).isEqualTo("Ha Noi");
        assertThat(DestinationNormalizer.aliases("H\u00e0 N\u1ed9i"))
                .contains("Ha Noi", "Hanoi", "H\u00e0 N\u1ed9i", "Hanoi City", "Hanoi, Vietnam");
    }

    @Test
    void normalizesCommonVietnameseDestinationAliases() {
        assertThat(DestinationNormalizer.canonicalize("danang")).isEqualTo("Da Nang");
        assertThat(DestinationNormalizer.canonicalize("hcmc")).isEqualTo("Ho Chi Minh City");
        assertThat(DestinationNormalizer.canonicalize("saigon")).isEqualTo("Ho Chi Minh City");
        assertThat(DestinationNormalizer.canonicalize("dalat")).isEqualTo("Da Lat");
        assertThat(DestinationNormalizer.canonicalize("Hoi An Ancient Town")).isEqualTo("Hoi An");
    }
}
