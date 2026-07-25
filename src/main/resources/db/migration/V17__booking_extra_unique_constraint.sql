CREATE UNIQUE INDEX uk_booking_extra_service
    ON booking_extra_items(booking_id, extra_service_id);
