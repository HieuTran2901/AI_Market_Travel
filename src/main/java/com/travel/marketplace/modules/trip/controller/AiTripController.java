package com.travel.marketplace.modules.trip.controller;

import com.travel.marketplace.dto.ApiResponse;
import com.travel.marketplace.modules.trip.dto.TripSaveResponse;
import com.travel.marketplace.modules.trip.service.AiTripDraftService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ai/trips")
@RequiredArgsConstructor
public class AiTripController {

    private final AiTripDraftService aiTripDraftService;

    @PostMapping("/{draftId}/confirm")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<TripSaveResponse> confirmDraft(
            @PathVariable UUID draftId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ApiResponse.success("Trip added to My Trips", aiTripDraftService.confirmDraft(draftId, userDetails.getUsername()));
    }
}
