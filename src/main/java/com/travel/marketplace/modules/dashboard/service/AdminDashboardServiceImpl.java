package com.travel.marketplace.modules.dashboard.service;

import com.travel.marketplace.exception.BusinessException;
import com.travel.marketplace.exception.ErrorCode;
import com.travel.marketplace.modules.booking.entity.Booking;
import com.travel.marketplace.modules.booking.repository.BookingRepository;
import com.travel.marketplace.modules.dashboard.dto.AdminDashboardBookingsOverviewResponse;
import com.travel.marketplace.modules.dashboard.dto.AdminDashboardOverviewResponse;
import com.travel.marketplace.modules.dashboard.dto.AdminDashboardRecentBookingResponse;
import com.travel.marketplace.modules.dashboard.dto.AdminDashboardSystemHealthResponse;
import com.travel.marketplace.modules.dashboard.dto.AdminDashboardUserGrowthResponse;
import com.travel.marketplace.modules.listing.enums.ListingStatus;
import com.travel.marketplace.modules.listing.repository.ListingRepository;
import com.travel.marketplace.modules.payment.enums.SettlementStatus;
import com.travel.marketplace.modules.payment.repository.SettlementRepository;
import com.travel.marketplace.modules.user.repository.ProviderProfileRepository;
import com.travel.marketplace.modules.user.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Date;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
public class AdminDashboardServiceImpl implements AdminDashboardService {

    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final BookingRepository bookingRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final SettlementRepository settlementRepository;

