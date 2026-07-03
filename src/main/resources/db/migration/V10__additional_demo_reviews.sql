-- =============================================================
-- V10: Additional Demo Reviews
-- Database: MySQL 8
-- Purpose: richer review density for listing detail UI demos.
-- =============================================================

INSERT INTO reviews (listing_id, user_id, booking_id, rating, title, comment, trip_type, status, helpful_count)
SELECT l.id, u.id, NULL, 5, 'Great base for Da Nang',
       'The room was quiet, beach access was quick, and the staff made arrival simple after a long flight.',
       'FAMILY', 'PUBLISHED', 9
FROM listings l
JOIN users u ON u.email = 'tour@aitravel.demo'
WHERE l.slug = 'ocean-view-resort-da-nang'
AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.listing_id = l.id AND r.user_id = u.id AND r.title = 'Great base for Da Nang');

INSERT INTO reviews (listing_id, user_id, booking_id, rating, title, comment, trip_type, status, helpful_count)
SELECT l.id, u.id, NULL, 4, 'Comfortable and polished',
       'The resort felt professional and clean. Breakfast was easy, and the location worked well for day trips.',
       'BUSINESS', 'PUBLISHED', 6
FROM listings l
JOIN users u ON u.email = 'restaurant@aitravel.demo'
WHERE l.slug = 'ocean-view-resort-da-nang'
AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.listing_id = l.id AND r.user_id = u.id AND r.title = 'Comfortable and polished');

INSERT INTO reviews (listing_id, user_id, booking_id, rating, title, comment, trip_type, status, helpful_count)
SELECT l.id, u.id, NULL, 5, 'Loved the rooftop view',
       'Sunrise from the rooftop was the highlight. Booking and payment updates were clear in the account area.',
       'COUPLE', 'PUBLISHED', 14
FROM listings l
JOIN users u ON u.email = 'experience@aitravel.demo'
WHERE l.slug = 'ocean-view-resort-da-nang'
AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.listing_id = l.id AND r.user_id = u.id AND r.title = 'Loved the rooftop view');

INSERT INTO reviews (listing_id, user_id, booking_id, rating, title, comment, trip_type, status, helpful_count)
SELECT l.id, u.id, NULL, 5, 'Easy, warm, and photogenic',
       'The guide kept the walk relaxed and shared stories that made the old town feel alive.',
       'FRIENDS', 'PUBLISHED', 11
FROM listings l
JOIN users u ON u.email = 'hotel@aitravel.demo'
WHERE l.slug = 'hoi-an-lantern-walking-tour'
AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.listing_id = l.id AND r.user_id = u.id AND r.title = 'Easy, warm, and photogenic');

INSERT INTO reviews (listing_id, user_id, booking_id, rating, title, comment, trip_type, status, helpful_count)
SELECT l.id, u.id, NULL, 4, 'Good pace for families',
       'We had enough time for photos and snacks. The meeting point was easy to find.',
       'FAMILY', 'PUBLISHED', 8
FROM listings l
JOIN users u ON u.email = 'vehicle@aitravel.demo'
WHERE l.slug = 'hoi-an-lantern-walking-tour'
AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.listing_id = l.id AND r.user_id = u.id AND r.title = 'Good pace for families');

INSERT INTO reviews (listing_id, user_id, booking_id, rating, title, comment, trip_type, status, helpful_count)
SELECT l.id, u.id, NULL, 5, 'Clear instruction and delicious food',
       'The host explained every step, and the market visit helped us understand the ingredients before cooking.',
       'SOLO', 'PUBLISHED', 16
FROM listings l
JOIN users u ON u.email = 'tour@aitravel.demo'
WHERE l.slug = 'traditional-vietnamese-cooking-class'
AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.listing_id = l.id AND r.user_id = u.id AND r.title = 'Clear instruction and delicious food');

INSERT INTO reviews (listing_id, user_id, booking_id, rating, title, comment, trip_type, status, helpful_count)
SELECT l.id, u.id, NULL, 5, 'A very welcoming class',
       'Great for beginners. We left with recipes we could actually repeat at home.',
       'COUPLE', 'PUBLISHED', 10
FROM listings l
JOIN users u ON u.email = 'restaurant@aitravel.demo'
WHERE l.slug = 'traditional-vietnamese-cooking-class'
AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.listing_id = l.id AND r.user_id = u.id AND r.title = 'A very welcoming class');

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
  'traditional-vietnamese-cooking-class'
);
