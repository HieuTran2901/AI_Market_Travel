package com.travel.marketplace.modules.ai.planner.service;

import com.travel.marketplace.modules.ai.planner.dto.TripPlanRequest;
import com.travel.marketplace.modules.ai.planner.dto.TripPlanResponse;

public interface TripPlannerService {
    TripPlanResponse planTrip(TripPlanRequest request);
}
