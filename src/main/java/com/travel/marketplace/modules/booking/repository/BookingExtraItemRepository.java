package com.travel.marketplace.modules.booking.repository;

import com.travel.marketplace.modules.booking.entity.BookingExtraItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BookingExtraItemRepository extends JpaRepository<BookingExtraItem, Long> {
}
