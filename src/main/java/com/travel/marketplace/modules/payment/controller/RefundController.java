package com.travel.marketplace.modules.payment.controller;

import com.travel.marketplace.dto.ApiResponse;
import com.travel.marketplace.modules.payment.dto.RefundResponse;
import com.travel.marketplace.modules.payment.entity.Refund;
import com.travel.marketplace.modules.payment.enums.RefundMethod;
import com.travel.marketplace.modules.payment.enums.RefundReason;
import com.travel.marketplace.modules.payment.mapper.RefundMapper;
import com.travel.marketplace.modules.payment.service.RefundService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/refunds")
@RequiredArgsConstructor
public class RefundController {

    private final RefundService refundService;
    private final RefundMapper refundMapper;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<RefundResponse> requestRefund(
            @RequestParam Long paymentId,
            @RequestParam BigDecimal amount,
            @RequestParam RefundReason reason,
            @RequestParam RefundMethod method,
            @RequestParam(required = false) Long requestedBy) {
            
        Refund refund = refundService.requestRefund(paymentId, amount, reason, method, requestedBy);
        return ApiResponse.success("Refund requested successfully", refundMapper.toResponse(refund));
    }

    @GetMapping("/{id}")
    public ApiResponse<RefundResponse> getRefund(@PathVariable Long id) {
        Refund refund = refundService.getRefund(id);
        return ApiResponse.success("Refund retrieved successfully", refundMapper.toResponse(refund));
    }

    @GetMapping("/payment/{paymentId}")
    public ApiResponse<List<RefundResponse>> getRefundsByPayment(@PathVariable Long paymentId) {
        List<Refund> refunds = refundService.getRefundsByPayment(paymentId);
        return ApiResponse.success("Refunds retrieved successfully", refunds.stream().map(refundMapper::toResponse).toList());
    }

    @PostMapping("/{id}/approve")
    public ApiResponse<RefundResponse> approveRefund(
            @PathVariable Long id,
            @RequestParam(required = false) Long processedBy) {
        Refund refund = refundService.approveRefund(id, processedBy);
        return ApiResponse.success("Refund approved successfully", refundMapper.toResponse(refund));
    }

    @PostMapping("/{id}/process")
    public ApiResponse<RefundResponse> processRefund(@PathVariable Long id) {
        Refund refund = refundService.processRefund(id);
        return ApiResponse.success("Refund processed successfully", refundMapper.toResponse(refund));
    }

    @PostMapping("/{id}/reject")
    public ApiResponse<RefundResponse> rejectRefund(
            @PathVariable Long id,
            @RequestParam(required = false) Long processedBy) {
        Refund refund = refundService.rejectRefund(id, processedBy);
        return ApiResponse.success("Refund rejected successfully", refundMapper.toResponse(refund));
    }
}
