package com.travel.marketplace.modules.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be a valid email address")
    @Size(max = 100)
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 50, message = "Password must be between 6 and 50 characters")
    private String password;

    @Size(max = 100)
    private String fullName;

    @Size(max = 50)
    private String firstName;

    @Size(max = 50)
    private String lastName;

    @Size(max = 20)
    private String phoneNumber;

    // Optional provider registration info (all fields are optional at signup)
    private boolean isProvider;

    // HOTEL, TOUR, RESTAURANT, VEHICLE, EXPERIENCE
    private String businessType;
    private String businessName;
    private String address;
    private String city;
    private String taxCode;
    private String bankName;
    private String bankAccountNumber;
    private String bankAccountName;
}
