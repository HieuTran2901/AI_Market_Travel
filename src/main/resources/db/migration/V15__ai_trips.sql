CREATE TABLE trips (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    slug VARCHAR(240) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    destination VARCHAR(120) NOT NULL,
    start_date DATE NULL,
    end_date DATE NULL,
    duration_days INT NOT NULL,
    duration_nights INT NOT NULL,
    traveler_count INT NOT NULL,
    budget DECIMAL(14, 2) NULL,
    estimated_cost DECIMAL(14, 2) NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    summary VARCHAR(1000) NULL,
    hero_image_url VARCHAR(500) NULL,
    status VARCHAR(30) NOT NULL,
    created_source VARCHAR(30) NOT NULL,
    ai_draft_id VARCHAR(36) NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_trips_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_trips_user_status ON trips(user_id, status);
CREATE INDEX idx_trips_slug ON trips(slug);

CREATE TABLE trip_days (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    trip_id BIGINT NOT NULL,
    day_number INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    summary VARCHAR(1000) NULL,
    image_url VARCHAR(500) NULL,
    CONSTRAINT fk_trip_days_trip FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
);

CREATE INDEX idx_trip_days_trip ON trip_days(trip_id, day_number);

CREATE TABLE trip_activities (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    trip_day_id BIGINT NOT NULL,
    display_order INT NOT NULL,
    time_of_day VARCHAR(30) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(1000) NULL,
    listing_id BIGINT NULL,
    estimated_cost DECIMAL(14, 2) NULL,
    CONSTRAINT fk_trip_activities_day FOREIGN KEY (trip_day_id) REFERENCES trip_days(id) ON DELETE CASCADE,
    CONSTRAINT fk_trip_activities_listing FOREIGN KEY (listing_id) REFERENCES listings(id)
);

CREATE INDEX idx_trip_activities_day ON trip_activities(trip_day_id, display_order);
