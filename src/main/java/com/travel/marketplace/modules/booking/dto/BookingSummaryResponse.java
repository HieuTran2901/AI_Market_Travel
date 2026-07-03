package com.travel.marketplace.modules.booking.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class BookingSummaryResponse {
    private Long listingId;
    private String listingTitle;
    private Long inventoryId;
    private String inventoryName;
    private LocalDate startDate;
    private LocalDate endDate;
    private String timeSlot;
    private Integer quantity;
    private PriceBreakdownDto priceBreakdown;
}
