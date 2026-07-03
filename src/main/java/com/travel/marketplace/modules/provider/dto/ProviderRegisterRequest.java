package com.travel.marketplace.modules.provider.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request body for converting a Customer account into a Provider.
 * Called by: POST /api/v1/provider/register
 */
@Data
public class ProviderRegisterRequest {

    @NotBlank(message = "Business name is required")
    @Size(max = 150, message = "Business name must not exceed 150 characters")
    private String businessName;

    /**
     * Must match one of the BusinessType enum values:
     * HOTEL, TOUR, RESTAURANT, VEHICLE, EXPERIENCE
     */
    @NotBlank(message = "Business type is required")
    private String businessType;

    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;

    @NotBlank(message = "Address is required")
    private String address;

    @NotBlank(message = "City is required")
    @Size(max = 100)
    private String city;

    @Size(max = 100)
    private String country;

    @Size(max = 20)
    private String phone;

    @Size(max = 255)
    private String website;

    @Size(max = 50)
    private String taxCode;

    @Size(max = 100)
    private String bankName;

    @Size(max = 50)
    private String bankAccountNumber;

    @Size(max = 100)
    private String bankAccountName;
}
