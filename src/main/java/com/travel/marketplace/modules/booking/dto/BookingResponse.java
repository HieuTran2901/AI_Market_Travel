package com.travel.marketplace.modules.booking.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class BookingResponse {
    private Long id;
    private Long orderId;
    private String orderNumber;
    private Long listingId;
    private String listingTitle;
    private String listingSlug;
    private String listingCoverImageUrl;
    private String listingCategory;
    private Long inventoryId;
    private String inventoryName;
    private String bookingNumber;
    private String status;
    private LocalDate startDate;
    private LocalDate endDate;
    private String timeSlot;
    private Integer quantity;
    private PriceBreakdownDto priceBreakdown;
    private Instant expiresAt;
    private List<BookingGuestResponse> guests;
    private Instant createdAt;
    private Instant updatedAt;
}
