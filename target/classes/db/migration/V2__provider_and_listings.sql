-- =============================================================
-- V2: Provider Profiles & Listings (Phase 2)
-- Author: AI Travel Marketplace Team
-- Database: MySQL 8
-- All tables support soft-delete via deleted_at column
-- Detail entities designed as extensible hubs for Phase 3
-- =============================================================

-- ---------------------------------------------------------------
-- 1. EXTEND provider_profiles (created in V1)
--    Add: description, city, country, phone, website,
--         rejection_reason, deleted_at
--    The verification_status values are expanded to include SUSPENDED
-- ---------------------------------------------------------------
ALTER TABLE provider_profiles
    ADD COLUMN description     TEXT            AFTER business_type,
    ADD COLUMN city            VARCHAR(100)    NOT NULL DEFAULT '' AFTER address,
    ADD COLUMN country         VARCHAR(100)    NOT NULL DEFAULT 'Vietnam' AFTER city,
    ADD COLUMN phone           VARCHAR(20)     AFTER country,
    ADD COLUMN website         VARCHAR(255)    AFTER phone,
    ADD COLUMN rejection_reason TEXT           AFTER verification_status,
    ADD COLUMN deleted_at      DATETIME        NULL AFTER updated_at;

-- ---------------------------------------------------------------
-- 2. LISTINGS — base record for every service offered
-- ---------------------------------------------------------------
CREATE TABLE listings (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    provider_id     BIGINT          NOT NULL,
    category        VARCHAR(20)     NOT NULL COMMENT 'HOTEL|TOUR|RESTAURANT|VEHICLE|EXPERIENCE',
    title           VARCHAR(200)    NOT NULL,
    slug            VARCHAR(220)    NOT NULL,
    short_desc      VARCHAR(500)    NULL,
    description     TEXT            NULL,
    address         TEXT            NOT NULL,
    city            VARCHAR(100)    NOT NULL,
    country         VARCHAR(100)    NOT NULL DEFAULT 'Vietnam',
    latitude        DECIMAL(10,8)   NULL,
    longitude       DECIMAL(11,8)   NULL,
    cover_image_url VARCHAR(500)    NULL,
    base_price      DECIMAL(14,2)   NOT NULL,
    currency        VARCHAR(3)      NOT NULL DEFAULT 'VND',
    status          VARCHAR(20)     NOT NULL DEFAULT 'DRAFT'
                    COMMENT 'DRAFT|PENDING_REVIEW|ACTIVE|INACTIVE|REJECTED|ARCHIVED|SUSPENDED',
    rejection_reason TEXT           NULL,
    view_count      INT             NOT NULL DEFAULT 0,
    average_rating  DECIMAL(3,2)   NULL,
    review_count    INT             NOT NULL DEFAULT 0,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      DATETIME        NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uk_listings_slug (slug),
    INDEX  idx_listings_provider   (provider_id),
    INDEX  idx_listings_category   (category),
    INDEX  idx_listings_status     (status),
    INDEX  idx_listings_city       (city),
    INDEX  idx_listings_deleted    (deleted_at),
    INDEX  idx_listings_price      (base_price),

    CONSTRAINT fk_listing_provider
        FOREIGN KEY (provider_id) REFERENCES provider_profiles (id)
        ON DELETE CASCADE
);

-- ---------------------------------------------------------------
-- 3. HOTEL_DETAILS — hub entity for hotel listings
--    Phase 3 will add: rooms (room_type, capacity, price, amenities)
-- ---------------------------------------------------------------
CREATE TABLE hotel_details (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    listing_id      BIGINT      NOT NULL,
    star_rating     TINYINT     NULL COMMENT '1-5',
    total_rooms     INT         NULL,
    check_in_time   VARCHAR(10) NULL COMMENT 'e.g. 14:00',
    check_out_time  VARCHAR(10) NULL COMMENT 'e.g. 12:00',
    -- Amenity flags (Phase 3 may add detailed amenity table)
    has_pool        TINYINT(1)  NOT NULL DEFAULT 0,
    has_spa         TINYINT(1)  NOT NULL DEFAULT 0,
    has_gym         TINYINT(1)  NOT NULL DEFAULT 0,
    has_restaurant  TINYINT(1)  NOT NULL DEFAULT 0,
    has_free_wifi   TINYINT(1)  NOT NULL DEFAULT 1,
    has_parking     TINYINT(1)  NOT NULL DEFAULT 0,
    pet_friendly    TINYINT(1)  NOT NULL DEFAULT 0,
    -- Phase 3 anchor: rooms table will FK → hotel_details.id
    PRIMARY KEY (id),
    UNIQUE KEY uk_hotel_listing (listing_id),
    CONSTRAINT fk_hotel_listing
        FOREIGN KEY (listing_id) REFERENCES listings (id)
        ON DELETE CASCADE
);

-- ---------------------------------------------------------------
-- 4. TOUR_DETAILS — hub entity for tour listings
--    Phase 3 will add: tour_schedules (departure_date, available_slots)
-- ---------------------------------------------------------------
CREATE TABLE tour_details (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    listing_id      BIGINT          NOT NULL,
    duration_days   INT             NOT NULL DEFAULT 1,
    duration_hours  INT             NULL,
    max_group_size  INT             NULL,
    min_group_size  INT             NOT NULL DEFAULT 1,
    tour_type       VARCHAR(20)     NOT NULL DEFAULT 'GROUP'
                    COMMENT 'GROUP|PRIVATE|SELF_GUIDED',
    meeting_point   VARCHAR(500)    NULL,
    -- Rich text content fields
    includes        TEXT            NULL COMMENT 'What is included in the tour',
    excludes        TEXT            NULL COMMENT 'What is NOT included',
    itinerary       TEXT            NULL COMMENT 'Day-by-day itinerary description',
    -- Phase 3 anchor: tour_schedules table will FK → tour_details.id
    PRIMARY KEY (id),
    UNIQUE KEY uk_tour_listing (listing_id),
    CONSTRAINT fk_tour_listing
        FOREIGN KEY (listing_id) REFERENCES listings (id)
        ON DELETE CASCADE
);

