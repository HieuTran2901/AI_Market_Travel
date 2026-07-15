package com.travel.marketplace.modules.dashboard.dto;

import java.util.List;

public record AdminDashboardUserGrowthResponse(
        String range,
        long totalUsers,
        long newUsers,
        double changePercentage,
        List<Point> points
) {
    public record Point(String date, long newUsers, long cumulativeUsers) {
    }
}
