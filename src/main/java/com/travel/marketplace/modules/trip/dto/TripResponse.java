package com.travel.marketplace.modules.trip.dto;

import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Builder
public record TripResponse(
        Long id,
        String slug,
        String title,
        String destination,
        LocalDate startDate,
        LocalDate endDate,
        Integer durationDays,
        Integer durationNights,
        String durationText,
        Integer travelerCount,
        BigDecimal budget,
        BigDecimal estimatedCost,
        String currency,
        String summary,
        String heroImageUrl,
        String status,
        String detailPath,
        List<TripDayResponse> days
) {}
