package com.travel.marketplace.modules.payment.gateway;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.travel.marketplace.modules.payment.entity.Payment;
import com.travel.marketplace.modules.payment.entity.PaymentTransaction;
import com.travel.marketplace.modules.payment.enums.PaymentMethod;
import com.travel.marketplace.modules.payment.enums.PaymentStatus;
import com.travel.marketplace.modules.payment.momo.MomoClient;
import com.travel.marketplace.modules.payment.momo.MomoCreatePaymentRequest;
import com.travel.marketplace.modules.payment.momo.MomoCreatePaymentResponse;
import com.travel.marketplace.modules.payment.momo.MomoProperties;
import com.travel.marketplace.modules.payment.momo.MomoSigner;
import com.travel.marketplace.modules.payment.repository.PaymentTransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class MomoPaymentGatewayTest {

    private final MomoClient client = mock(MomoClient.class);
    private final PaymentTransactionRepository repository = mock(PaymentTransactionRepository.class);
    private MomoPaymentGateway gateway;

    @BeforeEach
    void setUp() {
        MomoProperties properties = new MomoProperties();
        properties.setAccessKey("testAccess");
        properties.setSecretKey("testSecret");
        properties.setIpnUrl("https://api.example.com/api/v1/payments/momo/ipn");
        gateway = new MomoPaymentGateway(
                properties,
                new MomoSigner(),
                client,
                repository,
                new ObjectMapper()
        );
    }

    @Test
    void persistsPendingTransactionBeforeCallingSandbox() {
        when(client.createPayment(any())).thenAnswer(invocation -> {
            MomoCreatePaymentRequest request = invocation.getArgument(0);
            return new MomoCreatePaymentResponse(
                    "MOMO",
                    request.orderId(),
                    request.requestId(),
                    request.amount(),
                    1_710_000_000_000L,
                    "Successful.",
                    0,
                    "https://test-payment.momo.vn/v2/gateway/pay?t=abc",
                    null,
                    null,
                    "response-signature"
            );
        });

        GatewayResponse response = gateway.processPayment(payment("150000"));

        InOrder order = inOrder(repository, client);
        order.verify(repository).saveAndFlush(any(PaymentTransaction.class));
        order.verify(client).createPayment(any(MomoCreatePaymentRequest.class));
        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getGatewayStatus()).isEqualTo("PROCESSING");

        ArgumentCaptor<PaymentTransaction> transactionCaptor =
                ArgumentCaptor.forClass(PaymentTransaction.class);
        verify(repository).save(transactionCaptor.capture());
        PaymentTransaction transaction = transactionCaptor.getValue();
        assertThat(transaction.getPayUrl()).startsWith("https://test-payment.momo.vn/");
        assertThat(transaction.getRequestPayload()).doesNotContain("testAccess", "testSecret", "signature");
        assertThat(transaction.getGatewayResponse()).doesNotContain("response-signature");
    }

    @Test
    void rejectsAmountsOutsideMomoRangeBeforeCallingSandbox() {
        assertThatThrownBy(() -> gateway.processPayment(payment("999")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("between 1,000 and 50,000,000");
        assertThatThrownBy(() -> gateway.processPayment(payment("50000001")))
                .isInstanceOf(IllegalArgumentException.class);
        verify(client, never()).createPayment(any());
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void keepsUncertainTimeoutProcessingWithoutBlindRetry() {
        when(client.createPayment(any())).thenThrow(new RuntimeException("timeout"));

        GatewayResponse response = gateway.processPayment(payment("150000"));

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getGatewayStatus()).isEqualTo("PROCESSING");
        verify(client).createPayment(any());
    }

    private Payment payment(String amount) {
        return Payment.builder()
                .id(7L)
                .amount(new BigDecimal(amount))
                .currency("VND")
                .paymentMethod(PaymentMethod.MOMO)
                .status(PaymentStatus.PROCESSING)
                .build();
    }
}
