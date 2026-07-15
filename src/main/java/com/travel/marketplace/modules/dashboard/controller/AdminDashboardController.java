package com.travel.marketplace.modules.dashboard.controller;

import com.travel.marketplace.dto.ApiResponse;
import com.travel.marketplace.modules.dashboard.dto.AdminDashboardBookingsOverviewResponse;
import com.travel.marketplace.modules.dashboard.dto.AdminDashboardOverviewResponse;
import com.travel.marketplace.modules.dashboard.dto.AdminDashboardRecentBookingResponse;
import com.travel.marketplace.modules.dashboard.dto.AdminDashboardSystemHealthResponse;
import com.travel.marketplace.modules.dashboard.dto.AdminDashboardUserGrowthResponse;
import com.travel.marketplace.modules.dashboard.service.AdminDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
@Tag(name = "Admin - Dashboard", description = "Admin dashboard aggregate marketplace metrics")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class AdminDashboardController {

    private final AdminDashboardService dashboardService;

    public AdminDashboardController(AdminDashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/overview")
    @Operation(summary = "Get dashboard KPI overview")
    public ResponseEntity<ApiResponse<AdminDashboardOverviewResponse>> getOverview() {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getOverview()));
    }

    @GetMapping("/bookings-overview")
    @Operation(summary = "Get booking count time series")
    public ResponseEntity<ApiResponse<AdminDashboardBookingsOverviewResponse>> getBookingsOverview(@RequestParam(defaultValue = "30d") String range) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getBookingsOverview(range)));
    }

    @GetMapping("/user-growth")
    @Operation(summary = "Get user growth time series")
    public ResponseEntity<ApiResponse<AdminDashboardUserGrowthResponse>> getUserGrowth(@RequestParam(defaultValue = "30d") String range) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getUserGrowth(range)));
    }

    @GetMapping("/system-health")
    @Operation(summary = "Get dashboard-safe system health")
    public ResponseEntity<ApiResponse<AdminDashboardSystemHealthResponse>> getSystemHealth() {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getSystemHealth()));
    }

    @GetMapping("/recent-bookings")
    @Operation(summary = "Get recent bookings for the dashboard")
    public ResponseEntity<ApiResponse<List<AdminDashboardRecentBookingResponse>>> getRecentBookings(@RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getRecentBookings(limit)));
    }
}
