package com.travel.marketplace.modules.payment.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.travel.marketplace.modules.booking.entity.Order;
import com.travel.marketplace.modules.booking.repository.BookingRepository;
import com.travel.marketplace.modules.booking.repository.OrderRepository;
import com.travel.marketplace.modules.booking.service.OrderService;
import com.travel.marketplace.modules.booking.service.ReservationLockManager;
import com.travel.marketplace.modules.payment.dto.PaymentRequest;
import com.travel.marketplace.modules.payment.dto.PaymentResponse;
import com.travel.marketplace.modules.payment.entity.Payment;
import com.travel.marketplace.modules.payment.enums.PaymentMethod;
import com.travel.marketplace.modules.payment.enums.PaymentStatus;
import com.travel.marketplace.modules.payment.gateway.PaymentGatewayFactory;
import com.travel.marketplace.modules.payment.mapper.PaymentMapper;
import com.travel.marketplace.modules.payment.repository.PaymentRepository;
import com.travel.marketplace.modules.payment.repository.PaymentTransactionRepository;
import com.travel.marketplace.modules.payment.repository.RefundRepository;
import com.travel.marketplace.modules.payment.statemachine.PaymentStateMachine;
import com.travel.marketplace.modules.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PaymentServiceImplMomoTest {

    private final PaymentRepository paymentRepository = mock(PaymentRepository.class);
    private final OrderRepository orderRepository = mock(OrderRepository.class);
    private final PaymentTransactionRepository transactionRepository = mock(PaymentTransactionRepository.class);
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

    private PaymentRequest request(String idempotencyKey) {
        return PaymentRequest.builder()
                .orderId(44L)
                .paymentMethod(PaymentMethod.MOMO)
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
