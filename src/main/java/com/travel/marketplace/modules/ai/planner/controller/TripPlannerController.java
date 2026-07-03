package com.travel.marketplace.modules.ai.planner.controller;

import com.travel.marketplace.dto.ApiResponse;
import com.travel.marketplace.modules.ai.planner.dto.TripPlanRequest;
import com.travel.marketplace.modules.ai.planner.dto.TripPlanResponse;
import com.travel.marketplace.modules.ai.planner.service.TripPlannerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class TripPlannerController {

    private final TripPlannerService tripPlannerService;

    @PostMapping("/trip-plan")
    public ApiResponse<TripPlanResponse> planTrip(@Valid @RequestBody TripPlanRequest request) {
        TripPlanResponse response = tripPlannerService.planTrip(request);
        return ApiResponse.success("Trip plan generated successfully", response);
    }
}
