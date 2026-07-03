package com.travel.marketplace.modules.listing.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
public class UpdateListingRequest {

    @Size(max = 200)
    private String title;

    @Size(max = 500)
    private String shortDesc;

    private String description;

    private String address;

    @Size(max = 100)
    private String city;

    @Size(max = 100)
    private String country;

    private BigDecimal latitude;
    private BigDecimal longitude;

    private String coverImageUrl;

    private BigDecimal basePrice;

    private String currency;

    private List<String> imageUrls;

    private Map<String, Object> details;
}
