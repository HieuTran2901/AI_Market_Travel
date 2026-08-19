package com.travel.marketplace.modules.payment.gateway;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.travel.marketplace.modules.payment.entity.Payment;
import com.travel.marketplace.modules.payment.entity.PaymentTransaction;
import com.travel.marketplace.modules.payment.enums.PaymentMethod;
import com.travel.marketplace.modules.payment.enums.PaymentPurpose;
import com.travel.marketplace.modules.payment.enums.PaymentStatus;
import com.travel.marketplace.modules.payment.momo.MomoClient;
import com.travel.marketplace.modules.payment.momo.MomoCreatePaymentRequest;
import com.travel.marketplace.modules.payment.momo.MomoCreatePaymentResponse;
import com.travel.marketplace.modules.payment.momo.MomoProperties;
import com.travel.marketplace.modules.payment.momo.MomoSigner;
import com.travel.marketplace.modules.payment.repository.PaymentTransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class MomoPaymentGatewayTest {

    private MomoProperties properties;
    private MomoSigner signer;
    private MomoClient client;
    private PaymentTransactionRepository transactionRepository;
    private ObjectMapper objectMapper;
    private MomoPaymentGateway gateway;

    @BeforeEach
    void setUp() {
        properties = new MomoProperties();
        properties.setEnabled(true);
        properties.setPartnerCode("MOMO");
        properties.setAccessKey("testAccessKey");
        properties.setSecretKey("testSecretKey");
        properties.setEndpoint("https://test-payment.momo.vn/v2/gateway/api/create");
        properties.setRedirectUrl("https://ai-market-travel.vercel.app/payments/momo/return");
        properties.setAiCoinRedirectUrl("https://ai-market-travel.vercel.app/ai-coins/payment-result");
        properties.setIpnUrl("https://aimarkettravel-production.up.railway.app/api/v1/payments/momo/ipn");

        signer = new MomoSigner();
        client = mock(MomoClient.class);
        transactionRepository = mock(PaymentTransactionRepository.class);
        objectMapper = new ObjectMapper();

        gateway = new MomoPaymentGateway(properties, signer, client, transactionRepository, objectMapper);
    }

    @Test
    @DisplayName("Successfully processes payment and accepts Sandbox payUrl (test-payment.momo.vn)")
    void processesPaymentAndAcceptsSandboxPayUrl() {
        Payment payment = Payment.builder()
                .id(101L)
                .amount(BigDecimal.valueOf(150_000))
                .currency("VND")
                .paymentMethod(PaymentMethod.MOMO)
                .purpose(PaymentPurpose.BOOKING)
                .status(PaymentStatus.PENDING)
                .build();

        when(client.createPayment(any(MomoCreatePaymentRequest.class))).thenAnswer(invocation -> {
            MomoCreatePaymentRequest req = invocation.getArgument(0);
            return new MomoCreatePaymentResponse(
                    req.partnerCode(),
                    req.orderId(),
                    req.requestId(),
                    req.amount(),
                    1_710_000_000_000L,
                    "Success",
                    0,
                    "https://test-payment.momo.vn/v2/gateway/pay?s=12345",
                    "momo://app",
                    "https://test-payment.momo.vn/qr/123",
                    "dummySignature"
            );
        });

        GatewayResponse response = gateway.processPayment(payment);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getGatewayStatus()).isEqualTo("PROCESSING");
        assertThat(response.getRawResponse()).containsEntry("payUrl", "https://test-payment.momo.vn/v2/gateway/pay?s=12345");

        ArgumentCaptor<PaymentTransaction> txCaptor = ArgumentCaptor.forClass(PaymentTransaction.class);
        verify(transactionRepository, atLeastOnce()).save(txCaptor.capture());
        PaymentTransaction savedTx = txCaptor.getValue();
        assertThat(savedTx.getStatus()).isEqualTo("PROCESSING");
        assertThat(savedTx.getPayUrl()).isEqualTo("https://test-payment.momo.vn/v2/gateway/pay?s=12345");
    }

    @Test
    @DisplayName("Successfully processes payment and accepts Production payUrl (payment.momo.vn)")
    void processesPaymentAndAcceptsProductionPayUrl() {
        properties.setEndpoint("https://payment.momo.vn/v2/gateway/api/create");

        Payment payment = Payment.builder()
                .id(102L)
                .amount(BigDecimal.valueOf(200_000))
                .currency("VND")
                .paymentMethod(PaymentMethod.MOMO)
                .purpose(PaymentPurpose.BOOKING)
                .status(PaymentStatus.PENDING)
                .build();

        when(client.createPayment(any(MomoCreatePaymentRequest.class))).thenAnswer(invocation -> {
            MomoCreatePaymentRequest req = invocation.getArgument(0);
            return new MomoCreatePaymentResponse(
                    req.partnerCode(),
                    req.orderId(),
                    req.requestId(),
                    req.amount(),
                    1_710_000_000_000L,
                    "Success",
                    0,
                    "https://payment.momo.vn/v2/gateway/pay?s=67890",
                    "momo://app",
                    "https://payment.momo.vn/qr/678",
                    "dummySignature"
            );
        });

        GatewayResponse response = gateway.processPayment(payment);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getGatewayStatus()).isEqualTo("PROCESSING");
    }

    @Test
    @DisplayName("Rejects untrusted / malicious payUrl domain")
    void rejectsUntrustedPayUrlDomain() {
        Payment payment = Payment.builder()
                .id(103L)
                .amount(BigDecimal.valueOf(100_000))
                .currency("VND")
                .paymentMethod(PaymentMethod.MOMO)
                .purpose(PaymentPurpose.BOOKING)
                .status(PaymentStatus.PENDING)
                .build();

        when(client.createPayment(any(MomoCreatePaymentRequest.class))).thenAnswer(invocation -> {
            MomoCreatePaymentRequest req = invocation.getArgument(0);
            return new MomoCreatePaymentResponse(
                    req.partnerCode(),
                    req.orderId(),
                    req.requestId(),
                    req.amount(),
                    1_710_000_000_000L,
                    "Success",
                    0,
                    "https://phishing-momo-fake.com/v2/gateway/pay?s=123",
                    "momo://app",
                    "https://phishing.com/qr",
                    "dummySignature"
            );
        });

        GatewayResponse response = gateway.processPayment(payment);

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getGatewayStatus()).isEqualTo("FAILED");
    }

    @Test
    @DisplayName("Uses AI Coin redirect URL when purpose is AI_COIN_PURCHASE")
    void usesAiCoinRedirectUrlForAiCoinPurchases() {
        Payment payment = Payment.builder()
                .id(104L)
                .amount(BigDecimal.valueOf(50_000))
                .currency("VND")
                .paymentMethod(PaymentMethod.MOMO)
                .purpose(PaymentPurpose.AI_COIN_PURCHASE)
                .status(PaymentStatus.PENDING)
                .build();

        ArgumentCaptor<MomoCreatePaymentRequest> reqCaptor = ArgumentCaptor.forClass(MomoCreatePaymentRequest.class);
        when(client.createPayment(reqCaptor.capture())).thenReturn(new MomoCreatePaymentResponse(
                "MOMO", "MOMO_ORD_104", "MOMO_REQ_104", 50000L, 1L, "Success", 0,
                "https://test-payment.momo.vn/v2/gateway/pay?s=999", "", "", "dummySig"
        ));

        gateway.processPayment(payment);

        MomoCreatePaymentRequest capturedRequest = reqCaptor.getValue();
        assertThat(capturedRequest.redirectUrl()).isEqualTo("https://ai-market-travel.vercel.app/ai-coins/payment-result");
        assertThat(capturedRequest.ipnUrl()).isEqualTo("https://aimarkettravel-production.up.railway.app/api/v1/payments/momo/ipn");
    }

    @Test
    @DisplayName("Handles MoMo API failure gracefully with FAILED status")
    void handlesMoMoApiFailureGracefully() {
        Payment payment = Payment.builder()
                .id(105L)
                .amount(BigDecimal.valueOf(50_000))
                .currency("VND")
                .paymentMethod(PaymentMethod.MOMO)
                .purpose(PaymentPurpose.BOOKING)
                .status(PaymentStatus.PENDING)
                .build();

        when(client.createPayment(any(MomoCreatePaymentRequest.class))).thenThrow(new RuntimeException("MoMo connection timeout"));

        GatewayResponse response = gateway.processPayment(payment);

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getGatewayStatus()).isEqualTo("FAILED");
        assertThat(response.getErrorMessage()).contains("MoMo payment creation is temporarily unavailable");
    }
}
