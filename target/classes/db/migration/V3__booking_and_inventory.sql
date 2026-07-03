-- =============================================================
-- V3: Booking & Reservation Engine (Phase 3)
-- Author: AI Travel Marketplace Team
-- Database: MySQL 8
-- =============================================================

-- ---------------------------------------------------------------
-- 1. INVENTORY — capacity definition templates per listing
--    Supports general listings, room types, or reservation slots
-- ---------------------------------------------------------------
CREATE TABLE inventory (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    listing_id          BIGINT          NOT NULL,
    name                VARCHAR(200)    NOT NULL COMMENT 'Default, room type name, or slot description',
    inventory_type      VARCHAR(20)     NOT NULL DEFAULT 'GENERAL' COMMENT 'GENERAL|ROOM_TYPE|SLOT|SCHEDULE',
    capacity            INT             NOT NULL DEFAULT 1 COMMENT 'Default capacity per day/slot',
    minimum_quantity    INT             NULL COMMENT 'Optional minimum booking quantity rule',
    maximum_quantity    INT             NULL COMMENT 'Optional maximum booking quantity rule',
    price_multiplier    DECIMAL(5,2)    NOT NULL DEFAULT 1.00,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at          DATETIME        NULL,

    PRIMARY KEY (id),
    INDEX idx_inventory_listing (listing_id),
    INDEX idx_inventory_deleted (deleted_at),
    CONSTRAINT fk_inventory_listing
        FOREIGN KEY (listing_id) REFERENCES listings (id)
        ON DELETE CASCADE
);

