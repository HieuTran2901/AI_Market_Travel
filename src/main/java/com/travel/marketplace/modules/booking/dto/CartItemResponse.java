package com.travel.marketplace.modules.booking.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class CartItemResponse {
    private Long id;
    private Long listingId;
    private String listingTitle;
    private String listingSlug;
    private String listingCoverImageUrl;
    private String listingCategory;
    private String listingCity;
    private String listingCountry;
    private String providerName;
    private BigDecimal averageRating;
    private Integer reviewCount;
    private String currency;
    private Long inventoryId;
    private String inventoryName;
    private Integer quantity;
    private LocalDate startDate;
    private LocalDate endDate;
    private String timeSlot;
    private BigDecimal basePrice;
    private PriceBreakdownDto priceBreakdown;
    private List<CartItemExtraResponse> selectedExtras;
}
