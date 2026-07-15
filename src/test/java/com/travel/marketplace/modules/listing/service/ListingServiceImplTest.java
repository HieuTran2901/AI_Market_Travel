package com.travel.marketplace.modules.listing.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.travel.marketplace.exception.BadRequestException;
import com.travel.marketplace.modules.listing.entity.Listing;
import com.travel.marketplace.modules.booking.repository.BookingRepository;
import com.travel.marketplace.modules.listing.dto.AdminListingStatisticsResponse;
import com.travel.marketplace.modules.listing.enums.ListingCategory;
import com.travel.marketplace.modules.listing.enums.ListingStatus;
import com.travel.marketplace.modules.listing.repository.ExperienceDetailRepository;
import com.travel.marketplace.modules.listing.repository.HotelDetailRepository;
import com.travel.marketplace.modules.listing.repository.ListingImageRepository;
import com.travel.marketplace.modules.listing.repository.ListingRepository;
import com.travel.marketplace.modules.listing.repository.RestaurantDetailRepository;
import com.travel.marketplace.modules.listing.repository.TourDetailRepository;
import com.travel.marketplace.modules.listing.repository.VehicleDetailRepository;
import com.travel.marketplace.modules.listing.dto.ListingMapper;
import com.travel.marketplace.modules.user.repository.ProviderProfileRepository;
import com.travel.marketplace.modules.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ListingServiceImplTest {

    @Mock private ListingRepository listingRepository;
    @Mock private ListingImageRepository listingImageRepository;
    @Mock private HotelDetailRepository hotelDetailRepository;
    @Mock private TourDetailRepository tourDetailRepository;
    @Mock private RestaurantDetailRepository restaurantDetailRepository;
    @Mock private VehicleDetailRepository vehicleDetailRepository;
    @Mock private ExperienceDetailRepository experienceDetailRepository;
    @Mock private UserRepository userRepository;
    @Mock private ProviderProfileRepository providerProfileRepository;
    @Mock private BookingRepository bookingRepository;

    @Test
    void getAdminListingStatisticsReturnsStatusAndCategoryCounts() {
        ListingService service = service();
        when(listingRepository.count()).thenReturn(20L);
        when(listingRepository.countByStatus(ListingStatus.ACTIVE)).thenReturn(15L);
        when(listingRepository.countByStatus(ListingStatus.PENDING_REVIEW)).thenReturn(2L);
        when(listingRepository.countByStatus(ListingStatus.DRAFT)).thenReturn(2L);
        when(listingRepository.countByStatus(ListingStatus.SUSPENDED)).thenReturn(1L);
        when(listingRepository.countByStatus(ListingStatus.REJECTED)).thenReturn(0L);
        when(listingRepository.countByCategory()).thenReturn(List.of(
                new Object[]{ListingCategory.HOTEL, 8L},
                new Object[]{ListingCategory.TOUR, 4L}
        ));

        AdminListingStatisticsResponse stats = service.getAdminListingStatistics();

        assertThat(stats.totalListings()).isEqualTo(20L);
        assertThat(stats.activeListings()).isEqualTo(15L);
        assertThat(stats.pendingListings()).isEqualTo(2L);
        assertThat(stats.draftListings()).isEqualTo(2L);
        assertThat(stats.suspendedListings()).isEqualTo(1L);
        assertThat(stats.rejectedListings()).isZero();
        assertThat(stats.categories()).hasSize(2);
        assertThat(stats.categories().getFirst().category()).isEqualTo("HOTEL");
        assertThat(stats.categories().getFirst().count()).isEqualTo(8L);
        assertThat(stats.categories().getFirst().percentage()).isEqualByComparingTo("40.0");
    }

    @Test
    void getAdminListingStatisticsReturnsZeroCountsAndEmptyCategoriesWhenEmpty() {
        ListingService service = service();
        when(listingRepository.count()).thenReturn(0L);
        when(listingRepository.countByStatus(ListingStatus.ACTIVE)).thenReturn(0L);
        when(listingRepository.countByStatus(ListingStatus.PENDING_REVIEW)).thenReturn(0L);
        when(listingRepository.countByStatus(ListingStatus.DRAFT)).thenReturn(0L);
        when(listingRepository.countByStatus(ListingStatus.SUSPENDED)).thenReturn(0L);
        when(listingRepository.countByStatus(ListingStatus.REJECTED)).thenReturn(0L);
        when(listingRepository.countByCategory()).thenReturn(List.of());

        AdminListingStatisticsResponse stats = service.getAdminListingStatistics();

        assertThat(stats.totalListings()).isZero();
        assertThat(stats.activeListings()).isZero();
        assertThat(stats.pendingListings()).isZero();
        assertThat(stats.draftListings()).isZero();
        assertThat(stats.suspendedListings()).isZero();
        assertThat(stats.rejectedListings()).isZero();
        assertThat(stats.categories()).isNotNull().isEmpty();
    }

    @Test
    void adminRejectListingRequiresPendingStatus() {
        ListingService service = service();
        Listing listing = Listing.builder()
                .id(99L)
                .status(ListingStatus.DRAFT)
                .build();
        when(listingRepository.findById(99L)).thenReturn(Optional.of(listing));

        assertThatThrownBy(() -> service.adminChangeListingStatus(99L, ListingStatus.REJECTED, "Incomplete information"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Only pending listings can be rejected");

        verify(listingRepository, never()).save(listing);
    }

    @Test
    void adminRejectListingRequiresReason() {
        ListingService service = service();
        Listing listing = Listing.builder()
                .id(100L)
                .status(ListingStatus.PENDING_REVIEW)
                .build();
        when(listingRepository.findById(100L)).thenReturn(Optional.of(listing));

        assertThatThrownBy(() -> service.adminChangeListingStatus(100L, ListingStatus.REJECTED, " "))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Rejection reason is required");

        verify(listingRepository, never()).save(listing);
    }

    @Test
    void adminApproveListingRejectsAlreadyActiveListing() {
        ListingService service = service();
        Listing listing = Listing.builder()
                .id(101L)
                .status(ListingStatus.ACTIVE)
                .build();
        when(listingRepository.findById(101L)).thenReturn(Optional.of(listing));

        assertThatThrownBy(() -> service.adminChangeListingStatus(101L, ListingStatus.ACTIVE, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Only pending, suspended, or inactive listings can be activated");

        verify(listingRepository, never()).save(listing);
    }

    private ListingService service() {
        ObjectMapper objectMapper = new ObjectMapper();
        return new ListingServiceImpl(
                listingRepository,
                listingImageRepository,
                hotelDetailRepository,
                tourDetailRepository,
                restaurantDetailRepository,
                vehicleDetailRepository,
                experienceDetailRepository,
                userRepository,
                providerProfileRepository,
                bookingRepository,
                new ListingMapper(objectMapper),
                objectMapper
        );
    }
}
