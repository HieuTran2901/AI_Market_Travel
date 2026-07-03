package com.travel.marketplace.modules.inventory.service;

import com.travel.marketplace.exception.BadRequestException;
import com.travel.marketplace.exception.ErrorCode;
import com.travel.marketplace.exception.ResourceNotFoundException;
import com.travel.marketplace.modules.inventory.entity.AvailabilityCalendar;
import com.travel.marketplace.modules.inventory.entity.Inventory;
import com.travel.marketplace.modules.inventory.enums.CalendarStatus;
import com.travel.marketplace.modules.inventory.enums.InventoryType;
import com.travel.marketplace.modules.inventory.repository.AvailabilityCalendarRepository;
import com.travel.marketplace.modules.inventory.repository.InventoryRepository;
import com.travel.marketplace.modules.listing.entity.Listing;
import com.travel.marketplace.modules.listing.repository.ListingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryServiceImpl implements InventoryService {

    private final InventoryRepository inventoryRepository;
    private final AvailabilityCalendarRepository availabilityCalendarRepository;
    private final ListingRepository listingRepository;

    private Inventory getOrCreateDefaultInventory(Listing listing, Long inventoryId) {
        if (inventoryId != null) {
            return inventoryRepository.findById(inventoryId)
                    .orElseThrow(() -> new ResourceNotFoundException("Inventory not found with id: " + inventoryId));
        }

        List<Inventory> list = inventoryRepository.findAllByListingId(listing.getId());
        if (!list.isEmpty()) {
            return list.getFirst();
        }

        // Create default general inventory template
        Inventory defaultInv = Inventory.builder()
                .listing(listing)
                .name("Default Capacity")
                .inventoryType(InventoryType.GENERAL)
                .capacity(10) // default capacity
                .priceMultiplier(BigDecimal.ONE)
                .build();
        return inventoryRepository.save(defaultInv);
    }

    private List<LocalDate> getDateRange(LocalDate startDate, LocalDate endDate) {
        List<LocalDate> dates = new ArrayList<>();
        if (startDate == null) {
            dates.add(LocalDate.now());
            return dates;
        }
        if (endDate == null || endDate.isBefore(startDate)) {
            dates.add(startDate);
            return dates;
        }
        LocalDate current = startDate;
        // For hotel nights, check check-in to check-out (excluding check-out day)
        // For other types, it could be inclusive or range. Let's make it exclusive of endDate if it's hotel-like,
        // or just include it. Let's check inclusive of endDate.
        while (!current.isAfter(endDate)) {
            dates.add(current);
            current = current.plusDays(1);
        }
        return dates;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean checkAvailability(Long listingId, Long inventoryId, LocalDate startDate, LocalDate endDate, Integer quantity) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found with id: " + listingId));

        Inventory inventory = getOrCreateDefaultInventory(listing, inventoryId);

        // Validate quantity bounds
        if (inventory.getMinimumQuantity() != null && quantity < inventory.getMinimumQuantity()) {
            throw new BadRequestException("Requested quantity " + quantity + " is less than minimum quantity " + inventory.getMinimumQuantity());
        }
        if (inventory.getMaximumQuantity() != null && quantity > inventory.getMaximumQuantity()) {
            throw new BadRequestException("Requested quantity " + quantity + " exceeds maximum quantity " + inventory.getMaximumQuantity());
        }

        List<LocalDate> dates = getDateRange(startDate, endDate);

        for (LocalDate date : dates) {
            AvailabilityCalendar cal = availabilityCalendarRepository
                    .findByListingIdAndInventoryIdAndDate(listingId, inventory.getId(), date)
                    .orElse(null);

            int totalCapacity = cal != null ? cal.getTotalCapacity() : inventory.getCapacity();
            int booked = cal != null ? cal.getBookedUnits() : 0;
            int reserved = cal != null ? cal.getReservedUnits() : 0;
            int blocked = cal != null ? cal.getBlockedCapacity() : 0;
            String status = cal != null ? cal.getStatus().name() : CalendarStatus.AVAILABLE.name();

            if (CalendarStatus.BLOCKED.name().equals(status) || blocked >= totalCapacity) {
                return false;
            }

            int available = totalCapacity - blocked - booked - reserved;
            if (available < quantity) {
                return false;
            }
        }

        return true;
    }

    @Override
    @Transactional
    public void reserveInventory(Long listingId, Long inventoryId, LocalDate startDate, LocalDate endDate, Integer quantity) {
        if (!checkAvailability(listingId, inventoryId, startDate, endDate, quantity)) {
            throw new BadRequestException("Inventory not available for the requested period.", ErrorCode.BAD_REQUEST);
        }

        Listing listing = listingRepository.findById(listingId).orElseThrow();
        Inventory inventory = getOrCreateDefaultInventory(listing, inventoryId);
        List<LocalDate> dates = getDateRange(startDate, endDate);

        for (LocalDate date : dates) {
            AvailabilityCalendar cal = availabilityCalendarRepository
                    .findByListingIdAndInventoryIdAndDate(listingId, inventory.getId(), date)
                    .orElseGet(() -> AvailabilityCalendar.builder()
                            .listing(listing)
                            .inventory(inventory)
                            .date(date)
                            .totalCapacity(inventory.getCapacity())
                            .status(CalendarStatus.AVAILABLE)
                            .build());

            cal.setReservedUnits(cal.getReservedUnits() + quantity);
            availabilityCalendarRepository.save(cal);
        }
    }

    @Override
    @Transactional
    public void confirmInventory(Long listingId, Long inventoryId, LocalDate startDate, LocalDate endDate, Integer quantity) {
        Listing listing = listingRepository.findById(listingId).orElseThrow();
        Inventory inventory = getOrCreateDefaultInventory(listing, inventoryId);
        List<LocalDate> dates = getDateRange(startDate, endDate);

        for (LocalDate date : dates) {
            AvailabilityCalendar cal = availabilityCalendarRepository
                    .findByListingIdAndInventoryIdAndDate(listingId, inventory.getId(), date)
                    .orElseThrow(() -> new BadRequestException("No availability record found to confirm."));

            cal.setReservedUnits(Math.max(0, cal.getReservedUnits() - quantity));
            cal.setBookedUnits(cal.getBookedUnits() + quantity);
            if (cal.getBookedUnits() + cal.getBlockedCapacity() >= cal.getTotalCapacity()) {
                cal.setStatus(CalendarStatus.SOLD_OUT);
            }
            availabilityCalendarRepository.save(cal);
        }
    }

    @Override
    @Transactional
    public void releaseInventory(Long listingId, Long inventoryId, LocalDate startDate, LocalDate endDate, Integer quantity) {
        Listing listing = listingRepository.findById(listingId).orElseThrow();
        Inventory inventory = getOrCreateDefaultInventory(listing, inventoryId);
        List<LocalDate> dates = getDateRange(startDate, endDate);

        for (LocalDate date : dates) {
            AvailabilityCalendar cal = availabilityCalendarRepository
                    .findByListingIdAndInventoryIdAndDate(listingId, inventory.getId(), date)
                    .orElse(null);

            if (cal != null) {
                cal.setReservedUnits(Math.max(0, cal.getReservedUnits() - quantity));
                if (cal.getBookedUnits() + cal.getBlockedCapacity() < cal.getTotalCapacity()) {
                    cal.setStatus(CalendarStatus.AVAILABLE);
                }
                availabilityCalendarRepository.save(cal);
            }
        }
    }

    @Override
    @Transactional
    public void releaseConfirmedInventory(Long listingId, Long inventoryId, LocalDate startDate, LocalDate endDate, Integer quantity) {
        Listing listing = listingRepository.findById(listingId).orElseThrow();
        Inventory inventory = getOrCreateDefaultInventory(listing, inventoryId);
        List<LocalDate> dates = getDateRange(startDate, endDate);

        for (LocalDate date : dates) {
            AvailabilityCalendar cal = availabilityCalendarRepository
                    .findByListingIdAndInventoryIdAndDate(listingId, inventory.getId(), date)
                    .orElse(null);

            if (cal != null) {
                cal.setBookedUnits(Math.max(0, cal.getBookedUnits() - quantity));
                if (cal.getBookedUnits() + cal.getBlockedCapacity() < cal.getTotalCapacity()) {
                    cal.setStatus(CalendarStatus.AVAILABLE);
                }
                availabilityCalendarRepository.save(cal);
            }
        }
    }

    @Override
    @Transactional
    public void updateAvailability(Long listingId, Long inventoryId, LocalDate date, BigDecimal priceOverride, Integer totalCapacity, boolean blocked) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found with id: " + listingId));
        Inventory inventory = getOrCreateDefaultInventory(listing, inventoryId);

        AvailabilityCalendar cal = availabilityCalendarRepository
                .findByListingIdAndInventoryIdAndDate(listingId, inventory.getId(), date)
                .orElseGet(() -> AvailabilityCalendar.builder()
                        .listing(listing)
                        .inventory(inventory)
                        .date(date)
                        .build());

        if (priceOverride != null) cal.setPrice(priceOverride);
        if (totalCapacity != null) cal.setTotalCapacity(totalCapacity);
        cal.setStatus(blocked ? CalendarStatus.BLOCKED : CalendarStatus.AVAILABLE);

        availabilityCalendarRepository.save(cal);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AvailabilityCalendar> getAvailability(Long listingId, Long inventoryId, LocalDate startDate, LocalDate endDate) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found with id: " + listingId));
        Inventory inventory = getOrCreateDefaultInventory(listing, inventoryId);

        return availabilityCalendarRepository.findAllByListingIdAndInventoryIdAndDateBetween(listingId, inventory.getId(), startDate, endDate);
    }
}
