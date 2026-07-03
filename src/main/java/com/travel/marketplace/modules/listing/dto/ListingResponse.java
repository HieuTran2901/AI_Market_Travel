package com.travel.marketplace.modules.listing.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ListingResponse {

    private Long id;
    private Long providerId;
    private String providerName; // Simplified provider info

    private String category;
    private String title;
    private String slug;
    private String shortDesc;
    private String description;

    private String address;
    private String city;
    private String country;
    private BigDecimal latitude;
    private BigDecimal longitude;

    private String coverImageUrl;
    private BigDecimal basePrice;
    private String currency;

    private String status;
    private String rejectionReason;

    private Integer viewCount;
    private BigDecimal averageRating;
    private Integer reviewCount;

    private Instant createdAt;
    private Instant updatedAt;

    private List<ListingImageResponse> images;
    private Map<String, Object> details; // Polymorphic details

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ListingImageResponse {
        private Long id;
        private String imageUrl;
        private String altText;
        private Integer displayOrder;
        private Boolean isPrimary;
    }
}
