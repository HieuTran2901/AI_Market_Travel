-- =============================================================
-- V9: Demo Reviews
-- Database: MySQL 8
-- Purpose: realistic review records for seeded demo listings.
-- =============================================================

SET @demo_customer_id = (SELECT id FROM users WHERE email = 'customer@aitravel.demo' LIMIT 1);

INSERT INTO reviews (listing_id, user_id, booking_id, rating, title, comment, trip_type, status, helpful_count)
SELECT l.id, @demo_customer_id, NULL, 5, 'Beautiful stay and easy booking',
       'The location was excellent, check-in felt smooth, and the marketplace payment status was easy to follow.',
       'COUPLE', 'PUBLISHED', 12
FROM listings l
WHERE l.slug = 'ocean-view-resort-da-nang'
AND @demo_customer_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.listing_id = l.id AND r.user_id = @demo_customer_id AND r.title = 'Beautiful stay and easy booking');

INSERT INTO reviews (listing_id, user_id, booking_id, rating, title, comment, trip_type, status, helpful_count)
SELECT l.id, @demo_customer_id, NULL, 5, 'A memorable local evening',
       'The guide made the lantern streets feel personal, and the pace was relaxed enough for photos and questions.',
       'FAMILY', 'PUBLISHED', 18
FROM listings l
WHERE l.slug = 'hoi-an-lantern-walking-tour'
AND @demo_customer_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.listing_id = l.id AND r.user_id = @demo_customer_id AND r.title = 'A memorable local evening');

INSERT INTO reviews (listing_id, user_id, booking_id, rating, title, comment, trip_type, status, helpful_count)
SELECT l.id, @demo_customer_id, NULL, 4, 'Fresh food and friendly service',
       'The riverside setting was comfortable, the seafood was fresh, and the staff helped us choose good dishes.',
       'FRIENDS', 'PUBLISHED', 7
FROM listings l
WHERE l.slug = 'riverside-seafood-restaurant'
AND @demo_customer_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.listing_id = l.id AND r.user_id = @demo_customer_id AND r.title = 'Fresh food and friendly service');

INSERT INTO reviews (listing_id, user_id, booking_id, rating, title, comment, trip_type, status, helpful_count)
SELECT l.id, @demo_customer_id, NULL, 4, 'Reliable bike for exploring',
       'Pickup was simple, the helmet and phone holder were useful, and the bike handled short city trips well.',
       'SOLO', 'PUBLISHED', 5
FROM listings l
WHERE l.slug = 'da-nang-motorbike-rental'
AND @demo_customer_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.listing_id = l.id AND r.user_id = @demo_customer_id AND r.title = 'Reliable bike for exploring');

INSERT INTO reviews (listing_id, user_id, booking_id, rating, title, comment, trip_type, status, helpful_count)
SELECT l.id, @demo_customer_id, NULL, 5, 'Warm host and delicious recipes',
       'The market visit made the class feel authentic, and the cooking steps were clear even for beginners.',
       'COUPLE', 'PUBLISHED', 21
FROM listings l
WHERE l.slug = 'traditional-vietnamese-cooking-class'
AND @demo_customer_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.listing_id = l.id AND r.user_id = @demo_customer_id AND r.title = 'Warm host and delicious recipes');

UPDATE listings l
JOIN (
  SELECT listing_id, ROUND(AVG(rating), 2) average_rating, COUNT(*) review_count
  FROM reviews
  WHERE status = 'PUBLISHED' AND deleted_at IS NULL
  GROUP BY listing_id
) stats ON stats.listing_id = l.id
SET l.average_rating = stats.average_rating,
    l.review_count = stats.review_count
WHERE l.slug IN (
  'ocean-view-resort-da-nang',
  'hoi-an-lantern-walking-tour',
  'riverside-seafood-restaurant',
  'da-nang-motorbike-rental',
  'traditional-vietnamese-cooking-class'
);
