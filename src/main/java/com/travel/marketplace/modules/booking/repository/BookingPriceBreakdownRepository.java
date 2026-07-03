package com.travel.marketplace.modules.booking.repository;

import com.travel.marketplace.modules.booking.entity.BookingPriceBreakdown;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingPriceBreakdownRepository extends JpaRepository<BookingPriceBreakdown, Long> {
    List<BookingPriceBreakdown> findAllByBookingId(Long bookingId);
}
