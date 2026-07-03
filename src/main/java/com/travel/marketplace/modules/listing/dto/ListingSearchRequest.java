package com.travel.marketplace.modules.listing.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class ListingSearchRequest {
    private String keyword;
    private String category;
    private String city;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private BigDecimal radiusKm;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private String sortBy; // PRICE_ASC, PRICE_DESC, RATING_DESC, NEWEST
    private String status; // Usually fixed to ACTIVE for public search
}