-- ---------------------------------------------------------------
-- 5. RESTAURANT_DETAILS — hub entity for restaurant listings
--    Phase 3 will add: restaurant_tables (table_no, capacity, bookable_slots)
-- ---------------------------------------------------------------
CREATE TABLE restaurant_details (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    listing_id          BIGINT          NOT NULL,
    cuisine_type        VARCHAR(100)    NULL,
    seating_capacity    INT             NULL,
    opening_hours       VARCHAR(500)    NULL COMMENT 'JSON or human-readable hours string',
    price_range         VARCHAR(10)     NULL COMMENT 'BUDGET|MID|PREMIUM|LUXURY',
    -- Service flags
    has_delivery        TINYINT(1)      NOT NULL DEFAULT 0,
    has_dine_in         TINYINT(1)      NOT NULL DEFAULT 1,
    has_takeaway        TINYINT(1)      NOT NULL DEFAULT 0,
    has_reservations    TINYINT(1)      NOT NULL DEFAULT 0,
    halal_certified     TINYINT(1)      NOT NULL DEFAULT 0,
    vegetarian_friendly TINYINT(1)      NOT NULL DEFAULT 0,
    -- Phase 3 anchor: restaurant_tables table will FK → restaurant_details.id
    PRIMARY KEY (id),
    UNIQUE KEY uk_restaurant_listing (listing_id),
    CONSTRAINT fk_restaurant_listing
        FOREIGN KEY (listing_id) REFERENCES listings (id)
        ON DELETE CASCADE
);

-- ---------------------------------------------------------------
-- 6. VEHICLE_DETAILS — hub entity for vehicle rental listings
--    Phase 3 will add: vehicle_availability (available_date, is_booked)
-- ---------------------------------------------------------------
CREATE TABLE vehicle_details (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    listing_id          BIGINT          NOT NULL,
    vehicle_type        VARCHAR(20)     NOT NULL
                        COMMENT 'CAR|MOTORBIKE|BUS|VAN|BOAT|OTHER',
    brand               VARCHAR(100)    NULL,
    model               VARCHAR(100)    NULL,
    manufacture_year    INT             NULL,
    seats               INT             NULL,
    fuel_type           VARCHAR(20)     NULL DEFAULT 'PETROL'
                        COMMENT 'PETROL|DIESEL|ELECTRIC|HYBRID',
    transmission        VARCHAR(20)     NULL DEFAULT 'AUTOMATIC'
                        COMMENT 'AUTOMATIC|MANUAL',
    -- Rental options
    has_driver          TINYINT(1)      NOT NULL DEFAULT 0,
    requires_license    TINYINT(1)      NOT NULL DEFAULT 1,
    min_rental_days     INT             NOT NULL DEFAULT 1,
    -- Phase 3 anchor: vehicle_availability table will FK → vehicle_details.id
    PRIMARY KEY (id),
    UNIQUE KEY uk_vehicle_listing (listing_id),
    CONSTRAINT fk_vehicle_listing
        FOREIGN KEY (listing_id) REFERENCES listings (id)
        ON DELETE CASCADE
);

-- ---------------------------------------------------------------
-- 7. EXPERIENCE_DETAILS — hub entity for local experience listings
--    Phase 3 will add: experience_sessions (session_date, time_slot, available_seats)
-- ---------------------------------------------------------------
CREATE TABLE experience_details (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    listing_id          BIGINT          NOT NULL,
    duration_hours      DECIMAL(5,1)    NULL,
    max_participants    INT             NULL,
    min_participants    INT             NOT NULL DEFAULT 1,
    skill_level         VARCHAR(20)     NOT NULL DEFAULT 'ALL'
                        COMMENT 'BEGINNER|INTERMEDIATE|ADVANCED|ALL',
    -- Content
    includes            TEXT            NULL,
    what_to_bring       TEXT            NULL,
    meeting_point       VARCHAR(500)    NULL,
    -- Phase 3 anchor: experience_sessions table will FK → experience_details.id
    PRIMARY KEY (id),
    UNIQUE KEY uk_experience_listing (listing_id),
    CONSTRAINT fk_experience_listing
        FOREIGN KEY (listing_id) REFERENCES listings (id)
        ON DELETE CASCADE
);

-- ---------------------------------------------------------------
-- 8. LISTING_IMAGES — multiple images per listing (soft delete)
-- ---------------------------------------------------------------
CREATE TABLE listing_images (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    listing_id      BIGINT          NOT NULL,
    image_url       VARCHAR(1000)   NOT NULL,
    storage_key     VARCHAR(500)    NULL COMMENT 'Internal key for deletion (e.g. S3 key)',
    alt_text        VARCHAR(255)    NULL,
    display_order   INT             NOT NULL DEFAULT 0,
    is_primary      TINYINT(1)      NOT NULL DEFAULT 0,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at      DATETIME        NULL,

    PRIMARY KEY (id),
    INDEX idx_images_listing  (listing_id),
    INDEX idx_images_primary  (listing_id, is_primary),
    INDEX idx_images_deleted  (deleted_at),
    CONSTRAINT fk_image_listing
        FOREIGN KEY (listing_id) REFERENCES listings (id)
        ON DELETE CASCADE
);
