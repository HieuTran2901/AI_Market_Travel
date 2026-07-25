package com.travel.marketplace.modules.booking.mapper;

import com.travel.marketplace.modules.booking.dto.*;
import com.travel.marketplace.modules.booking.entity.*;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class BookingMapper {

    public CartItemResponse toCartItemResponse(CartItem item, PriceBreakdownDto priceBreakdown) {
        if (item == null) return null;

        return CartItemResponse.builder()
                .id(item.getId())
                .listingId(item.getListing().getId())
                .listingTitle(item.getListing().getTitle())
                .listingSlug(item.getListing().getSlug())
                .listingCoverImageUrl(item.getListing().getCoverImageUrl())
                .listingCategory(item.getListing().getCategory().name())
                .listingCity(item.getListing().getCity())
                .listingCountry(item.getListing().getCountry())
                .providerName(item.getListing().getProvider().getBusinessName())
                .averageRating(item.getListing().getAverageRating())
                .reviewCount(item.getListing().getReviewCount())
                .currency(item.getListing().getCurrency())
                .inventoryId(item.getInventory() != null ? item.getInventory().getId() : null)
                .inventoryName(item.getInventory() != null ? item.getInventory().getName() : null)
                .quantity(item.getQuantity())
                .startDate(item.getStartDate())
                .endDate(item.getEndDate())
                .timeSlot(item.getTimeSlot())
                .basePrice(item.getListing().getBasePrice())
                .priceBreakdown(priceBreakdown)
                .selectedExtras(toCartItemExtraResponses(item.getExtras()))
                .build();
    }

    public List<CartItemExtraResponse> toCartItemExtraResponses(List<? extends Object> extras) {
        if (extras == null) {
            return List.of();
        }

        return extras.stream()
                .map(extra -> {
                    if (extra instanceof CartItemExtra cartExtra) {
                        return CartItemExtraResponse.builder()
                                .id(cartExtra.getId())
                                .extraServiceId(cartExtra.getExtraService().getId())
                                .name(cartExtra.getServiceNameSnapshot())
                                .quantity(cartExtra.getQuantity())
                                .unitPrice(cartExtra.getUnitPriceSnapshot())
                                .lineTotal(cartExtra.getLineTotal())
                                .currency(cartExtra.getCurrency())
                                .pricingUnit(cartExtra.getPricingUnit())
                                .build();
                    }
                    BookingExtraItem bookingExtra = (BookingExtraItem) extra;
                    return CartItemExtraResponse.builder()
                            .id(bookingExtra.getId())
                            .extraServiceId(bookingExtra.getExtraService().getId())
                            .name(bookingExtra.getServiceNameSnapshot())
                            .quantity(bookingExtra.getQuantity())
                            .unitPrice(bookingExtra.getUnitPriceSnapshot())
                            .lineTotal(bookingExtra.getLineTotal())
                            .currency(bookingExtra.getCurrency())
                            .pricingUnit(bookingExtra.getPricingUnit())
                            .build();
                })
                .collect(Collectors.toList());
    }

    public BookingGuestResponse toGuestResponse(BookingGuest guest) {
        if (guest == null) return null;

        return BookingGuestResponse.builder()
                .id(guest.getId())
                .name(guest.getName())
                .email(guest.getEmail())
                .phone(guest.getPhone())
                .passport(guest.getPassport())
                .dateOfBirth(guest.getDateOfBirth())
                .nationality(guest.getNationality())
                .build();
    }

    public BookingResponse toBookingResponse(Booking booking) {
        if (booking == null) return null;

        PriceBreakdownDto breakdown = PriceBreakdownDto.builder()
                .basePrice(booking.getBasePrice())
                .subtotal(booking.getSubtotal())
                .extrasAmount(sumBookingExtras(booking))
                .serviceFee(booking.getServiceFee())
                .tax(booking.getTax())
                .discount(booking.getDiscount())
                .finalTotal(booking.getFinalTotal())
                .build();

        return BookingResponse.builder()
                .id(booking.getId())
                .orderId(booking.getOrder().getId())
                .orderNumber(booking.getOrder().getOrderNumber())
                .listingId(booking.getListing().getId())
                .listingTitle(booking.getListing().getTitle())
                .listingSlug(booking.getListing().getSlug())
                .listingCoverImageUrl(booking.getListing().getCoverImageUrl())
                .listingCategory(booking.getListing().getCategory().name())
                .inventoryId(booking.getInventory() != null ? booking.getInventory().getId() : null)
                .inventoryName(booking.getInventory() != null ? booking.getInventory().getName() : null)
                .bookingNumber(booking.getBookingNumber())
                .status(booking.getStatus().name())
                .startDate(booking.getStartDate())
                .endDate(booking.getEndDate())
                .timeSlot(booking.getTimeSlot())
                .quantity(booking.getQuantity())
                .priceBreakdown(breakdown)
                .selectedExtras(toCartItemExtraResponses(booking.getExtras()))
                .expiresAt(booking.getExpiresAt())
                .guests(booking.getGuests() != null ? booking.getGuests().stream().map(this::toGuestResponse).collect(Collectors.toList()) : null)
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .build();
    }

    public OrderResponse toOrderResponse(Order order) {
        if (order == null) return null;

        PriceBreakdownDto breakdown = PriceBreakdownDto.builder()
                .basePrice(order.getSubtotal()) // Order level aggregates bookings subtotals as base
                .subtotal(order.getSubtotal())
                .extrasAmount(sumOrderExtras(order))
                .serviceFee(order.getServiceFee())
                .tax(order.getTax())
                .discount(order.getDiscount())
                .finalTotal(order.getFinalTotal())
                .build();

        return OrderResponse.builder()
                .id(order.getId())
                .userId(order.getUser().getId())
                .orderNumber(order.getOrderNumber())
                .status(order.getStatus().name())
                .priceBreakdown(breakdown)
                .bookings(order.getBookings() != null ? order.getBookings().stream().map(this::toBookingResponse).collect(Collectors.toList()) : null)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }

    private java.math.BigDecimal sumBookingExtras(Booking booking) {
        if (booking.getExtras() == null) {
            return java.math.BigDecimal.ZERO;
        }
        return booking.getExtras().stream()
                .map(BookingExtraItem::getLineTotal)
                .filter(java.util.Objects::nonNull)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
    }

    private java.math.BigDecimal sumOrderExtras(Order order) {
        if (order.getBookings() == null) {
            return java.math.BigDecimal.ZERO;
        }
        return order.getBookings().stream()
                .map(this::sumBookingExtras)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
    }
}
