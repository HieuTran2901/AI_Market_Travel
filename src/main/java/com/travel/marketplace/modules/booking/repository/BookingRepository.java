package com.travel.marketplace.modules.booking.repository;

import com.travel.marketplace.modules.booking.entity.Booking;
import com.travel.marketplace.modules.booking.enums.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    Optional<Booking> findByBookingNumber(String bookingNumber);
    Page<Booking> findAllByOrderUserId(Long userId, Pageable pageable);
    Page<Booking> findAllByListingProviderId(Long providerId, Pageable pageable);
    List<Booking> findAllByStatusAndExpiresAtBefore(BookingStatus status, Instant now);
    Optional<Booking> findByIdAndOrderUserIdAndListingId(Long id, Long userId, Long listingId);

    @Modifying
    @Query("UPDATE Booking b SET b.deletedAt = :now WHERE b.id = :id")
    void softDeleteById(@Param("id") Long id, @Param("now") Instant now);
}
