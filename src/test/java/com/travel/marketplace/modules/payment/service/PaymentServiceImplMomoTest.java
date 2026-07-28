package com.travel.marketplace.modules.payment.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.travel.marketplace.modules.booking.entity.Order;
import com.travel.marketplace.modules.booking.repository.BookingRepository;
import com.travel.marketplace.modules.booking.repository.OrderRepository;
import com.travel.marketplace.modules.booking.service.OrderService;
import com.travel.marketplace.modules.booking.service.ReservationLockManager;
import com.travel.marketplace.modules.payment.dto.PaymentRequest;
import com.travel.marketplace.modules.payment.dto.PaymentResponse;
import com.travel.marketplace.modules.payment.entity.AiCoinPurchase;
import com.travel.marketplace.modules.payment.entity.Payment;
import com.travel.marketplace.modules.payment.enums.PaymentMethod;
import com.travel.marketplace.modules.payment.enums.PaymentPurpose;
import com.travel.marketplace.modules.payment.enums.PaymentStatus;
import com.travel.marketplace.modules.payment.gateway.GatewayResponse;
import com.travel.marketplace.modules.payment.gateway.PaymentGateway;
import com.travel.marketplace.modules.payment.gateway.PaymentGatewayFactory;
import com.travel.marketplace.modules.payment.mapper.PaymentMapper;
import com.travel.marketplace.modules.payment.repository.AiCoinPurchaseRepository;
import com.travel.marketplace.modules.payment.repository.PaymentRepository;
import com.travel.marketplace.modules.payment.repository.PaymentTransactionRepository;
import com.travel.marketplace.modules.payment.repository.RefundRepository;
import com.travel.marketplace.modules.payment.statemachine.PaymentStateMachine;
import com.travel.marketplace.modules.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PaymentServiceImplMomoTest {

    private final PaymentRepository paymentRepository = mock(PaymentRepository.class);
    private final OrderRepository orderRepository = mock(OrderRepository.class);
    private final PaymentTransactionRepository transactionRepository = mock(PaymentTransactionRepository.class);
    private final AiCoinPurchaseRepository aiCoinPurchaseRepository = mock(AiCoinPurchaseRepository.class);
    private final RefundRepository refundRepository = mock(RefundRepository.class);
    private final PaymentGatewayFactory gatewayFactory = mock(PaymentGatewayFactory.class);
    private PaymentServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new PaymentServiceImpl(
                paymentRepository,
                orderRepository,
                mock(BookingRepository.class),
                transactionRepository,
                aiCoinPurchaseRepository,
                refundRepository,
                new PaymentMapper(),
                new PaymentStateMachine(),
                gatewayFactory,
                mock(OrderService.class),
                mock(ReservationLockManager.class),
                new ObjectMapper()
        );
    }

    @Test
    void duplicateIdempotencyKeyReusesExistingMomoPayment() {
        Payment payment = existingPayment();
        when(paymentRepository.findByIdempotencyKey("same-key")).thenReturn(Optional.of(payment));
        when(transactionRepository.findFirstByPaymentIdAndGatewayOrderIdIsNotNullOrderByCreatedAtDesc(55L))
                .thenReturn(Optional.empty());

        PaymentResponse response = service.createPayment(request("same-key"), 9L);

        assertThat(response.getId()).isEqualTo(55L);
        verify(orderRepository, never()).findById(44L);
        verify(gatewayFactory, never()).getGateway(PaymentMethod.MOMO);
    }

    @Test
    void repeatedCreateForSameOrderReusesNonTerminalMomoPayment() {
        Payment payment = existingPayment();
        when(paymentRepository.findByIdempotencyKey("new-key")).thenReturn(Optional.empty());
        when(orderRepository.findById(44L)).thenReturn(Optional.of(payment.getOrder()));
        when(paymentRepository.findByOrderId(44L)).thenReturn(Optional.of(payment));
        when(transactionRepository.findFirstByPaymentIdAndGatewayOrderIdIsNotNullOrderByCreatedAtDesc(55L))
                .thenReturn(Optional.empty());

        PaymentResponse response = service.createPayment(request("new-key"), 9L);

        assertThat(response.getStatus()).isEqualTo(PaymentStatus.PROCESSING);
        verify(gatewayFactory, never()).getGateway(PaymentMethod.MOMO);
    }

    @Test
    void paymentHistoryIncludesLegacyAiCoinPaymentWithoutOrder() {
        Payment payment = Payment.builder()
                .id(64L)
                .referenceId(101L)
                .amount(java.math.BigDecimal.valueOf(59_000))
                .currency("VND")
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .status(PaymentStatus.SUCCESS)
                .build();
        AiCoinPurchase purchase = AiCoinPurchase.builder()
                .id(101L)
                .userId(9L)
                .packageId("starter")
                .packageCode("STARTER")
                .baseCoins(500)
                .bonusCoins(75)
                .totalCoins(575)
                .merchantOrderId("AICOIN_64_101")
                .build();

        when(paymentRepository.findAllVisibleToUserOrderByCreatedAtDesc(9L, PaymentPurpose.AI_COIN_PURCHASE))
                .thenReturn(List.of(payment));
        when(transactionRepository.findFirstByPaymentIdAndGatewayOrderIdIsNotNullOrderByCreatedAtDesc(64L))
                .thenReturn(Optional.empty());
        when(aiCoinPurchaseRepository.findById(101L)).thenReturn(Optional.of(purchase));

        List<PaymentResponse> response = service.getPaymentsForUser(9L);

        assertThat(response).hasSize(1);
        assertThat(response.get(0).getId()).isEqualTo(64L);
        assertThat(response.get(0).getPaymentPurpose()).isEqualTo(PaymentPurpose.AI_COIN_PURCHASE);
        assertThat(response.get(0).getAiCoinPackageId()).isEqualTo("starter");
        assertThat(response.get(0).getBaseCoins()).isEqualTo(500);
        assertThat(response.get(0).getBonusCoins()).isEqualTo(75);
        assertThat(response.get(0).getTotalCoins()).isEqualTo(575);
        assertThat(response.get(0).getInvoiceNumber()).isEqualTo("AICOIN_64_101");
    }

    @Test
    void bookingBankTransferPaymentReturnsSepayCheckoutPayload() {
        User user = User.builder().id(9L).build();
        Order order = Order.builder()
                .id(44L)
                .user(user)
                .finalTotal(BigDecimal.valueOf(9_471_000))
                .build();
        PaymentGateway sepayGateway = mock(PaymentGateway.class);
        Map<String, Object> rawResponse = new LinkedHashMap<>();
        Map<String, String> checkoutFields = new LinkedHashMap<>();
        checkoutFields.put("operation", "PURCHASE");
        checkoutFields.put("payment_method", "BANK_TRANSFER");
        checkoutFields.put("order_invoice_number", "BOOKING_123_ABC");
        checkoutFields.put("order_amount", "9471000");
        checkoutFields.put("currency", "VND");
        checkoutFields.put("success_url", "https://example.test/success");
        checkoutFields.put("error_url", "https://example.test/error");
        checkoutFields.put("cancel_url", "https://example.test/cancel");
        checkoutFields.put("merchant", "MERCHANT");
        checkoutFields.put("signature", "signed-value");
        rawResponse.put("checkoutUrl", "https://pay-sandbox.sepay.vn/v1/checkout/init");
        rawResponse.put("checkoutFields", checkoutFields);

        when(paymentRepository.findByIdempotencyKey("bank-key")).thenReturn(Optional.empty());
        when(orderRepository.findById(44L)).thenReturn(Optional.of(order));
        when(paymentRepository.findByOrderId(44L)).thenReturn(Optional.empty());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment payment = invocation.getArgument(0);
            payment.setId(123L);
            return payment;
        });
        when(gatewayFactory.getGateway(PaymentMethod.BANK_TRANSFER)).thenReturn(sepayGateway);
        when(sepayGateway.processPayment(any(Payment.class))).thenReturn(GatewayResponse.builder()
                .success(true)
                .gatewayTransactionId("BOOKING_123_ABC")
                .gatewayStatus("PENDING")
                .rawResponse(rawResponse)
                .build());
        when(transactionRepository.findFirstByPaymentIdAndGatewayOrderIdIsNotNullOrderByCreatedAtDesc(123L))
                .thenReturn(Optional.empty());

        PaymentResponse response = service.createPayment(
                request("bank-key", PaymentMethod.BANK_TRANSFER),
                9L
        );

        assertThat(response.getPaymentMethod()).isEqualTo(PaymentMethod.BANK_TRANSFER);
        assertThat(response.getStatus()).isEqualTo(PaymentStatus.PROCESSING);
        assertThat(response.getCheckoutUrl()).isEqualTo("https://pay-sandbox.sepay.vn/v1/checkout/init");
        assertThat(response.getCheckoutFields()).containsAllEntriesOf(checkoutFields);
        assertThat(response.getCheckoutFields().keySet()).containsExactly(
                "operation",
                "payment_method",
                "order_invoice_number",
                "order_amount",
                "currency",
                "success_url",
                "error_url",
                "cancel_url",
                "merchant",
                "signature"
        );
        assertThat(response.getCheckoutFields().values()).doesNotContain("secret-key", "ipn-secret");
        assertThat(response.getPayUrl()).isNull();
    }

    private PaymentRequest request(String idempotencyKey) {
        return request(idempotencyKey, PaymentMethod.MOMO);
    }

    private PaymentRequest request(String idempotencyKey, PaymentMethod paymentMethod) {
        return PaymentRequest.builder()
                .orderId(44L)
                .paymentMethod(paymentMethod)
                .idempotencyKey(idempotencyKey)
                .build();
    }

    private Payment existingPayment() {
        User user = User.builder().id(9L).build();
        Order order = Order.builder().id(44L).user(user).build();
        return Payment.builder()
                .id(55L)
                .order(order)
                .paymentMethod(PaymentMethod.MOMO)
                .status(PaymentStatus.PROCESSING)
                .build();
    }
}
