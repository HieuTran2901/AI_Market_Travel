-- =============================================================
-- V8: Reviews and Ratings
-- Database: MySQL 8
-- Purpose: listing reviews, rating summaries, and moderation
-- =============================================================

CREATE TABLE IF NOT EXISTS reviews (
  id BIGINT NOT NULL AUTO_INCREMENT,
  listing_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  booking_id BIGINT NULL,
  rating INT NOT NULL,
  title VARCHAR(150) NULL,
  comment TEXT NOT NULL,
  trip_type VARCHAR(20) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED',
  helpful_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_reviews_listing FOREIGN KEY (listing_id) REFERENCES listings(id),
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_reviews_booking FOREIGN KEY (booking_id) REFERENCES bookings(id),
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5)
);

CREATE INDEX idx_reviews_listing_status_created ON reviews(listing_id, status, created_at);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_booking ON reviews(booking_id);
CREATE INDEX idx_reviews_status ON reviews(status);

CREATE TABLE IF NOT EXISTS review_replies (
  id BIGINT NOT NULL AUTO_INCREMENT,
  review_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  reply_text TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_review_replies_review FOREIGN KEY (review_id) REFERENCES reviews(id),
  CONSTRAINT fk_review_replies_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_review_replies_review_status ON review_replies(review_id, status);
