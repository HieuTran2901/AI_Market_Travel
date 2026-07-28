package com.travel.marketplace.modules.payment.controller;

import com.travel.marketplace.modules.payment.dto.WebhookPayload;
import com.travel.marketplace.modules.payment.entity.Payment;
import com.travel.marketplace.modules.payment.enums.PaymentPurpose;
import com.travel.marketplace.modules.payment.enums.PaymentStatus;
import com.travel.marketplace.modules.payment.repository.PaymentRepository;
import com.travel.marketplace.modules.payment.sepay.SepayIpnRequest;
import com.travel.marketplace.modules.payment.sepay.SepayProperties;
import com.travel.marketplace.modules.payment.service.AiCoinPaymentService;
import com.travel.marketplace.modules.payment.service.PaymentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentCaptor.forClass;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class SepayControllerTest {

    private final AiCoinPaymentService aiCoinPaymentService = mock(AiCoinPaymentService.class);
    private final PaymentService paymentService = mock(PaymentService.class);
    private final PaymentRepository paymentRepository = mock(PaymentRepository.class);
    private SepayController controller;

    @BeforeEach
    void setUp() {
        SepayProperties properties = new SepayProperties();
        properties.setIpnSecret("ipn-secret");
        properties.setFrontendRedirectUrl("http://localhost:5173/ai-coins/payment-result");
        properties.setBookingFrontendRedirectUrl("http://localhost:5173/checkout");
        controller = new SepayController(aiCoinPaymentService, paymentService, paymentRepository, properties);
    }

    @Test
    void aiCoinReturnRoutesToExistingAiCoinResultFlow() {
        when(paymentRepository.findById(64L)).thenReturn(Optional.of(payment(64L, PaymentPurpose.AI_COIN_PURCHASE)));

        String url = controller.handleReturnSuccess("AICOIN_64_abcdef").getUrl();

        assertThat(url).isEqualTo("http://localhost:5173/ai-coins/payment-result?result=success&paymentId=64");
    }

    @Test
    void bookingReturnRoutesToCheckoutFlow() {
        when(paymentRepository.findById(65L)).thenReturn(Optional.of(payment(65L, PaymentPurpose.BOOKING)));

        String url = controller.handleReturnSuccess("AICOIN_65_abcdef").getUrl();

        assertThat(url).isEqualTo("http://localhost:5173/checkout?sepayResult=success&paymentId=65");
    }

    @Test
    void bookingCancelReturnRoutesToCheckoutPaymentFlow() {
        when(paymentRepository.findById(65L)).thenReturn(Optional.of(payment(65L, PaymentPurpose.BOOKING)));

        String url = controller.handleReturnCancel("AICOIN_65_abcdef").getUrl();

        assertThat(url).isEqualTo("http://localhost:5173/checkout?sepayResult=cancel&paymentId=65");
    }

    @Test
    void validBookingPaidIpnUsesCanonicalPaymentWebhookPath() {
        Payment payment = payment(65L, PaymentPurpose.BOOKING);
        when(paymentRepository.findById(65L)).thenReturn(Optional.of(payment));

        controller.handleIpn(null, "ipn-secret", paidIpn("AICOIN_65_abcdef", "9471000"));

        var captor = forClass(WebhookPayload.class);
        verify(paymentService).handleWebhook(captor.capture());
        assertThat(captor.getValue().getGateway()).isEqualTo("SEPAY");
        assertThat(captor.getValue().getEventType()).isEqualTo("SUCCESS");
        assertThat(captor.getValue().getReferenceId()).isEqualTo("65");
        verifyNoInteractions(aiCoinPaymentService);
    }

    @Test
    void validAiCoinPaidIpnKeepsAiCoinCompletionPath() {
        Payment payment = payment(64L, PaymentPurpose.AI_COIN_PURCHASE);
        when(paymentRepository.findById(64L)).thenReturn(Optional.of(payment));

        controller.handleIpn(null, "ipn-secret", paidIpn("AICOIN_64_abcdef", "9471000"));

        verify(aiCoinPaymentService).handlePaymentStatusUpdate(64L, PaymentStatus.SUCCESS);
        verifyNoInteractions(paymentService);
    }

    @Test
    void mismatchedBookingAmountDoesNotCompletePayment() {
        Payment payment = payment(65L, PaymentPurpose.BOOKING);
        when(paymentRepository.findById(65L)).thenReturn(Optional.of(payment));

        var response = controller.handleIpn(null, "ipn-secret", paidIpn("AICOIN_65_abcdef", "1000"));

        assertThat(response.getBody()).isEqualTo(java.util.Map.of(
                "success", false,
                "message", "Internal processing error"
        ));
        verify(paymentService, never()).handleWebhook(org.mockito.ArgumentMatchers.any());
        verifyNoInteractions(aiCoinPaymentService);
    }

    private Payment payment(Long id, PaymentPurpose purpose) {
        return Payment.builder()
                .id(id)
                .purpose(purpose)
                .amount(BigDecimal.valueOf(9_471_000))
                .status(PaymentStatus.PROCESSING)
                .build();
    }

    private SepayIpnRequest paidIpn(String invoiceNumber, String amount) {
        SepayIpnRequest request = new SepayIpnRequest();
        request.setNotification_type("ORDER_PAID");
        SepayIpnRequest.SepayOrder order = new SepayIpnRequest.SepayOrder();
        order.setOrder_invoice_number(invoiceNumber);
        order.setOrder_amount(amount);
        order.setOrder_status("CAPTURED");
        request.setOrder(order);
        return request;
    }
}
