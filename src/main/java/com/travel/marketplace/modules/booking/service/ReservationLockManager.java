package com.travel.marketplace.modules.booking.service;

import com.travel.marketplace.modules.booking.entity.Booking;

public interface ReservationLockManager {
    void lock(Booking booking, long ttlMinutes);
    void release(Booking booking);
    void expireLocks();
}
