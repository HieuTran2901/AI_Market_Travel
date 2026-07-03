package com.travel.marketplace.modules.payment.service;

import com.travel.marketplace.exception.BusinessException;
import com.travel.marketplace.exception.ErrorCode;
import com.travel.marketplace.modules.payment.entity.Payment;
import com.travel.marketplace.modules.payment.entity.Refund;
import com.travel.marketplace.modules.payment.enums.RefundMethod;
import com.travel.marketplace.modules.payment.enums.RefundReason;
import com.travel.marketplace.modules.payment.enums.RefundStatus;
import com.travel.marketplace.modules.payment.gateway.GatewayResponse;
import com.travel.marketplace.modules.payment.gateway.PaymentGateway;
import com.travel.marketplace.modules.payment.gateway.PaymentGatewayFactory;
import com.travel.marketplace.modules.payment.repository.PaymentRepository;
import com.travel.marketplace.modules.payment.repository.RefundRepository;
import com.travel.marketplace.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RefundServiceImpl implements RefundService {

    private final RefundRepository refundRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final PaymentGatewayFactory gatewayFactory;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public Refund requestRefund(Long paymentId, BigDecimal amount, RefundReason reason, RefundMethod method, Long requestedBy) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Payment not found"));

        Refund refund = Refund.builder()
                .payment(payment)
                .amount(amount)
                .reason(reason)
                .refundMethod(method)
                .status(RefundStatus.REQUESTED)
                .requestedBy(requestedBy != null ? userRepository.getReferenceById(requestedBy) : null)
                .build();

        return refundRepository.save(refund);
    }

    @Override
    @Transactional(readOnly = true)
    public Refund getRefund(Long refundId) {
        return refundRepository.findById(refundId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Refund not found"));
    }

    @Override
    @Transactional
    public Refund approveRefund(Long refundId, Long processedBy) {
        Refund refund = refundRepository.findById(refundId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Refund not found"));
        
        refund.setStatus(RefundStatus.APPROVED);
        refund.setProcessedBy(processedBy != null ? userRepository.getReferenceById(processedBy) : null);
        refund.setProcessedAt(Instant.now());
        
        refund = refundRepository.save(refund);
        
        // Future domain event: eventPublisher.publishEvent(new RefundApprovedEvent(refund.getId()));
        
        return refund;
    }

    @Override
    @Transactional
    public Refund processRefund(Long refundId) {
        Refund refund = refundRepository.findById(refundId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Refund not found"));
        
        refund.setStatus(RefundStatus.PROCESSING);
        refund = refundRepository.save(refund);
        
        PaymentGateway gateway = gatewayFactory.getGateway(refund.getPayment().getPaymentMethod());
        GatewayResponse response = gateway.processRefund(refund.getPayment(), refund.getAmount(), refund.getReason().name());
        
        if (response.isSuccess()) {
            return completeRefund(refund.getId());
        } else {
            // Handle failure properly in a robust system
            log.error("Refund failed at gateway: {}", response.getErrorMessage());
            throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR, "Gateway processing failed");
        }
    }

    @Override
    @Transactional
    public Refund completeRefund(Long refundId) {
        Refund refund = refundRepository.findById(refundId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Refund not found"));
                
        refund.setStatus(RefundStatus.COMPLETED);
        return refundRepository.save(refund);
    }

    @Override
    @Transactional
    public Refund rejectRefund(Long refundId, Long processedBy) {
        Refund refund = refundRepository.findById(refundId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Refund not found"));
                
        refund.setStatus(RefundStatus.REJECTED);
        refund.setProcessedBy(processedBy != null ? userRepository.getReferenceById(processedBy) : null);
        refund.setProcessedAt(Instant.now());
        return refundRepository.save(refund);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Refund> getRefundsByPayment(Long paymentId) {
        return refundRepository.findByPaymentId(paymentId);
    }
}
