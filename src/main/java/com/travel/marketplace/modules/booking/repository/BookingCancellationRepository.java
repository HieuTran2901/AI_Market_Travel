package com.travel.marketplace.modules.booking.repository;

import com.travel.marketplace.modules.booking.entity.BookingCancellation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BookingCancellationRepository extends JpaRepository<BookingCancellation, Long> {
    Optional<BookingCancellation> findByBookingId(Long bookingId);
}
