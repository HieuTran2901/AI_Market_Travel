package com.travel.marketplace.modules.provider.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request body for updating an existing provider profile.
 * All fields are optional — only non-null fields will be applied.
 * Called by: PUT /api/v1/provider/me
 */
@Data
public class ProviderUpdateRequest {

    @Size(max = 150)
    private String businessName;

    @Size(max = 2000)
    private String description;

    private String address;

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
