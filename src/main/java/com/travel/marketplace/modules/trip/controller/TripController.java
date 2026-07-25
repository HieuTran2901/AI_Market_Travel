package com.travel.marketplace.modules.trip.controller;

import com.travel.marketplace.dto.ApiResponse;
import com.travel.marketplace.modules.trip.dto.TripResponse;
import com.travel.marketplace.modules.trip.service.AiTripDraftService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/trips")
@RequiredArgsConstructor
public class TripController {

    private final AiTripDraftService tripService;

    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<TripResponse>> myTrips(@AuthenticationPrincipal UserDetails userDetails) {
        return ApiResponse.success(tripService.listTrips(userDetails.getUsername()));
    }

    @GetMapping("/{slug}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<TripResponse> tripDetail(
            @PathVariable String slug,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ApiResponse.success(tripService.getTrip(slug, userDetails.getUsername()));
    }
}
