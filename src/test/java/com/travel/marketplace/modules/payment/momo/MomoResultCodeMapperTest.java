package com.travel.marketplace.modules.payment.momo;

import com.travel.marketplace.modules.payment.enums.PaymentStatus;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class MomoResultCodeMapperTest {

    private final MomoResultCodeMapper mapper = new MomoResultCodeMapper();

    @Test
    void mapsDocumentedResultCodes() {
        assertThat(mapper.map(0)).isEqualTo(PaymentStatus.SUCCESS);
        assertThat(mapper.map(9000)).isEqualTo(PaymentStatus.PROCESSING);
        assertThat(mapper.map(1000)).isEqualTo(PaymentStatus.PROCESSING);
        assertThat(mapper.map(7000)).isEqualTo(PaymentStatus.PROCESSING);
        assertThat(mapper.map(1005)).isEqualTo(PaymentStatus.EXPIRED);
        assertThat(mapper.map(1006)).isEqualTo(PaymentStatus.CANCELLED);
        assertThat(mapper.map(1017)).isEqualTo(PaymentStatus.CANCELLED);
        assertThat(mapper.map(42)).isEqualTo(PaymentStatus.FAILED);
    }
}
