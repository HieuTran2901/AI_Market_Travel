package com.travel.marketplace.modules.inventory.repository;

import com.travel.marketplace.modules.inventory.entity.AvailabilityCalendar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AvailabilityCalendarRepository extends JpaRepository<AvailabilityCalendar, Long> {
    List<AvailabilityCalendar> findAllByListingIdAndDateBetween(Long listingId, LocalDate startDate, LocalDate endDate);
    List<AvailabilityCalendar> findAllByListingIdAndInventoryIdAndDateBetween(Long listingId, Long inventoryId, LocalDate startDate, LocalDate endDate);
    Optional<AvailabilityCalendar> findByListingIdAndInventoryIdAndDate(Long listingId, Long inventoryId, LocalDate date);
    Optional<AvailabilityCalendar> findByListingIdAndDate(Long listingId, LocalDate date);
}
