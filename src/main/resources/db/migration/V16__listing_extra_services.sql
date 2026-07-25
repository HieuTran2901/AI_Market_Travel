CREATE TABLE listing_extra_services (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    listing_id BIGINT NOT NULL,
    name VARCHAR(160) NOT NULL,
    description VARCHAR(500) NULL,
    image_url VARCHAR(500) NULL,
    category VARCHAR(30) NOT NULL,
    price DECIMAL(14, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    pricing_unit VARCHAR(30) NOT NULL,
    active TINYINT(1) NOT NULL DEFAULT 1,
    available_quantity INT NULL,
    max_quantity_per_booking INT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_listing_extra_services_listing
        FOREIGN KEY (listing_id) REFERENCES listings(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_listing_extras_listing_active_category
    ON listing_extra_services(listing_id, active, category, sort_order);

CREATE TABLE cart_item_extras (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cart_item_id BIGINT NOT NULL,
    extra_service_id BIGINT NOT NULL,
    service_name_snapshot VARCHAR(160) NOT NULL,
    unit_price_snapshot DECIMAL(14, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    pricing_unit VARCHAR(30) NOT NULL,
    quantity INT NOT NULL,
    line_total DECIMAL(14, 2) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cart_item_extras_cart_item
        FOREIGN KEY (cart_item_id) REFERENCES cart_items(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_cart_item_extras_service
        FOREIGN KEY (extra_service_id) REFERENCES listing_extra_services(id)
);

CREATE UNIQUE INDEX uk_cart_item_extra_service
    ON cart_item_extras(cart_item_id, extra_service_id);

CREATE TABLE booking_extra_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    extra_service_id BIGINT NOT NULL,
    service_name_snapshot VARCHAR(160) NOT NULL,
    unit_price_snapshot DECIMAL(14, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    pricing_unit VARCHAR(30) NOT NULL,
    quantity INT NOT NULL,
    line_total DECIMAL(14, 2) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_booking_extra_items_booking
        FOREIGN KEY (booking_id) REFERENCES bookings(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_booking_extra_items_service
        FOREIGN KEY (extra_service_id) REFERENCES listing_extra_services(id)
);

CREATE INDEX idx_booking_extra_items_booking
    ON booking_extra_items(booking_id);

INSERT INTO listing_extra_services (
    listing_id, name, description, image_url, category, price, currency, pricing_unit,
    active, available_quantity, max_quantity_per_booking, sort_order
)
SELECT id,
       'Welcome fruit platter',
       'Fresh seasonal fruits prepared for your arrival.',
       cover_image_url,
       'FOOD_DRINK',
       180000.00,
       currency,
       'STAY',
       1,
       NULL,
       3,
       10
FROM listings
WHERE status = 'ACTIVE';

INSERT INTO listing_extra_services (
    listing_id, name, description, image_url, category, price, currency, pricing_unit,
    active, available_quantity, max_quantity_per_booking, sort_order
)
SELECT id,
       'Breakfast in room',
       'A convenient breakfast service added to your booking.',
       cover_image_url,
       'FOOD_DRINK',
       150000.00,
       currency,
       'GUEST',
       1,
       NULL,
       8,
       20
FROM listings
WHERE status = 'ACTIVE'
  AND category IN ('HOTEL', 'EXPERIENCE', 'TOUR');

INSERT INTO listing_extra_services (
    listing_id, name, description, image_url, category, price, currency, pricing_unit,
    active, available_quantity, max_quantity_per_booking, sort_order
)
SELECT id,
       'Airport transfer',
       'Private transfer support for a smoother arrival.',
       cover_image_url,
       'TRANSPORT',
       280000.00,
       currency,
       'RIDE',
       1,
       NULL,
       2,
       30
FROM listings
WHERE status = 'ACTIVE';

INSERT INTO listing_extra_services (
    listing_id, name, description, image_url, category, price, currency, pricing_unit,
    active, available_quantity, max_quantity_per_booking, sort_order
)
SELECT id,
       'Late check-out',
       'Stay a little longer when scheduling allows.',
       cover_image_url,
       'COMFORT',
       200000.00,
       currency,
       'ROOM',
       1,
       NULL,
       1,
       40
FROM listings
WHERE status = 'ACTIVE'
  AND category = 'HOTEL';
