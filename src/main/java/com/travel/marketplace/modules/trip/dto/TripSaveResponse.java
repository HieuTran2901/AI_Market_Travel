package com.travel.marketplace.modules.trip.dto;

import lombok.Builder;

@Builder
public record TripSaveResponse(
        boolean success,
        TripResponse trip
) {}
