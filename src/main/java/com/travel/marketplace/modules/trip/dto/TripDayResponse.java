package com.travel.marketplace.modules.trip.dto;

import lombok.Builder;

import java.util.List;

@Builder
public record TripDayResponse(
        Integer dayNumber,
        String title,
        String summary,
        String imageUrl,
        List<TripActivityResponse> activities
) {}
