package com.travel.marketplace.modules.dashboard.service;

import com.travel.marketplace.exception.BusinessException;
import com.travel.marketplace.modules.booking.repository.BookingRepository;
import com.travel.marketplace.modules.dashboard.dto.AdminDashboardBookingsOverviewResponse;
import com.travel.marketplace.modules.dashboard.dto.AdminDashboardOverviewResponse;
import com.travel.marketplace.modules.dashboard.dto.AdminDashboardUserGrowthResponse;
import com.travel.marketplace.modules.listing.enums.ListingStatus;
import com.travel.marketplace.modules.listing.repository.ListingRepository;
import com.travel.marketplace.modules.payment.enums.SettlementStatus;
import com.travel.marketplace.modules.payment.repository.SettlementRepository;
import com.travel.marketplace.modules.user.repository.ProviderProfileRepository;
import com.travel.marketplace.modules.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminDashboardServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ListingRepository listingRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private ProviderProfileRepository providerProfileRepository;

    @Mock
    private SettlementRepository settlementRepository;

    @Test
    void getOverviewUsesRealAggregateRepositories() {
        AdminDashboardService service = service();
        when(userRepository.count()).thenReturn(12L);
        when(listingRepository.countByStatus(ListingStatus.ACTIVE)).thenReturn(8L);
        when(bookingRepository.count()).thenReturn(20L);
        when(settlementRepository.sumPlatformFeeByStatus(SettlementStatus.COMPLETED)).thenReturn(new BigDecimal("150000.00"));
        when(settlementRepository.findCurrenciesByStatus(SettlementStatus.COMPLETED)).thenReturn(List.of("VND"));
        when(providerProfileRepository.count()).thenReturn(4L);

        AdminDashboardOverviewResponse overview = service.getOverview();

        assertThat(overview.totalUsers()).isEqualTo(12L);
        assertThat(overview.activeListings()).isEqualTo(8L);
        assertThat(overview.totalBookings()).isEqualTo(20L);
        assertThat(overview.totalRevenue()).isEqualByComparingTo("150000.00");
        assertThat(overview.currency()).isEqualTo("VND");
        assertThat(overview.totalProviders()).isEqualTo(4L);
        assertThat(overview.generatedAt()).isNotNull();
    }

    @Test
    void bookingsOverviewReturnsContinuousSeriesAndChange() {
        AdminDashboardService service = service();
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        when(bookingRepository.countBookingsCreatedByDay(any(Instant.class), any(Instant.class)))
                .thenReturn(List.<Object[]>of(new Object[]{Date.valueOf(today), 3L}));
        when(bookingRepository.countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(any(Instant.class), any(Instant.class)))
                .thenReturn(1L);

        AdminDashboardBookingsOverviewResponse response = service.getBookingsOverview("7d");

        assertThat(response.range()).isEqualTo("7d");
        assertThat(response.points()).hasSize(7);
        assertThat(response.total()).isEqualTo(3L);
        assertThat(response.changePercentage()).isEqualTo(200.0);
    }

    @Test
    void userGrowthReturnsCumulativeSeries() {
        AdminDashboardService service = service();
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        when(userRepository.countUsersCreatedByDay(any(Instant.class), any(Instant.class)))
                .thenReturn(List.<Object[]>of(new Object[]{Date.valueOf(today), 2L}));
        when(userRepository.countByCreatedAtBefore(any(Instant.class))).thenReturn(10L);
        when(userRepository.countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(any(Instant.class), any(Instant.class)))
                .thenReturn(0L);
        when(userRepository.count()).thenReturn(12L);

        AdminDashboardUserGrowthResponse response = service.getUserGrowth("7d");

        assertThat(response.range()).isEqualTo("7d");
        assertThat(response.points()).hasSize(7);
        assertThat(response.newUsers()).isEqualTo(2L);
        assertThat(response.totalUsers()).isEqualTo(12L);
        assertThat(response.points().getLast().cumulativeUsers()).isEqualTo(12L);
    }

    @Test
    void unsupportedRangeReturnsBusinessError() {
        AdminDashboardService service = service();

        assertThatThrownBy(() -> service.getBookingsOverview("12m"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Unsupported dashboard range");
    }

    private AdminDashboardService service() {
        return new AdminDashboardServiceImpl(
                userRepository,
                listingRepository,
                bookingRepository,
                providerProfileRepository,
                settlementRepository
        );
    }
}
