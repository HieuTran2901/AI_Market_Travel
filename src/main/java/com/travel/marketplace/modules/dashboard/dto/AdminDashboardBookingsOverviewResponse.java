package com.travel.marketplace.modules.dashboard.dto;

import java.util.List;

public record AdminDashboardBookingsOverviewResponse(
        String range,
        long total,
        double changePercentage,
        List<Point> points
) {
    public record Point(String date, long count) {
    }
}
