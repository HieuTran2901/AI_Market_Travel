package com.travel.marketplace.modules.user.dto;

public record AdminUserStatisticsResponse(
        long totalUsers,
        long activeUsers,
        long newUsersLast30Days,
        long verifiedUsers,
        long bannedUsers,
        long customers,
        long providers,
        long admins
) {
}
