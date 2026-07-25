package com.travel.marketplace.modules.trip.service;

import com.travel.marketplace.exception.BusinessException;
import com.travel.marketplace.modules.listing.entity.Listing;
import com.travel.marketplace.modules.listing.repository.ListingRepository;
import com.travel.marketplace.modules.trip.dto.TripResponse;
import com.travel.marketplace.modules.trip.entity.Trip;
import com.travel.marketplace.modules.trip.entity.TripActivity;
import com.travel.marketplace.modules.trip.entity.TripDay;
import com.travel.marketplace.modules.trip.enums.TripStatus;
import com.travel.marketplace.modules.trip.repository.TripActivityRepository;
import com.travel.marketplace.modules.trip.repository.TripRepository;
import com.travel.marketplace.modules.user.entity.User;
import com.travel.marketplace.modules.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiTripDraftServiceTest {

    @Mock
    private TripRepository tripRepository;

    @Mock
    private TripActivityRepository tripActivityRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ListingRepository listingRepository;

    @Test
    void getTripLoadsDaysAndActivitiesWithTwoStageQuery() {
        AiTripDraftService service = service();
        User user = user(7L);
        Trip trip = trip(user);
        TripDay dayOne = day(11L, 1, "Arrival");
        TripDay dayTwo = day(12L, 2, "Food and culture");
        trip.setDays(List.of(dayOne, dayTwo));
        Listing listing = Listing.builder().id(22L).slug("cozy-pine-homestay-da-lat").title("Cozy Pine Homestay Da Lat").build();
        TripActivity first = activity(dayOne, 1, "MORNING", "Check in", listing);
        TripActivity second = activity(dayOne, 2, "AFTERNOON", "Explore market", null);
        TripActivity third = activity(dayTwo, 1, "MORNING", "Food walk", null);

        when(userRepository.findByEmail("traveler@example.com")).thenReturn(Optional.of(user));
        when(tripRepository.findDetailWithDaysBySlugAndUserId("da-lat-getaway", 7L)).thenReturn(Optional.of(trip));
        when(tripActivityRepository.findAllByTripDayIds(List.of(11L, 12L))).thenReturn(List.of(first, second, third));

        TripResponse response = service.getTrip("da-lat-getaway", "traveler@example.com");

        assertThat(response.days()).hasSize(2);
        assertThat(response.days()).extracting("dayNumber").containsExactly(1, 2);
        assertThat(response.days().get(0).activities()).extracting("title").containsExactly("Check in", "Explore market");
        assertThat(response.days().get(1).activities()).extracting("title").containsExactly("Food walk");
        assertThat(response.days().get(0).activities().get(0).listingId()).isEqualTo(22L);
        assertThat(response.days().get(0).activities().get(0).listingSlug()).isEqualTo("cozy-pine-homestay-da-lat");
        verify(tripRepository).findDetailWithDaysBySlugAndUserId("da-lat-getaway", 7L);
        verify(tripActivityRepository).findAllByTripDayIds(List.of(11L, 12L));
    }

    @Test
    void getTripWithNoActivitiesReturnsEmptyActivityLists() {
        AiTripDraftService service = service();
        User user = user(7L);
        Trip trip = trip(user);
        TripDay day = day(11L, 1, "Arrival");
        trip.setDays(List.of(day));

        when(userRepository.findByEmail("traveler@example.com")).thenReturn(Optional.of(user));
        when(tripRepository.findDetailWithDaysBySlugAndUserId("da-lat-getaway", 7L)).thenReturn(Optional.of(trip));
        when(tripActivityRepository.findAllByTripDayIds(List.of(11L))).thenReturn(List.of());

        TripResponse response = service.getTrip("da-lat-getaway", "traveler@example.com");

        assertThat(response.days()).hasSize(1);
        assertThat(response.days().get(0).activities()).isEmpty();
    }

    @Test
    void getTripOwnedByAnotherUserIsRejectedBeforeLoadingActivities() {
        AiTripDraftService service = service();
        User user = user(7L);

        when(userRepository.findByEmail("traveler@example.com")).thenReturn(Optional.of(user));
        when(tripRepository.findDetailWithDaysBySlugAndUserId("other-trip", 7L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getTrip("other-trip", "traveler@example.com"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Trip not found");
        verifyNoInteractions(tripActivityRepository);
    }

    private AiTripDraftService service() {
        return new AiTripDraftService(tripRepository, tripActivityRepository, userRepository, listingRepository);
    }

    private User user(Long id) {
        return User.builder()
                .id(id)
                .email("traveler@example.com")
                .password("secret")
                .fullName("Traveler")
                .build();
    }

    private Trip trip(User user) {
        return Trip.builder()
                .id(99L)
                .user(user)
                .slug("da-lat-getaway")
                .title("Da Lat Getaway")
                .destination("Da Lat")
                .durationDays(2)
                .durationNights(1)
                .travelerCount(2)
                .estimatedCost(new BigDecimal("1200000"))
                .currency("VND")
                .status(TripStatus.UPCOMING)
                .build();
    }

    private TripDay day(Long id, int dayNumber, String title) {
        return TripDay.builder()
                .id(id)
                .dayNumber(dayNumber)
                .title(title)
                .summary(title + " summary")
                .build();
    }

    private TripActivity activity(TripDay day, int order, String timeOfDay, String title, Listing listing) {
        return TripActivity.builder()
                .day(day)
                .displayOrder(order)
                .timeOfDay(timeOfDay)
                .title(title)
                .description(title + " description")
                .listing(listing)
                .estimatedCost(new BigDecimal("100000"))
                .build();
    }
}
