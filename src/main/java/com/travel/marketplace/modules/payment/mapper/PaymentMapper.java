package com.travel.marketplace.modules.payment.mapper;

import com.travel.marketplace.modules.booking.dto.PriceBreakdownDto;
import com.travel.marketplace.modules.booking.entity.Booking;
import com.travel.marketplace.modules.booking.entity.Order;
import com.travel.marketplace.modules.payment.dto.PaymentDetailResponse;
import com.travel.marketplace.modules.payment.dto.PaymentResponse;
import com.travel.marketplace.modules.payment.entity.Payment;
import org.springframework.stereotype.Component;

@Component
public class PaymentMapper {

    public PaymentResponse toResponse(Payment payment) {
        if (payment == null) {
            return null;
        }

        PaymentResponse.PaymentResponseBuilder builder = PaymentResponse.builder()
                .id(payment.getId())
                .orderId(payment.getOrder() != null ? payment.getOrder().getId() : null)
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .status(payment.getStatus())
                .paymentMethod(payment.getPaymentMethod())
                .expiresAt(payment.getExpiresAt())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt());

        Order order = payment.getOrder();
        if (order != null) {
            builder.orderNumber(order.getOrderNumber());
            if (order.getBookings() != null && !order.getBookings().isEmpty()) {
                Booking booking = order.getBookings().get(0);
                if (booking.getListing() != null) {
                    builder.listingTitle(booking.getListing().getTitle());
                    builder.listingCoverImageUrl(booking.getListing().getCoverImageUrl());
                    if (booking.getListing().getCategory() != null) {
                        builder.listingCategory(booking.getListing().getCategory().name());
                    }
                }
            }
        }

        return builder.build();
    }

    public PaymentDetailResponse toDetailResponse(Payment payment, boolean isRefundable, Long refundId) {
        if (payment == null) {
            return null;
        }

        PaymentDetailResponse.PaymentDetailResponseBuilder builder = PaymentDetailResponse.builder()
                .id(payment.getId())
                .orderId(payment.getOrder() != null ? payment.getOrder().getId() : null)
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .status(payment.getStatus())
                .paymentMethod(payment.getPaymentMethod())
                .expiresAt(payment.getExpiresAt())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .isRefundable(isRefundable)
                .existingRefundId(refundId);

        Order order = payment.getOrder();
        if (order != null) {
            builder.orderNumber(order.getOrderNumber());
            
            PriceBreakdownDto breakdown = new PriceBreakdownDto();
            breakdown.setBasePrice(order.getSubtotal()); // We'll map subtotal to basePrice at order level
            breakdown.setSubtotal(order.getSubtotal());
            breakdown.setServiceFee(order.getServiceFee());
            breakdown.setTax(order.getTax());
            breakdown.setDiscount(order.getDiscount());
            breakdown.setFinalTotal(order.getFinalTotal());
            builder.priceBreakdown(breakdown);

            if (order.getBookings() != null && !order.getBookings().isEmpty()) {
                Booking booking = order.getBookings().get(0);
                
                String listingTitle = null;
                String listingType = null;
                String listingLocation = null;
                String imageUrl = null;
                java.math.BigDecimal averageRating = null;
                Integer reviewCount = null;

                if (booking.getListing() != null) {
                    listingTitle = booking.getListing().getTitle();
                    imageUrl = booking.getListing().getCoverImageUrl();
                    if (booking.getListing().getCategory() != null) {
                        listingType = booking.getListing().getCategory().name();
                    }
                    averageRating = booking.getListing().getAverageRating();
                    reviewCount = booking.getListing().getReviewCount();
                    
                    String location = "";
                    if (booking.getListing().getCity() != null) location += booking.getListing().getCity();
                    if (booking.getListing().getCountry() != null) {
                        if (!location.isEmpty()) location += ", ";
                        location += booking.getListing().getCountry();
                    }
                    if (!location.isEmpty()) {
                        listingLocation = location;
                    }
                }

                String roomName = null;
                String roomType = null;
                if (booking.getInventory() != null) {
                    roomName = booking.getInventory().getName();
                    if (booking.getInventory().getInventoryType() != null) {
                        roomType = booking.getInventory().getInventoryType().name();
                    }
                }

                int guests = booking.getGuests() != null ? booking.getGuests().size() : 0;
                
                com.travel.marketplace.modules.payment.dto.PaymentBookingSummaryResponse summary = 
                    new com.travel.marketplace.modules.payment.dto.PaymentBookingSummaryResponse(
                        booking.getId(),
                        booking.getListing() != null ? booking.getListing().getId() : null,
                        listingTitle,
                        listingType,
                        listingLocation,
                        averageRating,
                        reviewCount,
                        roomName,
                        roomType,
                        imageUrl,
                        booking.getStartDate(),
                        booking.getEndDate(),
                        null, null, null,
                        guests
                    );
                
                builder.booking(summary);
            }
        }

        return builder.build();
    }
}
