package com.travel.marketplace.modules.provider.service;

import com.travel.marketplace.modules.booking.repository.BookingRepository;
import com.travel.marketplace.modules.listing.repository.ListingRepository;
import com.travel.marketplace.modules.provider.dto.AdminProviderResponse;
import com.travel.marketplace.modules.provider.dto.AdminProviderSearchRequest;
import com.travel.marketplace.modules.provider.dto.AdminProviderStatisticsResponse;
import com.travel.marketplace.modules.provider.enums.BusinessType;
import com.travel.marketplace.modules.provider.enums.VerificationStatus;
import com.travel.marketplace.modules.review.enums.ReviewStatus;
import com.travel.marketplace.modules.review.repository.ReviewRepository;
import com.travel.marketplace.modules.user.entity.ProviderProfile;
import com.travel.marketplace.modules.user.entity.User;
import com.travel.marketplace.modules.user.repository.ProviderProfileRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminProviderServiceImplTest {

    @Mock
    private ProviderProfileRepository providerProfileRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private ListingRepository listingRepository;

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private ProviderService providerService;

    @Test
    void getProvidersReturnsAggregatedAdminProviderDto() {
        AdminProviderService service = new AdminProviderServiceImpl(providerProfileRepository, bookingRepository, listingRepository, reviewRepository, providerService);
        User user = User.builder()
                .id(10L)
                .email("hotel@example.com")
                .fullName("Hotel Manager")
                .phoneNumber("+84 900 000 000")
                .avatarUrl("/uploads/users/hotel.png")
                .createdAt(Instant.parse("2026-01-01T00:00:00Z"))
                .updatedAt(Instant.parse("2026-01-02T00:00:00Z"))
                .build();
        ProviderProfile provider = ProviderProfile.builder()
                .id(5L)
                .user(user)
                .businessName("Ocean Hotel")
                .businessType(BusinessType.HOTEL)
                .phone("+84 911 111 111")
                .verificationStatus(VerificationStatus.APPROVED)
                .createdAt(Instant.parse("2026-01-01T00:00:00Z"))
                .updatedAt(Instant.parse("2026-01-03T00:00:00Z"))
                .build();

        Page<ProviderProfile> page = new PageImpl<>(List.of(provider));
        when(providerProfileRepository.findAll(ArgumentMatchers.<Specification<ProviderProfile>>any(), any(Pageable.class))).thenReturn(page);
        when(bookingRepository.countBookingsByProviderIds(List.of(5L))).thenReturn(List.<Object[]>of(new Object[]{5L, 8L}));
        when(listingRepository.countActiveListingsByProviderIds(List.of(5L))).thenReturn(List.<Object[]>of(new Object[]{5L, 3L}));
        when(reviewRepository.ratingSummaryByProviderIds(List.of(5L), ReviewStatus.PUBLISHED)).thenReturn(List.<Object[]>of(new Object[]{5L, 4.75, 12L}));

        AdminProviderResponse response = service.getProviders(
                new AdminProviderSearchRequest(null, null, null, null, null, null),
                0,
                10,
                "createdAt,desc"
        ).getContent().getFirst();

        assertThat(response.id()).isEqualTo(5L);
        assertThat(response.businessName()).isEqualTo("Ocean Hotel");
        assertThat(response.email()).isEqualTo("hotel@example.com");
        assertThat(response.serviceCategory()).isEqualTo("HOTEL");
        assertThat(response.status()).isEqualTo("ACTIVE");
        assertThat(response.verificationStatus()).isEqualTo("APPROVED");
        assertThat(response.bookingCount()).isEqualTo(8L);
        assertThat(response.activeListingCount()).isEqualTo(3L);
        assertThat(response.reviewCount()).isEqualTo(12L);
        assertThat(response.rating()).isEqualByComparingTo("4.8");
    }

    @Test
    void getStatisticsUsesProviderAggregateCounts() {
        AdminProviderService service = new AdminProviderServiceImpl(providerProfileRepository, bookingRepository, listingRepository, reviewRepository, providerService);
        when(providerProfileRepository.count()).thenReturn(10L);
        when(providerProfileRepository.countByVerificationStatus(VerificationStatus.APPROVED)).thenReturn(6L);
        when(providerProfileRepository.countByCreatedAtGreaterThanEqual(any(Instant.class))).thenReturn(2L);
        when(providerProfileRepository.countByVerificationStatus(VerificationStatus.SUSPENDED)).thenReturn(1L);
        when(providerProfileRepository.countByVerificationStatus(VerificationStatus.PENDING)).thenReturn(3L);

        AdminProviderStatisticsResponse stats = service.getStatistics();

        assertThat(stats.totalProviders()).isEqualTo(10L);
        assertThat(stats.activeProviders()).isEqualTo(6L);
        assertThat(stats.verifiedProviders()).isEqualTo(6L);
        assertThat(stats.newProvidersLast30Days()).isEqualTo(2L);
        assertThat(stats.suspendedProviders()).isEqualTo(1L);
        assertThat(stats.pendingProviders()).isEqualTo(3L);
    }

    @Test
    void getGrowthReturnsRangeAndPointsWrapper() {
        AdminProviderService service = new AdminProviderServiceImpl(providerProfileRepository, bookingRepository, listingRepository, reviewRepository, providerService);
        ProviderProfile provider = ProviderProfile.builder()
                .id(6L)
                .businessName("Tour Provider")
                .businessType(BusinessType.TOUR)
                .verificationStatus(VerificationStatus.PENDING)
                .createdAt(Instant.now())
                .build();
        when(providerProfileRepository.findAll()).thenReturn(List.of(provider));

        var growth = service.getGrowth("7d");

        assertThat(growth.range()).isEqualTo("7d");
        assertThat(growth.points()).hasSize(7);
        assertThat(growth.points().stream().mapToLong(point -> point.count()).sum()).isEqualTo(1L);
    }
}
