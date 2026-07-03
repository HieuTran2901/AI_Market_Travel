package com.travel.marketplace.modules.listing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
public class CreateListingRequest {

    @NotBlank(message = "Category is required")
    private String category; // HOTEL, TOUR, RESTAURANT, VEHICLE, EXPERIENCE

    @NotBlank(message = "Title is required")
    @Size(max = 200)
    private String title;

    @Size(max = 500)
    private String shortDesc;

    private String description;

    @NotBlank(message = "Address is required")
    private String address;

    @NotBlank(message = "City is required")
    @Size(max = 100)
    private String city;

    @Size(max = 100)
    private String country;

    private BigDecimal latitude;
    private BigDecimal longitude;

    private String coverImageUrl;

    @NotNull(message = "Base price is required")
    private BigDecimal basePrice;

    private String currency = "VND";

    private List<String> imageUrls; // List of URLs for listing images

    // Detail payload based on category (flexible structure, can be converted based on category)
    private Map<String, Object> details;
}