    public AdminDashboardServiceImpl(
            UserRepository userRepository,
            ListingRepository listingRepository,
            BookingRepository bookingRepository,
            ProviderProfileRepository providerProfileRepository,
            SettlementRepository settlementRepository
    ) {
        this.userRepository = userRepository;
        this.listingRepository = listingRepository;
        this.bookingRepository = bookingRepository;
        this.providerProfileRepository = providerProfileRepository;
        this.settlementRepository = settlementRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public AdminDashboardOverviewResponse getOverview() {
        BigDecimal revenue = settlementRepository.sumPlatformFeeByStatus(SettlementStatus.COMPLETED);
        String currency = settlementRepository.findCurrenciesByStatus(SettlementStatus.COMPLETED)
                .stream()
                .findFirst()
                .orElse("VND");

        return new AdminDashboardOverviewResponse(
                userRepository.count(),
                listingRepository.countByStatus(ListingStatus.ACTIVE),
                bookingRepository.count(),
                revenue != null ? revenue : BigDecimal.ZERO,
                currency,
                providerProfileRepository.count(),
                Instant.now()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public AdminDashboardBookingsOverviewResponse getBookingsOverview(String range) {
        RangeWindow window = resolveRange(range);
        Map<LocalDate, Long> counts = toDateCounts(bookingRepository.countBookingsCreatedByDay(window.from(), window.to()));
        List<AdminDashboardBookingsOverviewResponse.Point> points = IntStream.range(0, window.days())
                .mapToObj(offset -> {
                    LocalDate date = window.startDate().plusDays(offset);
                    return new AdminDashboardBookingsOverviewResponse.Point(date.toString(), counts.getOrDefault(date, 0L));
                })
                .toList();

        long total = points.stream().mapToLong(AdminDashboardBookingsOverviewResponse.Point::count).sum();
        long previous = bookingRepository.countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(window.previousFrom(), window.from());

        return new AdminDashboardBookingsOverviewResponse(window.range(), total, percentageChange(total, previous), points);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminDashboardUserGrowthResponse getUserGrowth(String range) {
        RangeWindow window = resolveRange(range);
        Map<LocalDate, Long> counts = toDateCounts(userRepository.countUsersCreatedByDay(window.from(), window.to()));
        java.util.concurrent.atomic.AtomicLong cumulative = new java.util.concurrent.atomic.AtomicLong(userRepository.countByCreatedAtBefore(window.from()));

        List<AdminDashboardUserGrowthResponse.Point> points = IntStream.range(0, window.days())
                .mapToObj(offset -> {
                    LocalDate date = window.startDate().plusDays(offset);
                    long newUsers = counts.getOrDefault(date, 0L);
                    return new UserGrowthAccumulator(date, newUsers);
                })
                .map(accumulator -> {
                    long updated = cumulative.addAndGet(accumulator.newUsers());
                    return new AdminDashboardUserGrowthResponse.Point(accumulator.date().toString(), accumulator.newUsers(), updated);
                })
                .toList();

        long newUsers = points.stream().mapToLong(AdminDashboardUserGrowthResponse.Point::newUsers).sum();
        long previous = userRepository.countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(window.previousFrom(), window.from());
        long totalUsers = userRepository.count();

        return new AdminDashboardUserGrowthResponse(window.range(), totalUsers, newUsers, percentageChange(newUsers, previous), points);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminDashboardSystemHealthResponse getSystemHealth() {
        userRepository.count();
        return new AdminDashboardSystemHealthResponse("UP", "UP", "UNKNOWN", "UNKNOWN", Instant.now());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminDashboardRecentBookingResponse> getRecentBookings(int limit) {
        return bookingRepository.findRecentForAdmin(PageRequest.of(0, Math.min(Math.max(limit, 1), 10)))
                .stream()
                .map(this::toRecentBookingResponse)
                .toList();
    }

    private AdminDashboardRecentBookingResponse toRecentBookingResponse(Booking booking) {
        String customerName = booking.getOrder() != null && booking.getOrder().getUser() != null
                ? booking.getOrder().getUser().getFullName()
                : "Unknown customer";
        String listingTitle = booking.getListing() != null ? booking.getListing().getTitle() : "Unknown listing";
        return new AdminDashboardRecentBookingResponse(
                booking.getId(),
                booking.getBookingNumber(),
                customerName,
                listingTitle,
                booking.getStatus() != null ? booking.getStatus().name() : "UNKNOWN",
                booking.getFinalTotal() != null ? booking.getFinalTotal() : BigDecimal.ZERO,
                "VND",
                booking.getCreatedAt()
        );
    }

    private Map<LocalDate, Long> toDateCounts(List<Object[]> rows) {
        return rows.stream().collect(Collectors.toMap(
                row -> toLocalDate(row[0]),
                row -> ((Number) row[1]).longValue(),
                Long::sum
        ));
    }

    private LocalDate toLocalDate(Object value) {
        if (value instanceof Date date) {
            return date.toLocalDate();
        }
        if (value instanceof java.time.LocalDate date) {
            return date;
        }
        return LocalDate.parse(String.valueOf(value));
    }

    private RangeWindow resolveRange(String range) {
        String normalized = range == null ? "30d" : range.trim().toLowerCase();
        int days = switch (normalized) {
            case "7d" -> 7;
            case "30d" -> 30;
            case "90d" -> 90;
            default -> throw new BusinessException(
                    ErrorCode.BAD_REQUEST,
                    "Unsupported dashboard range. Use 7d, 30d, or 90d.",
                    HttpStatus.BAD_REQUEST
            );
        };
        LocalDate startDate = LocalDate.now(ZoneOffset.UTC).minusDays(days - 1L);
        Instant from = startDate.atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant to = LocalDate.now(ZoneOffset.UTC).plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant previousFrom = startDate.minusDays(days).atStartOfDay().toInstant(ZoneOffset.UTC);
        return new RangeWindow(normalized, days, startDate, from, to, previousFrom);
    }

    private double percentageChange(long current, long previous) {
        if (previous == 0) {
            return current > 0 ? 100.0 : 0.0;
        }
        return BigDecimal.valueOf((current - previous) * 100.0 / previous)
                .setScale(1, RoundingMode.HALF_UP)
                .doubleValue();
    }

    private record RangeWindow(String range, int days, LocalDate startDate, Instant from, Instant to, Instant previousFrom) {
    }

    private record UserGrowthAccumulator(LocalDate date, long newUsers) {
    }
}
