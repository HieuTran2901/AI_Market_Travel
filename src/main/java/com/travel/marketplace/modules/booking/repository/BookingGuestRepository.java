package com.travel.marketplace.modules.booking.repository;

import com.travel.marketplace.modules.booking.entity.BookingGuest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingGuestRepository extends JpaRepository<BookingGuest, Long> {
    List<BookingGuest> findAllByBookingId(Long bookingId);
}
