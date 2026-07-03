package com.travel.marketplace.modules.booking.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class GuestInfoRequest {
    private String name;
    private String email;
    private String phone;
    private String passport;
    private LocalDate dateOfBirth;
    private String nationality;
}
