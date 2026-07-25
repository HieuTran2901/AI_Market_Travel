package com.travel.marketplace.modules.payment.dto;

import com.travel.marketplace.modules.booking.dto.PriceBreakdownDto;
import com.travel.marketplace.modules.payment.enums.PaymentMethod;
import com.travel.marketplace.modules.payment.enums.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentDetailResponse {
    private Long id;
    private Long orderId;
    private String orderNumber;
    private Long bookingId;
    private BigDecimal amount;
    private String currency;
    private PaymentStatus status;
    private PaymentMethod paymentMethod;
    private String gatewayOrderId;
    private String payUrl;
    private Instant expiresAt;
    private Instant createdAt;
    private Instant updatedAt;

    // Booking Summary
    private PaymentBookingSummaryResponse booking;

    // Price Breakdown
    private PriceBreakdownDto priceBreakdown;

    // Refund Info
    private boolean isRefundable;
    private Long existingRefundId;
}
