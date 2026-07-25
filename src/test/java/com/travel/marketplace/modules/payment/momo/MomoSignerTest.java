package com.travel.marketplace.modules.payment.momo;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class MomoSignerTest {

    private final MomoSigner signer = new MomoSigner();

    @Test
    void signsCreateRequestInOfficialFieldOrder() {
        MomoCreatePaymentRequest request = new MomoCreatePaymentRequest(
                "MOMO",
                "MOMO_REQ_123",
                150_000L,
                "MOMO_ORD_123",
                "pay with MoMo",
                "http://localhost:5173/payments/momo/return",
                "https://api.example.com/api/v1/payments/momo/ipn",
                "captureWallet",
                "",
                true,
                "en",
                ""
        );

        assertThat(signer.signCreate(request, "testAccess", "testSecret"))
                .isEqualTo("dbc1112ebfc93da9454fb0e5297b93a9563a20f0e2321b4ef43ff4db07e786cb");
    }

    @Test
    void signsIpnInOfficialFieldOrderAndComparesInConstantTime() {
        MomoIpnRequest request = ipn("ignored");
        String signature = signer.signIpn(request, "testAccess", "testSecret");

        assertThat(signature)
                .isEqualTo("964ec79a7ce433add124a445dcf997d54c4bbd130faff147e44f5664fc0f1d25");
        assertThat(signer.verify(signature, signature.toUpperCase())).isTrue();
        assertThat(signer.verify(signature, "invalid")).isFalse();
    }

    private MomoIpnRequest ipn(String signature) {
        return new MomoIpnRequest(
                "MOMO",
                "MOMO_ORD_123",
                "MOMO_REQ_123",
                150_000L,
                "pay with MoMo",
                "momo_wallet",
                123_456_789L,
                0,
                "Successful.",
                "qr",
                1_710_000_000_000L,
                "",
                signature
        );
    }
}
