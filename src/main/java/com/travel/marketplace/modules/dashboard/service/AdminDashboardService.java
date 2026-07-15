package com.travel.marketplace.modules.dashboard.service;

import com.travel.marketplace.modules.dashboard.dto.AdminDashboardBookingsOverviewResponse;
import com.travel.marketplace.modules.dashboard.dto.AdminDashboardOverviewResponse;
import com.travel.marketplace.modules.dashboard.dto.AdminDashboardRecentBookingResponse;
import com.travel.marketplace.modules.dashboard.dto.AdminDashboardSystemHealthResponse;
import com.travel.marketplace.modules.dashboard.dto.AdminDashboardUserGrowthResponse;

import java.util.List;

public interface AdminDashboardService {
    AdminDashboardOverviewResponse getOverview();

    AdminDashboardBookingsOverviewResponse getBookingsOverview(String range);

    AdminDashboardUserGrowthResponse getUserGrowth(String range);

    AdminDashboardSystemHealthResponse getSystemHealth();

    List<AdminDashboardRecentBookingResponse> getRecentBookings(int limit);
}
