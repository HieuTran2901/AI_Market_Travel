package com.travel.marketplace.modules.payment.service;

import com.travel.marketplace.exception.BusinessException;
import com.travel.marketplace.exception.ErrorCode;
import com.travel.marketplace.modules.booking.entity.Order;
import com.travel.marketplace.modules.booking.enums.BookingStatus;
import com.travel.marketplace.modules.booking.enums.OrderStatus;
import com.travel.marketplace.modules.booking.repository.BookingRepository;
import com.travel.marketplace.modules.booking.repository.OrderRepository;
import com.travel.marketplace.modules.booking.service.OrderService;
import com.travel.marketplace.modules.booking.service.ReservationLockManager;
import com.travel.marketplace.modules.payment.dto.PaymentRequest;
import com.travel.marketplace.modules.payment.dto.PaymentResponse;
import com.travel.marketplace.modules.payment.dto.WebhookPayload;
import com.travel.marketplace.modules.payment.entity.Payment;
import com.travel.marketplace.modules.payment.entity.PaymentTransaction;
import com.travel.marketplace.modules.payment.enums.PaymentStatus;
import com.travel.marketplace.modules.payment.gateway.GatewayResponse;
import com.travel.marketplace.modules.payment.gateway.PaymentGateway;
import com.travel.marketplace.modules.payment.gateway.PaymentGatewayFactory;
import com.travel.marketplace.modules.payment.mapper.PaymentMapper;
import com.travel.marketplace.modules.payment.repository.PaymentRepository;
import com.travel.marketplace.modules.payment.repository.PaymentTransactionRepository;
import com.travel.marketplace.modules.payment.statemachine.PaymentStateMachine;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final BookingRepository bookingRepository;
    private final PaymentTransactionRepository transactionRepository;
    private final PaymentMapper paymentMapper;
    private final PaymentStateMachine stateMachine;
    private final PaymentGatewayFactory gatewayFactory;
    private final OrderService orderService;
    private final ReservationLockManager reservationLockManager;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public PaymentResponse createPayment(PaymentRequest request) {
        if (request.getIdempotencyKey() != null) {
            Optional<Payment> existingPayment = paymentRepository.findByIdempotencyKey(request.getIdempotencyKey());
            if (existingPayment.isPresent()) {
                return paymentMapper.toResponse(existingPayment.get());
            }
        }

        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Order not found"));

        Payment payment = Payment.builder()
                .order(order)
                .amount(order.getFinalTotal())
                .currency(resolveOrderCurrency(order))
                .status(PaymentStatus.PENDING)
                .paymentMethod(request.getPaymentMethod())
                .idempotencyKey(request.getIdempotencyKey())
                .expiresAt(Instant.now().plus(15, ChronoUnit.MINUTES)) // 15 mins timeout
                .build();

        payment = paymentRepository.save(payment);
        stateMachine.transitionTo(payment, PaymentStatus.PROCESSING);
        payment = paymentRepository.save(payment);

        PaymentGateway gateway = gatewayFactory.getGateway(payment.getPaymentMethod());
        GatewayResponse gatewayResponse = gateway.processPayment(payment);
        recordGatewayTransaction(payment, "payment.create", gatewayResponse);
        applyGatewayResult(payment, gatewayResponse);

        return paymentMapper.toResponse(payment);
    }

    private String resolveOrderCurrency(Order order) {
        if (order.getBookings() != null && !order.getBookings().isEmpty()
                && order.getBookings().getFirst().getListing() != null
                && order.getBookings().getFirst().getListing().getCurrency() != null) {
            return order.getBookings().getFirst().getListing().getCurrency();
        }
        return "VND";
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPayment(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Payment not found"));
        return paymentMapper.toResponse(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsForUser(Long userId) {
        return paymentRepository.findAllByOrderUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(paymentMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public PaymentResponse cancelPayment(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Payment not found"));

        stateMachine.transitionTo(payment, PaymentStatus.CANCELLED);
        closeOrderReservations(payment.getOrder(), OrderStatus.CANCELLED);
        payment = paymentRepository.save(payment);
        
        return paymentMapper.toResponse(payment);
    }

    @Override
    @Transactional
    public void handleWebhook(WebhookPayload payload) {
        log.info("Received webhook: {}", payload);

        Payment payment = resolvePayment(payload);
        String transactionId = resolveWebhookTransactionId(payload);

        if (transactionRepository.existsByPaymentIdAndTransactionId(payment.getId(), transactionId)) {
            log.info("Skipping duplicate webhook transaction {} for payment {}", transactionId, payment.getId());
            return;
        }

        PaymentStatus targetStatus = mapWebhookStatus(payload);
        recordWebhookTransaction(payment, transactionId, targetStatus, payload);

        applyPaymentStatus(payment, targetStatus);
    }

    private void applyGatewayResult(Payment payment, GatewayResponse gatewayResponse) {
        PaymentStatus targetStatus = switch (gatewayResponse.getGatewayStatus()) {
            case "SUCCESS" -> PaymentStatus.SUCCESS;
            case "EXPIRED", "TIMEOUT" -> PaymentStatus.EXPIRED;
            default -> gatewayResponse.isSuccess() ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;
        };

        applyPaymentStatus(payment, targetStatus);
    }

    private void applyPaymentStatus(Payment payment, PaymentStatus targetStatus) {
        if (payment.getStatus() == targetStatus) {
            return;
        }

        if (isTerminal(payment.getStatus())) {
            log.info("Ignoring transition from terminal payment status {} to {}", payment.getStatus(), targetStatus);
            return;
        }

        if (payment.getStatus() == PaymentStatus.PENDING && targetStatus != PaymentStatus.PROCESSING) {
            stateMachine.transitionTo(payment, PaymentStatus.PROCESSING);
        }

        stateMachine.transitionTo(payment, targetStatus);
        payment = paymentRepository.save(payment);

        if (targetStatus == PaymentStatus.SUCCESS) {
            orderService.confirmOrderPayment(payment.getOrder().getOrderNumber());
        } else if (targetStatus == PaymentStatus.FAILED || targetStatus == PaymentStatus.EXPIRED || targetStatus == PaymentStatus.CANCELLED) {
            OrderStatus orderStatus = targetStatus == PaymentStatus.CANCELLED
                    ? OrderStatus.CANCELLED
                    : OrderStatus.FAILED;
            closeOrderReservations(payment.getOrder(), orderStatus);
        }
    }

    private void closeOrderReservations(Order order, OrderStatus orderStatus) {
        order.setStatus(orderStatus);
        orderRepository.save(order);

        order.getBookings().forEach(booking -> {
            reservationLockManager.release(booking);
            if (orderStatus == OrderStatus.CANCELLED
                    && booking.getStatus() != BookingStatus.CONFIRMED
                    && booking.getStatus() != BookingStatus.COMPLETED) {
                booking.setStatus(BookingStatus.CANCELLED);
                bookingRepository.save(booking);
            }
        });
    }

    private Payment resolvePayment(WebhookPayload payload) {
        if (payload.getReferenceId() == null || payload.getReferenceId().isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Webhook referenceId is required");
        }

        try {
            Long paymentId = Long.valueOf(payload.getReferenceId());
            return paymentRepository.findById(paymentId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Payment not found"));
        } catch (NumberFormatException e) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Webhook referenceId must be a payment ID");
        }
    }

    private PaymentStatus mapWebhookStatus(WebhookPayload payload) {
        String status = payload.getEventType();
        if (payload.getRawData() != null && payload.getRawData().get("status") != null) {
            status = String.valueOf(payload.getRawData().get("status"));
        }

        if (status == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Webhook status is required");
        }

        return switch (status.toUpperCase()) {
            case "SUCCESS", "SUCCEEDED", "PAID", "PAYMENT_SUCCESS" -> PaymentStatus.SUCCESS;
            case "FAILED", "FAILURE", "PAYMENT_FAILED" -> PaymentStatus.FAILED;
            case "EXPIRED", "TIMEOUT", "TIMED_OUT", "PAYMENT_EXPIRED" -> PaymentStatus.EXPIRED;
            case "CANCELLED", "CANCELED" -> PaymentStatus.CANCELLED;
            case "PROCESSING" -> PaymentStatus.PROCESSING;
            default -> throw new BusinessException(ErrorCode.BAD_REQUEST, "Unsupported webhook status: " + status);
        };
    }

    private void recordGatewayTransaction(Payment payment, String eventType, GatewayResponse response) {
        PaymentTransaction transaction = PaymentTransaction.builder()
                .payment(payment)
                .transactionId(response.getGatewayTransactionId())
                .status(response.getGatewayStatus())
                .requestPayload(toJson(Map.of("eventType", eventType, "paymentId", payment.getId())))
                .gatewayResponse(toJson(response.getRawResponse() != null ? response.getRawResponse() : Map.of()))
                .build();
        transactionRepository.save(transaction);
    }

    private void recordWebhookTransaction(Payment payment, String transactionId, PaymentStatus status, WebhookPayload payload) {
        PaymentTransaction transaction = PaymentTransaction.builder()
                .payment(payment)
                .transactionId(transactionId)
                .status(status.name())
                .requestPayload(toJson(Map.of(
                        "gateway", payload.getGateway() != null ? payload.getGateway() : "unknown",
                        "eventType", payload.getEventType() != null ? payload.getEventType() : "unknown"
                )))
                .gatewayResponse(toJson(payload.getRawData() != null ? payload.getRawData() : Map.of()))
                .build();
        transactionRepository.save(transaction);
    }

    private String resolveWebhookTransactionId(WebhookPayload payload) {
        if (payload.getTransactionId() != null && !payload.getTransactionId().isBlank()) {
            return payload.getTransactionId();
        }
        return String.join(":",
                payload.getGateway() != null ? payload.getGateway() : "unknown",
                payload.getEventType() != null ? payload.getEventType() : "unknown",
                payload.getReferenceId() != null ? payload.getReferenceId() : "unknown");
    }

    private boolean isTerminal(PaymentStatus status) {
        return status == PaymentStatus.SUCCESS
                || status == PaymentStatus.FAILED
                || status == PaymentStatus.CANCELLED
                || status == PaymentStatus.REFUNDED
                || status == PaymentStatus.EXPIRED;
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }
}
