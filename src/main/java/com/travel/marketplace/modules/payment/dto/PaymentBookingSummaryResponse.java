package com.travel.marketplace.modules.payment.dto;

import java.time.LocalDate;

public record PaymentBookingSummaryResponse(
    Long bookingId,
    Long listingId,
    String listingTitle,
    String listingType,
    String listingLocation,
    java.math.BigDecimal averageRating,
    Integer reviewCount,
    String roomName,
    String roomType,
    String imageUrl,
    LocalDate checkIn,
    LocalDate checkOut,
    Integer adults,
    Integer children,
    Integer infants,
    Integer totalGuests
) {}
