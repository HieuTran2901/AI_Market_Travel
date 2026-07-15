package com.travel.marketplace.modules.provider.service;

import com.travel.marketplace.exception.ResourceNotFoundException;
import com.travel.marketplace.modules.booking.repository.BookingRepository;
import com.travel.marketplace.modules.listing.repository.ListingRepository;
import com.travel.marketplace.modules.provider.dto.AdminProviderCategoryResponse;
import com.travel.marketplace.modules.provider.dto.AdminProviderGrowthPointResponse;
import com.travel.marketplace.modules.provider.dto.AdminProviderGrowthResponse;
import com.travel.marketplace.modules.provider.dto.AdminProviderResponse;
import com.travel.marketplace.modules.provider.dto.AdminProviderSearchRequest;
import com.travel.marketplace.modules.provider.dto.AdminProviderStatisticsResponse;
import com.travel.marketplace.modules.provider.dto.ProviderProfileResponse;
import com.travel.marketplace.modules.provider.enums.BusinessType;
import com.travel.marketplace.modules.provider.enums.VerificationStatus;
import com.travel.marketplace.modules.review.enums.ReviewStatus;
import com.travel.marketplace.modules.review.repository.ReviewRepository;
import com.travel.marketplace.modules.user.entity.ProviderProfile;
import com.travel.marketplace.modules.user.entity.User;
import com.travel.marketplace.modules.user.repository.ProviderProfileRepository;
import com.travel.marketplace.modules.user.repository.ProviderProfileSpecification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class AdminProviderServiceImpl implements AdminProviderService {

    private static final Set<String> SORT_ALLOWLIST = Set.of("id", "businessName", "businessType", "verificationStatus", "createdAt", "updatedAt");

    private final ProviderProfileRepository providerProfileRepository;
    private final BookingRepository bookingRepository;
    private final ListingRepository listingRepository;
    private final ReviewRepository reviewRepository;
    private final ProviderService providerService;

    public AdminProviderServiceImpl(
            ProviderProfileRepository providerProfileRepository,
            BookingRepository bookingRepository,
            ListingRepository listingRepository,
            ReviewRepository reviewRepository,
            ProviderService providerService
    ) {
        this.providerProfileRepository = providerProfileRepository;
        this.bookingRepository = bookingRepository;
        this.listingRepository = listingRepository;
        this.reviewRepository = reviewRepository;
        this.providerService = providerService;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AdminProviderResponse> getProviders(AdminProviderSearchRequest request, int page, int size, String sort) {
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), resolveSort(sort));
        Page<ProviderProfile> providers = providerProfileRepository.findAll(ProviderProfileSpecification.filterBy(request), pageable);
        ProviderAggregates aggregates = loadAggregates(providers.getContent().stream().map(ProviderProfile::getId).toList());
        return providers.map(provider -> toResponse(provider, aggregates));
    }

    @Override
    @Transactional(readOnly = true)
    public AdminProviderStatisticsResponse getStatistics() {
        long total = providerProfileRepository.count();
        long active = providerProfileRepository.countByVerificationStatus(VerificationStatus.APPROVED);
        long newProviders = providerProfileRepository.countByCreatedAtGreaterThanEqual(Instant.now().minus(30, ChronoUnit.DAYS));
        long suspended = providerProfileRepository.countByVerificationStatus(VerificationStatus.SUSPENDED);
        long pending = providerProfileRepository.countByVerificationStatus(VerificationStatus.PENDING);
        return new AdminProviderStatisticsResponse(total, active, newProviders, active, suspended, pending);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminProviderCategoryResponse> getCategoryDistribution() {
        long total = Math.max(providerProfileRepository.count(), 1);
        return providerProfileRepository.countByBusinessType().stream()
                .map(row -> {
                    BusinessType category = (BusinessType) row[0];
                    long count = (Long) row[1];
                    BigDecimal percentage = BigDecimal.valueOf(count * 100.0 / total).setScale(1, RoundingMode.HALF_UP);
                    return new AdminProviderCategoryResponse(category != null ? category.name() : "OTHER", count, percentage);
                })
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AdminProviderGrowthResponse getGrowth(String range) {
        String normalizedRange = "7d".equalsIgnoreCase(range) ? "7d" : "90d".equalsIgnoreCase(range) ? "90d" : "30d";
        int days = "7d".equals(normalizedRange) ? 7 : "90d".equals(normalizedRange) ? 90 : 30;
        LocalDate start = LocalDate.now(ZoneOffset.UTC).minusDays(days - 1L);
        List<ProviderProfile> providers = providerProfileRepository.findAll();
        Map<LocalDate, Long> counts = providers.stream()
                .filter(provider -> provider.getCreatedAt() != null)
                .map(provider -> provider.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate())
                .filter(date -> !date.isBefore(start))
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));

        List<AdminProviderGrowthPointResponse> points = java.util.stream.IntStream.range(0, days)
                .mapToObj(offset -> {
                    LocalDate date = start.plusDays(offset);
                    return new AdminProviderGrowthPointResponse(date, counts.getOrDefault(date, 0L));
                })
                .toList();
        return new AdminProviderGrowthResponse(normalizedRange, points);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminProviderResponse> getTopRated(int limit) {
        List<ProviderProfile> providers = providerProfileRepository.findAll();
        ProviderAggregates aggregates = loadAggregates(providers.stream().map(ProviderProfile::getId).toList());
        return providers.stream()
                .map(provider -> toResponse(provider, aggregates))
                .filter(provider -> provider.reviewCount() > 0)
                .sorted(Comparator.comparing(AdminProviderResponse::rating, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(AdminProviderResponse::reviewCount, Comparator.reverseOrder()))
                .limit(Math.min(Math.max(limit, 1), 20))
                .toList();
    }

    @Override
    @Transactional
    public ProviderProfileResponse approveProvider(Long providerId) {
        return providerService.approveProvider(providerId);
    }

    @Override
    @Transactional
    public ProviderProfileResponse rejectProvider(Long providerId, String reason) {
        return providerService.rejectProvider(providerId, reason);
    }

    @Override
    @Transactional
    public ProviderProfileResponse suspendProvider(Long providerId, String reason) {
        return providerService.suspendProvider(providerId, reason);
    }

    @Override
    @Transactional
    public ProviderProfileResponse reactivateProvider(Long providerId) {
        ProviderProfile profile = providerProfileRepository.findById(providerId)
                .orElseThrow(() -> new ResourceNotFoundException("Provider not found with id: " + providerId));
        profile.setVerificationStatus(VerificationStatus.APPROVED);
        profile.setRejectionReason(null);
        return providerService.approveProvider(providerId);
    }

    private ProviderAggregates loadAggregates(List<Long> providerIds) {
        if (providerIds.isEmpty()) {
            return new ProviderAggregates(Map.of(), Map.of(), Map.of(), Map.of());
        }

        Map<Long, Long> bookingCounts = toLongMap(bookingRepository.countBookingsByProviderIds(providerIds));
        Map<Long, Long> activeListingCounts = toLongMap(listingRepository.countActiveListingsByProviderIds(providerIds));
        Map<Long, BigDecimal> ratings = new HashMap<>();
        Map<Long, Long> reviewCounts = new HashMap<>();
        for (Object[] row : reviewRepository.ratingSummaryByProviderIds(providerIds, ReviewStatus.PUBLISHED)) {
            Long providerId = (Long) row[0];
            Number avg = (Number) row[1];
            ratings.put(providerId, avg != null ? BigDecimal.valueOf(avg.doubleValue()).setScale(1, RoundingMode.HALF_UP) : BigDecimal.ZERO);
            reviewCounts.put(providerId, (Long) row[2]);
        }

        return new ProviderAggregates(bookingCounts, activeListingCounts, ratings, reviewCounts);
    }

    private Map<Long, Long> toLongMap(List<Object[]> rows) {
        return rows.stream().collect(Collectors.toMap(row -> (Long) row[0], row -> (Long) row[1], Long::sum));
    }

    private AdminProviderResponse toResponse(ProviderProfile provider, ProviderAggregates aggregates) {
        User user = provider.getUser();
        String verificationStatus = provider.getVerificationStatus() != null ? provider.getVerificationStatus().name() : "PENDING";
        return new AdminProviderResponse(
                provider.getId(),
                user != null ? user.getId() : null,
                provider.getBusinessName(),
                user != null ? user.getFullName() : provider.getBusinessName(),
                user != null ? user.getEmail() : null,
                provider.getPhone() != null ? provider.getPhone() : user != null ? user.getPhoneNumber() : null,
                user != null ? user.getAvatarUrl() : null,
                provider.getBusinessType() != null ? provider.getBusinessType().name() : "OTHER",
                resolveStatus(verificationStatus),
                verificationStatus,
                aggregates.ratings().getOrDefault(provider.getId(), BigDecimal.ZERO),
                aggregates.reviewCounts().getOrDefault(provider.getId(), 0L),
                aggregates.bookingCounts().getOrDefault(provider.getId(), 0L),
                aggregates.activeListingCounts().getOrDefault(provider.getId(), 0L),
                provider.getCreatedAt(),
                provider.getUpdatedAt()
        );
    }

    private Sort resolveSort(String sort) {
        String property = "createdAt";
        Sort.Direction direction = Sort.Direction.DESC;
        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",", 2);
            if (parts.length > 0 && SORT_ALLOWLIST.contains(parts[0])) {
                property = parts[0];
            }
            if (parts.length > 1 && "asc".equalsIgnoreCase(parts[1])) {
                direction = Sort.Direction.ASC;
            }
        }
        return Sort.by(direction, property);
    }

    private String resolveStatus(String verificationStatus) {
        return switch (verificationStatus) {
            case "APPROVED" -> "ACTIVE";
            case "SUSPENDED" -> "SUSPENDED";
            case "REJECTED" -> "REJECTED";
            default -> "PENDING";
        };
    }

    private record ProviderAggregates(
            Map<Long, Long> bookingCounts,
            Map<Long, Long> activeListingCounts,
            Map<Long, BigDecimal> ratings,
            Map<Long, Long> reviewCounts
    ) {
    }
}
