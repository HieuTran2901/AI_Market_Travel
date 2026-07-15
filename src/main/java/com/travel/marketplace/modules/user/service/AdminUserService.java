package com.travel.marketplace.modules.user.service;

import com.travel.marketplace.modules.user.dto.AdminUserResponse;
import com.travel.marketplace.modules.user.dto.AdminUserSearchRequest;
import com.travel.marketplace.modules.user.dto.AdminUserStatisticsResponse;
import com.travel.marketplace.modules.user.dto.BanUserRequest;
import org.springframework.data.domain.Page;

public interface AdminUserService {
    Page<AdminUserResponse> getUsers(AdminUserSearchRequest request, int page, int size, String sort);
    AdminUserStatisticsResponse getStatistics();
    AdminUserResponse banUser(Long userId, Long adminUserId, BanUserRequest request);
    AdminUserResponse unbanUser(Long userId, Long adminUserId);
}
