package com.travel.marketplace.modules.booking.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class BookingGuestResponse {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String passport;
    private LocalDate dateOfBirth;
    private String nationality;
}
