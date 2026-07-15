package com.travel.marketplace.modules.provider.service;

import com.travel.marketplace.modules.provider.dto.AdminProviderCategoryResponse;
import com.travel.marketplace.modules.provider.dto.AdminProviderGrowthResponse;
import com.travel.marketplace.modules.provider.dto.AdminProviderResponse;
import com.travel.marketplace.modules.provider.dto.AdminProviderSearchRequest;
import com.travel.marketplace.modules.provider.dto.AdminProviderStatisticsResponse;
import com.travel.marketplace.modules.provider.dto.ProviderProfileResponse;
import org.springframework.data.domain.Page;

import java.util.List;

public interface AdminProviderService {

    Page<AdminProviderResponse> getProviders(AdminProviderSearchRequest request, int page, int size, String sort);

    AdminProviderStatisticsResponse getStatistics();

    List<AdminProviderCategoryResponse> getCategoryDistribution();

    AdminProviderGrowthResponse getGrowth(String range);

    List<AdminProviderResponse> getTopRated(int limit);

    ProviderProfileResponse approveProvider(Long providerId);

    ProviderProfileResponse rejectProvider(Long providerId, String reason);

    ProviderProfileResponse suspendProvider(Long providerId, String reason);

    ProviderProfileResponse reactivateProvider(Long providerId);
}
