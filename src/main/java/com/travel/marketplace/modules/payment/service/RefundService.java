package com.travel.marketplace.modules.payment.service;

import com.travel.marketplace.modules.payment.entity.Refund;
import com.travel.marketplace.modules.payment.enums.RefundMethod;
import com.travel.marketplace.modules.payment.enums.RefundReason;

import java.math.BigDecimal;
import java.util.List;

public interface RefundService {
    Refund requestRefund(Long paymentId, BigDecimal amount, RefundReason reason, RefundMethod method, Long requestedBy);
    Refund getRefund(Long refundId);
    Refund approveRefund(Long refundId, Long processedBy);
    Refund processRefund(Long refundId);
    Refund completeRefund(Long refundId);
    Refund rejectRefund(Long refundId, Long processedBy);
    List<Refund> getRefundsByPayment(Long paymentId);
}