-- ---------------------------------------------------------------
-- 2. AVAILABILITY_CALENDAR — real-time daily stock overrides & state
--    Tracks both booked_units and reserved_units to prevent over-allocation
-- ---------------------------------------------------------------
CREATE TABLE availability_calendar (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    listing_id          BIGINT          NOT NULL,
    inventory_id        BIGINT          NULL COMMENT 'Optional FK to inventory table, allows per-room/per-slot calendar',
    date                DATE            NOT NULL,
    price               DECIMAL(14,2)   NULL COMMENT 'Override default listing/inventory price for this date',
    total_capacity      INT             NOT NULL COMMENT 'Actual capacity for this date (copied/overridden from inventory template)',
    booked_units        INT             NOT NULL DEFAULT 0 COMMENT 'Units fully booked and paid/confirmed',
    reserved_units      INT             NOT NULL DEFAULT 0 COMMENT 'Units currently locked under checkout reservation locks',
    blocked_capacity    INT             NOT NULL DEFAULT 0 COMMENT 'Units blocked manually by provider',
    status              VARCHAR(20)     NOT NULL DEFAULT 'AVAILABLE' COMMENT 'AVAILABLE|BLOCKED|SOLD_OUT',
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uk_avail_cal_date (listing_id, inventory_id, date),
    INDEX idx_avail_cal_listing (listing_id),
    INDEX idx_avail_cal_date (date),
    CONSTRAINT fk_avail_cal_listing
        FOREIGN KEY (listing_id) REFERENCES listings (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_avail_cal_inventory
        FOREIGN KEY (inventory_id) REFERENCES inventory (id)
        ON DELETE CASCADE
);

-- ---------------------------------------------------------------
-- 3. CARTS — user shopping cart header
-- ---------------------------------------------------------------
CREATE TABLE carts (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    user_id             BIGINT          NOT NULL,
    status              VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE|CHECKING_OUT|EXPIRED',
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at          DATETIME        NULL,

    PRIMARY KEY (id),
    INDEX idx_carts_user (user_id),
    INDEX idx_carts_status (status),
    INDEX idx_carts_deleted (deleted_at),
    CONSTRAINT fk_cart_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
);

-- ---------------------------------------------------------------
-- 4. CART_ITEMS — individual selections inside user cart
-- ---------------------------------------------------------------
CREATE TABLE cart_items (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    cart_id             BIGINT          NOT NULL,
    listing_id          BIGINT          NOT NULL,
    inventory_id        BIGINT          NULL COMMENT 'Optional reference to a specific room type or slot',
    quantity            INT             NOT NULL DEFAULT 1,
    start_date          DATE            NULL,
    end_date            DATE            NULL,
    time_slot           VARCHAR(50)     NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_cart_items_cart (cart_id),
    INDEX idx_cart_items_listing (listing_id),
    CONSTRAINT fk_cart_item_cart
        FOREIGN KEY (cart_id) REFERENCES carts (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_cart_item_listing
        FOREIGN KEY (listing_id) REFERENCES listings (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_cart_item_inventory
        FOREIGN KEY (inventory_id) REFERENCES inventory (id)
        ON DELETE CASCADE
);

-- ---------------------------------------------------------------
-- 5. ORDERS — transaction record representing checkout
-- ---------------------------------------------------------------
CREATE TABLE orders (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    user_id             BIGINT          NOT NULL,
    order_number        VARCHAR(50)     NOT NULL,
    status              VARCHAR(20)     NOT NULL COMMENT 'PENDING|PROCESSING|FAILED|CONFIRMED|CANCELLED|COMPLETED',
    subtotal            DECIMAL(14,2)   NOT NULL,
    service_fee         DECIMAL(14,2)   NOT NULL,
    tax                 DECIMAL(14,2)   NOT NULL,
    discount            DECIMAL(14,2)   NOT NULL,
    final_total         DECIMAL(14,2)   NOT NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at          DATETIME        NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uk_orders_number (order_number),
    INDEX idx_orders_user (user_id),
    INDEX idx_orders_status (status),
    INDEX idx_orders_deleted (deleted_at),
    CONSTRAINT fk_order_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
);

-- ---------------------------------------------------------------
-- 6. BOOKINGS — confirmed/reserved bookings linked to an order
--    Holds locks if status = 'RESERVED' with active expires_at
-- ---------------------------------------------------------------
CREATE TABLE bookings (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    order_id            BIGINT          NOT NULL,
    listing_id          BIGINT          NOT NULL,
    inventory_id        BIGINT          NULL,
    booking_number      VARCHAR(50)     NOT NULL,
    status              VARCHAR(20)     NOT NULL COMMENT 'PENDING|RESERVED|CONFIRMED|COMPLETED|CANCELLED|EXPIRED',
    start_date          DATE            NULL,
    end_date            DATE            NULL,
    time_slot           VARCHAR(50)     NULL,
    quantity            INT             NOT NULL DEFAULT 1,
    base_price          DECIMAL(14,2)   NOT NULL COMMENT 'Original base price per unit/night/slot',
    subtotal            DECIMAL(14,2)   NOT NULL COMMENT 'base_price * quantity * duration',
    service_fee         DECIMAL(14,2)   NOT NULL,
    tax                 DECIMAL(14,2)   NOT NULL,
    discount            DECIMAL(14,2)   NOT NULL,
    final_total         DECIMAL(14,2)   NOT NULL,
    expires_at          DATETIME        NULL COMMENT 'Reservation lock expiry time',
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at          DATETIME        NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uk_bookings_number (booking_number),
    INDEX idx_bookings_order (order_id),
    INDEX idx_bookings_listing (listing_id),
    INDEX idx_bookings_status (status),
    INDEX idx_bookings_expires (expires_at),
    INDEX idx_bookings_deleted (deleted_at),
    CONSTRAINT fk_booking_order
        FOREIGN KEY (order_id) REFERENCES orders (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_booking_listing
        FOREIGN KEY (listing_id) REFERENCES listings (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_booking_inventory
        FOREIGN KEY (inventory_id) REFERENCES inventory (id)
        ON DELETE SET NULL
);

-- ---------------------------------------------------------------
-- 7. BOOKING_GUESTS — guest info per booking
-- ---------------------------------------------------------------
CREATE TABLE booking_guests (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    booking_id          BIGINT          NOT NULL,
    name                VARCHAR(150)    NOT NULL,
    email               VARCHAR(150)    NULL,
    phone               VARCHAR(50)     NULL,
    passport            VARCHAR(50)     NULL,
    date_of_birth       DATE            NULL,
    nationality         VARCHAR(100)    NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_booking_guests_booking (booking_id),
    CONSTRAINT fk_booking_guest_booking
        FOREIGN KEY (booking_id) REFERENCES bookings (id)
        ON DELETE CASCADE
);

-- ---------------------------------------------------------------
-- 8. BOOKING_HISTORY — audit logs for status transitions
-- ---------------------------------------------------------------
CREATE TABLE booking_history (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    booking_id          BIGINT          NOT NULL,
    from_status         VARCHAR(20)     NULL,
    to_status           VARCHAR(20)     NOT NULL,
    notes               TEXT            NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_booking_history_booking (booking_id),
    CONSTRAINT fk_booking_history_booking
        FOREIGN KEY (booking_id) REFERENCES bookings (id)
        ON DELETE CASCADE
);

-- ---------------------------------------------------------------
-- 9. BOOKING_PRICE_BREAKDOWNS — granular itemized booking prices
-- ---------------------------------------------------------------
CREATE TABLE booking_price_breakdowns (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    booking_id          BIGINT          NOT NULL,
    item_name           VARCHAR(200)    NOT NULL COMMENT 'e.g. Base Price, Service Fee, Tax, Discount',
    amount              DECIMAL(14,2)   NOT NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_booking_pb_booking (booking_id),
    CONSTRAINT fk_booking_pb_booking
        FOREIGN KEY (booking_id) REFERENCES bookings (id)
        ON DELETE CASCADE
);

-- ---------------------------------------------------------------
-- 10. BOOKING_CANCELLATIONS — cancellation audit record
-- ---------------------------------------------------------------
CREATE TABLE booking_cancellations (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    booking_id          BIGINT          NOT NULL,
    reason              VARCHAR(20)     NOT NULL COMMENT 'CUSTOMER_REQUEST|PROVIDER_CANCELLED|SYSTEM_TIMEOUT|POLICY_VIOLATION',
    comment             TEXT            NULL,
    refund_amount       DECIMAL(14,2)   NOT NULL DEFAULT 0.00,
    requested_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at        DATETIME        NULL,

    PRIMARY KEY (id),
    INDEX idx_booking_cancellations_booking (booking_id),
    CONSTRAINT fk_booking_cancellation_booking
        FOREIGN KEY (booking_id) REFERENCES bookings (id)
        ON DELETE CASCADE
);
