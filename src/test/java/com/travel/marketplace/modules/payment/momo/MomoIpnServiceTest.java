package com.travel.marketplace.modules.payment.momo;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.travel.marketplace.exception.BusinessException;
import com.travel.marketplace.modules.payment.entity.Payment;
import com.travel.marketplace.modules.payment.entity.PaymentTransaction;
import com.travel.marketplace.modules.payment.enums.PaymentMethod;
import com.travel.marketplace.modules.payment.enums.PaymentPurpose;
import com.travel.marketplace.modules.payment.enums.PaymentStatus;
import com.travel.marketplace.modules.payment.repository.PaymentTransactionRepository;
import com.travel.marketplace.modules.payment.service.AiCoinPaymentService;
import com.travel.marketplace.modules.payment.service.PaymentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class MomoIpnServiceTest {

    private final MomoSigner signer = new MomoSigner();
    private final PaymentTransactionRepository transactionRepository = mock(PaymentTransactionRepository.class);
    private final PaymentService paymentService = mock(PaymentService.class);
    private final AiCoinPaymentService aiCoinPaymentService = mock(AiCoinPaymentService.class);
    private MomoProperties properties;
    private MomoIpnService service;
    private Payment payment;
    private PaymentTransaction transaction;

    @BeforeEach
    void setUp() {
        properties = new MomoProperties();
        properties.setAccessKey("testAccess");
        properties.setSecretKey("testSecret");
        payment = Payment.builder()
                .id(7L)
                .paymentMethod(PaymentMethod.MOMO)
                .status(PaymentStatus.PROCESSING)
                .build();
        transaction = PaymentTransaction.builder()
                .id(8L)
                .payment(payment)
                .partnerCode("MOMO")
                .gatewayOrderId("MOMO_ORD_123")
                .gatewayRequestId("MOMO_REQ_123")
                .amountVnd(150_000L)
                .status("PROCESSING")
                .build();
        service = new MomoIpnService(
                properties,
                signer,
                new MomoResultCodeMapper(),
                transactionRepository,
                paymentService,
                aiCoinPaymentService,
                new ObjectMapper()
        );
    }

    @Test
    void processesValidSuccessfulIpnExactlyOnce() {
        MomoIpnRequest request = signedRequest(150_000L, 0);
        when(transactionRepository.findByGatewayOrderId("MOMO_ORD_123"))
                .thenReturn(Optional.of(transaction));

        service.process(request);

        verify(transactionRepository).save(transaction);
        verify(paymentService).applyVerifiedGatewayStatus(7L, PaymentStatus.SUCCESS);
    }

    @Test
    void rejectsInvalidSignatureBeforeLookup() {
        MomoIpnRequest request = unsignedRequest(150_000L, 0, "invalid");

        assertThatThrownBy(() -> service.process(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("signature");
        verify(transactionRepository, never()).findByGatewayOrderId(any());
    }

    @Test
    void rejectsMismatchedStoredAmount() {
        MomoIpnRequest request = signedRequest(149_000L, 0);
        when(transactionRepository.findByGatewayOrderId("MOMO_ORD_123"))
                .thenReturn(Optional.of(transaction));

        assertThatThrownBy(() -> service.process(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("stored payment");
        verify(paymentService, never()).applyVerifiedGatewayStatus(any(), any());
    }

    @Test
    void rejectsUnknownOrder() {
        MomoIpnRequest request = signedRequest(150_000L, 0);
        when(transactionRepository.findByGatewayOrderId("MOMO_ORD_123"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.process(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Unknown");
    }

    @Test
    void duplicateIpnCannotRegressCompletedPayment() {
        payment.setStatus(PaymentStatus.SUCCESS);
        MomoIpnRequest request = signedRequest(150_000L, 1006);
        when(transactionRepository.findByGatewayOrderId("MOMO_ORD_123"))
                .thenReturn(Optional.of(transaction));

        service.process(request);

        verify(transactionRepository, never()).save(any());
        verify(paymentService, never()).applyVerifiedGatewayStatus(any(), any());
    }

    // ── AI_COIN_PURCHASE IPN tests ────────────────────────────────────

    @Test
    void aiCoinPurchaseIpnRoutesToAiCoinPaymentService() {
        payment.setPurpose(PaymentPurpose.AI_COIN_PURCHASE);
        MomoIpnRequest request = signedRequest(150_000L, 0);
        when(transactionRepository.findByGatewayOrderId("MOMO_ORD_123"))
                .thenReturn(Optional.of(transaction));

        service.process(request);

        verify(transactionRepository).save(transaction);
        verify(aiCoinPaymentService).handlePaymentStatusUpdate(7L, PaymentStatus.SUCCESS);
        verify(paymentService, never()).applyVerifiedGatewayStatus(any(), any());
    }

    @Test
    void aiCoinPurchaseFailedIpnRoutesToAiCoinPaymentService() {
        payment.setPurpose(PaymentPurpose.AI_COIN_PURCHASE);
        MomoIpnRequest request = signedRequest(150_000L, 1006);
        when(transactionRepository.findByGatewayOrderId("MOMO_ORD_123"))
                .thenReturn(Optional.of(transaction));

        service.process(request);

        verify(transactionRepository).save(transaction);
        verify(aiCoinPaymentService).handlePaymentStatusUpdate(7L, PaymentStatus.CANCELLED);
        verify(paymentService, never()).applyVerifiedGatewayStatus(any(), any());
    }

    @Test
    void aiCoinPurchaseDuplicateIpnIgnoredWhenAlreadySuccessful() {
        payment.setPurpose(PaymentPurpose.AI_COIN_PURCHASE);
        payment.setStatus(PaymentStatus.SUCCESS);
        MomoIpnRequest request = signedRequest(150_000L, 0);
        when(transactionRepository.findByGatewayOrderId("MOMO_ORD_123"))
                .thenReturn(Optional.of(transaction));

        service.process(request);

        verify(transactionRepository, never()).save(any());
        verify(aiCoinPaymentService, never()).handlePaymentStatusUpdate(any(), any());
        verify(paymentService, never()).applyVerifiedGatewayStatus(any(), any());
    }

    // ── Helper methods ────────────────────────────────────────────────

    private MomoIpnRequest signedRequest(long amount, int resultCode) {
        MomoIpnRequest unsigned = unsignedRequest(amount, resultCode, "");
        String signature = signer.signIpn(unsigned, properties.getAccessKey(), properties.getSecretKey());
        return unsignedRequest(amount, resultCode, signature);
    }

    private MomoIpnRequest unsignedRequest(long amount, int resultCode, String signature) {
        return new MomoIpnRequest(
                "MOMO",
                "MOMO_ORD_123",
                "MOMO_REQ_123",
                amount,
                "pay with MoMo",
                "momo_wallet",
                123_456_789L,
                resultCode,
                resultCode == 0 ? "Successful." : "Cancelled.",
                "qr",
                1_710_000_000_000L,
                "",
                signature
        );
    }
}
