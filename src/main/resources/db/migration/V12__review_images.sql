CREATE TABLE IF NOT EXISTS review_images (
  id BIGINT NOT NULL AUTO_INCREMENT,
  review_id BIGINT NOT NULL,
  image_url VARCHAR(1000) NOT NULL,
  alt_text VARCHAR(255) NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_review_images_review FOREIGN KEY (review_id) REFERENCES reviews(id)
);

CREATE INDEX idx_review_images_review ON review_images(review_id, display_order);
