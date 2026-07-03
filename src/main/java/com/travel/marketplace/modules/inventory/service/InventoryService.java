package com.travel.marketplace.modules.inventory.service;

import com.travel.marketplace.modules.inventory.entity.AvailabilityCalendar;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface InventoryService {
    boolean checkAvailability(Long listingId, Long inventoryId, LocalDate startDate, LocalDate endDate, Integer quantity);
    void reserveInventory(Long listingId, Long inventoryId, LocalDate startDate, LocalDate endDate, Integer quantity);
    void confirmInventory(Long listingId, Long inventoryId, LocalDate startDate, LocalDate endDate, Integer quantity);
    void releaseInventory(Long listingId, Long inventoryId, LocalDate startDate, LocalDate endDate, Integer quantity);
    void releaseConfirmedInventory(Long listingId, Long inventoryId, LocalDate startDate, LocalDate endDate, Integer quantity);
    void updateAvailability(Long listingId, Long inventoryId, LocalDate date, BigDecimal priceOverride, Integer totalCapacity, boolean blocked);
    List<AvailabilityCalendar> getAvailability(Long listingId, Long inventoryId, LocalDate startDate, LocalDate endDate);
}
