-- =============================================================
-- V7: Demo Seed Data (Phase 7 Stabilization)
-- Database: MySQL 8
-- Purpose: local development marketplace data for homepage, search,
-- listing detail, provider dashboard, AI, and checkout smoke flows.
-- Demo password for all users: Demo@123
-- =============================================================

SET @demo_password = '$2a$10$2C5.HklBipqATNryXYk9auyzGIp/pgu7ZLRGcs41zFRL2XSQYFb72';

-- -------------------------------------------------------------
-- Demo users
-- -------------------------------------------------------------
INSERT INTO users (email, password, full_name, phone_number, avatar_url, is_active)
SELECT 'admin@aitravel.demo', @demo_password, 'Demo Admin', '+84900000001', NULL, 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@aitravel.demo');

INSERT INTO users (email, password, full_name, phone_number, avatar_url, is_active)
SELECT 'customer@aitravel.demo', @demo_password, 'Demo Customer', '+84900000002', NULL, 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'customer@aitravel.demo');

INSERT INTO users (email, password, full_name, phone_number, avatar_url, is_active)
SELECT 'hotel@aitravel.demo', @demo_password, 'Linh Nguyen Hotel Provider', '+84900000003', NULL, 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'hotel@aitravel.demo');

INSERT INTO users (email, password, full_name, phone_number, avatar_url, is_active)
SELECT 'tour@aitravel.demo', @demo_password, 'Minh Tran Tour Provider', '+84900000004', NULL, 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'tour@aitravel.demo');

INSERT INTO users (email, password, full_name, phone_number, avatar_url, is_active)
SELECT 'restaurant@aitravel.demo', @demo_password, 'An Le Restaurant Provider', '+84900000005', NULL, 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'restaurant@aitravel.demo');

INSERT INTO users (email, password, full_name, phone_number, avatar_url, is_active)
SELECT 'vehicle@aitravel.demo', @demo_password, 'Quang Pham Vehicle Provider', '+84900000006', NULL, 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'vehicle@aitravel.demo');

INSERT INTO users (email, password, full_name, phone_number, avatar_url, is_active)
SELECT 'experience@aitravel.demo', @demo_password, 'Mai Hoang Experience Provider', '+84900000007', NULL, 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'experience@aitravel.demo');

INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u JOIN roles r ON r.name = 'ROLE_ADMIN'
WHERE u.email = 'admin@aitravel.demo';

INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u JOIN roles r ON r.name = 'ROLE_CUSTOMER'
WHERE u.email IN (
  'customer@aitravel.demo',
  'hotel@aitravel.demo',
  'tour@aitravel.demo',
  'restaurant@aitravel.demo',
  'vehicle@aitravel.demo',
  'experience@aitravel.demo'
);

INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u JOIN roles r ON r.name = 'ROLE_PROVIDER_HOTEL'
WHERE u.email = 'hotel@aitravel.demo';

INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u JOIN roles r ON r.name = 'ROLE_PROVIDER_TOUR'
WHERE u.email = 'tour@aitravel.demo';

INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u JOIN roles r ON r.name = 'ROLE_PROVIDER_RESTAURANT'
WHERE u.email = 'restaurant@aitravel.demo';

INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u JOIN roles r ON r.name = 'ROLE_PROVIDER_VEHICLE'
WHERE u.email = 'vehicle@aitravel.demo';

INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u JOIN roles r ON r.name = 'ROLE_PROVIDER_EXPERIENCE'
WHERE u.email = 'experience@aitravel.demo';

-- -------------------------------------------------------------
-- Provider profiles
-- -------------------------------------------------------------
INSERT INTO provider_profiles
(user_id, business_name, business_type, description, address, city, country, phone, website, tax_code, bank_name, bank_account_number, bank_account_name, verification_status)
SELECT u.id, 'Blue Coast Hospitality', 'HOTEL',
       'Boutique hotels and homestays across Vietnams most loved destinations.',
       '88 Vo Nguyen Giap, Son Tra', 'Da Nang', 'Vietnam', '+842363900001', 'https://demo.aitravel.local/blue-coast',
       'DEMO-HOTEL-001', 'Vietcombank', '1000000001', 'BLUE COAST HOSPITALITY', 'APPROVED'
FROM users u WHERE u.email = 'hotel@aitravel.demo'
AND NOT EXISTS (SELECT 1 FROM provider_profiles pp WHERE pp.user_id = u.id);

INSERT INTO provider_profiles
(user_id, business_name, business_type, description, address, city, country, phone, website, tax_code, bank_name, bank_account_number, bank_account_name, verification_status)
SELECT u.id, 'Vietnam Trail Experts', 'TOUR',
       'Small-group tours, trekking routes, and curated cultural journeys.',
       '12 Hang Bac, Hoan Kiem', 'Ha Noi', 'Vietnam', '+842439000002', 'https://demo.aitravel.local/trail-experts',
       'DEMO-TOUR-001', 'Techcombank', '1000000002', 'VIETNAM TRAIL EXPERTS', 'APPROVED'
FROM users u WHERE u.email = 'tour@aitravel.demo'
AND NOT EXISTS (SELECT 1 FROM provider_profiles pp WHERE pp.user_id = u.id);

INSERT INTO provider_profiles
(user_id, business_name, business_type, description, address, city, country, phone, website, tax_code, bank_name, bank_account_number, bank_account_name, verification_status)
SELECT u.id, 'Saigon Table Collective', 'RESTAURANT',
       'Local restaurants and food experiences with reservation-ready menus.',
       '45 Nguyen Hue, District 1', 'Ho Chi Minh City', 'Vietnam', '+842839000003', 'https://demo.aitravel.local/saigon-table',
       'DEMO-REST-001', 'ACB', '1000000003', 'SAIGON TABLE COLLECTIVE', 'APPROVED'
FROM users u WHERE u.email = 'restaurant@aitravel.demo'
AND NOT EXISTS (SELECT 1 FROM provider_profiles pp WHERE pp.user_id = u.id);

INSERT INTO provider_profiles
(user_id, business_name, business_type, description, address, city, country, phone, website, tax_code, bank_name, bank_account_number, bank_account_name, verification_status)
SELECT u.id, 'Go Vietnam Rentals', 'VEHICLE',
       'Reliable cars, motorbikes, vans, and private transfers for flexible trips.',
       '22 Tran Phu', 'Nha Trang', 'Vietnam', '+842583900004', 'https://demo.aitravel.local/go-vietnam',
       'DEMO-VEHICLE-001', 'MB Bank', '1000000004', 'GO VIETNAM RENTALS', 'APPROVED'
FROM users u WHERE u.email = 'vehicle@aitravel.demo'
AND NOT EXISTS (SELECT 1 FROM provider_profiles pp WHERE pp.user_id = u.id);

INSERT INTO provider_profiles
(user_id, business_name, business_type, description, address, city, country, phone, website, tax_code, bank_name, bank_account_number, bank_account_name, verification_status)
SELECT u.id, 'Local Craft Vietnam', 'EXPERIENCE',
       'Hands-on cooking, coffee, craft, and community-led local experiences.',
       '19 Nguyen Thai Hoc', 'Hoi An', 'Vietnam', '+842353900005', 'https://demo.aitravel.local/local-craft',
       'DEMO-EXP-001', 'VPBank', '1000000005', 'LOCAL CRAFT VIETNAM', 'APPROVED'
FROM users u WHERE u.email = 'experience@aitravel.demo'
AND NOT EXISTS (SELECT 1 FROM provider_profiles pp WHERE pp.user_id = u.id);

-- -------------------------------------------------------------
-- Listings: 5 hotels, 4 tours, 4 restaurants, 3 vehicles, 4 experiences
-- -------------------------------------------------------------
INSERT INTO listings (provider_id, category, title, slug, short_desc, description, address, city, country, latitude, longitude, cover_image_url, base_price, currency, status, view_count, average_rating, review_count)
SELECT pp.id, 'HOTEL', 'Ocean View Resort Da Nang', 'ocean-view-resort-da-nang',
       'Beachfront resort steps from My Khe beach.',
       'Wake up to sunrise over My Khe beach, enjoy a rooftop pool, spa treatments, and easy access to Son Tra and Hoi An day trips.',
       '120 Vo Nguyen Giap, My Khe', 'Da Nang', 'Vietnam', 16.06120000, 108.24690000, '/demo-images/hotel.svg', 1850000, 'VND', 'ACTIVE', 1280, 4.80, 246
FROM provider_profiles pp JOIN users u ON u.id = pp.user_id WHERE u.email = 'hotel@aitravel.demo'
AND NOT EXISTS (SELECT 1 FROM listings WHERE slug = 'ocean-view-resort-da-nang');

INSERT INTO listings (provider_id, category, title, slug, short_desc, description, address, city, country, latitude, longitude, cover_image_url, base_price, currency, status, view_count, average_rating, review_count)
SELECT pp.id, 'HOTEL', 'Cozy Pine Homestay Da Lat', 'cozy-pine-homestay-da-lat',
       'Quiet pine forest homestay with warm interiors.',
       'A peaceful Da Lat retreat with garden breakfast, pine valley views, and cozy rooms made for slow mornings.',
       '34 Trieu Viet Vuong', 'Da Lat', 'Vietnam', 11.92530000, 108.43740000, '/demo-images/hotel.svg', 820000, 'VND', 'ACTIVE', 920, 4.70, 184
FROM provider_profiles pp JOIN users u ON u.id = pp.user_id WHERE u.email = 'hotel@aitravel.demo'
AND NOT EXISTS (SELECT 1 FROM listings WHERE slug = 'cozy-pine-homestay-da-lat');

INSERT INTO listings (provider_id, category, title, slug, short_desc, description, address, city, country, latitude, longitude, cover_image_url, base_price, currency, status, view_count, average_rating, review_count)
SELECT pp.id, 'HOTEL', 'Old Quarter Boutique Stay Ha Noi', 'old-quarter-boutique-stay-ha-noi',
       'Elegant boutique stay in the heart of the Old Quarter.',
       'A stylish base near Hoan Kiem Lake with local design, quiet rooms, and walking access to street food and heritage lanes.',
       '9 Hang Gai, Hoan Kiem', 'Ha Noi', 'Vietnam', 21.03140000, 105.85020000, '/demo-images/hotel.svg', 1250000, 'VND', 'ACTIVE', 1110, 4.60, 203
FROM provider_profiles pp JOIN users u ON u.id = pp.user_id WHERE u.email = 'hotel@aitravel.demo'
AND NOT EXISTS (SELECT 1 FROM listings WHERE slug = 'old-quarter-boutique-stay-ha-noi');

INSERT INTO listings (provider_id, category, title, slug, short_desc, description, address, city, country, latitude, longitude, cover_image_url, base_price, currency, status, view_count, average_rating, review_count)
SELECT pp.id, 'HOTEL', 'Riverside Heritage Villa Hoi An', 'riverside-heritage-villa-hoi-an',
       'Riverside villa close to lantern-lit Ancient Town.',
       'Relax by the Thu Bon River with bicycles, garden rooms, and easy evenings in Hoi Ans lantern streets.',
       '52 Bach Dang', 'Hoi An', 'Vietnam', 15.87690000, 108.32670000, '/demo-images/hotel.svg', 1380000, 'VND', 'ACTIVE', 780, 4.75, 132
FROM provider_profiles pp JOIN users u ON u.id = pp.user_id WHERE u.email = 'hotel@aitravel.demo'
AND NOT EXISTS (SELECT 1 FROM listings WHERE slug = 'riverside-heritage-villa-hoi-an');

INSERT INTO listings (provider_id, category, title, slug, short_desc, description, address, city, country, latitude, longitude, cover_image_url, base_price, currency, status, view_count, average_rating, review_count)
SELECT pp.id, 'HOTEL', 'Phu Quoc Garden Bungalow', 'phu-quoc-garden-bungalow',
       'Garden bungalows near Long Beach.',
       'A tropical island stay with shaded paths, fresh breakfast, and sunset beach access within minutes.',
       'Duong Bao, Duong To', 'Phu Quoc', 'Vietnam', 10.15370000, 103.98400000, '/demo-images/hotel.svg', 1650000, 'VND', 'ACTIVE', 690, 4.55, 98
FROM provider_profiles pp JOIN users u ON u.id = pp.user_id WHERE u.email = 'hotel@aitravel.demo'
AND NOT EXISTS (SELECT 1 FROM listings WHERE slug = 'phu-quoc-garden-bungalow');

INSERT INTO listings (provider_id, category, title, slug, short_desc, description, address, city, country, latitude, longitude, cover_image_url, base_price, currency, status, view_count, average_rating, review_count)
SELECT pp.id, 'TOUR', 'Hoi An Lantern Walking Tour', 'hoi-an-lantern-walking-tour',
       'Evening walk through lantern streets and riverside markets.',
       'Join a local guide for hidden alleys, heritage houses, lantern stories, and a gentle riverside tasting stop.',
       'Japanese Covered Bridge', 'Hoi An', 'Vietnam', 15.87710000, 108.32660000, '/demo-images/tour.svg', 450000, 'VND', 'ACTIVE', 1450, 4.90, 315
FROM provider_profiles pp JOIN users u ON u.id = pp.user_id WHERE u.email = 'tour@aitravel.demo'
AND NOT EXISTS (SELECT 1 FROM listings WHERE slug = 'hoi-an-lantern-walking-tour');

INSERT INTO listings (provider_id, category, title, slug, short_desc, description, address, city, country, latitude, longitude, cover_image_url, base_price, currency, status, view_count, average_rating, review_count)
SELECT pp.id, 'TOUR', 'Sapa Trekking Experience', 'sapa-trekking-experience',
       'Mountain trek through rice terraces and minority villages.',
       'A guided Sapa route with terrace viewpoints, village lunch, and cultural storytelling from local hosts.',
       'Sapa Stone Church', 'Sapa', 'Vietnam', 22.33500000, 103.84380000, '/demo-images/tour.svg', 950000, 'VND', 'ACTIVE', 1720, 4.85, 276
FROM provider_profiles pp JOIN users u ON u.id = pp.user_id WHERE u.email = 'tour@aitravel.demo'
AND NOT EXISTS (SELECT 1 FROM listings WHERE slug = 'sapa-trekking-experience');

INSERT INTO listings (provider_id, category, title, slug, short_desc, description, address, city, country, latitude, longitude, cover_image_url, base_price, currency, status, view_count, average_rating, review_count)
SELECT pp.id, 'TOUR', 'Phu Quoc Sunset Boat Tour', 'phu-quoc-sunset-boat-tour',
       'Island sunset cruise with snorkeling and seafood bites.',
       'Cruise to calm coves, snorkel in clear water, and watch the sun fall over the Gulf of Thailand.',
       'An Thoi Marina', 'Phu Quoc', 'Vietnam', 10.02810000, 104.01590000, '/demo-images/tour.svg', 780000, 'VND', 'ACTIVE', 1190, 4.65, 154
FROM provider_profiles pp JOIN users u ON u.id = pp.user_id WHERE u.email = 'tour@aitravel.demo'
AND NOT EXISTS (SELECT 1 FROM listings WHERE slug = 'phu-quoc-sunset-boat-tour');

INSERT INTO listings (provider_id, category, title, slug, short_desc, description, address, city, country, latitude, longitude, cover_image_url, base_price, currency, status, view_count, average_rating, review_count)
SELECT pp.id, 'TOUR', 'Cu Chi Tunnels Half-Day Tour', 'cu-chi-tunnels-half-day-tour',
       'Historical half-day tour from Ho Chi Minh City.',
       'Explore the Cu Chi tunnel network with a guide, context-rich storytelling, and comfortable round-trip transport.',
       'Ben Dinh Tunnels', 'Ho Chi Minh City', 'Vietnam', 11.14190000, 106.46250000, '/demo-images/tour.svg', 620000, 'VND', 'ACTIVE', 1030, 4.50, 121
FROM provider_profiles pp JOIN users u ON u.id = pp.user_id WHERE u.email = 'tour@aitravel.demo'
AND NOT EXISTS (SELECT 1 FROM listings WHERE slug = 'cu-chi-tunnels-half-day-tour');

INSERT INTO listings (provider_id, category, title, slug, short_desc, description, address, city, country, latitude, longitude, cover_image_url, base_price, currency, status, view_count, average_rating, review_count)
SELECT pp.id, 'RESTAURANT', 'Riverside Seafood Restaurant', 'riverside-seafood-restaurant',
       'Fresh seafood by the river with sunset tables.',
       'Seasonal seafood, Vietnamese sauces, and relaxed riverside seating for families, couples, and groups.',
       '18 Tran Hung Dao', 'Da Nang', 'Vietnam', 16.07050000, 108.22470000, '/demo-images/restaurant.svg', 350000, 'VND', 'ACTIVE', 880, 4.55, 167
FROM provider_profiles pp JOIN users u ON u.id = pp.user_id WHERE u.email = 'restaurant@aitravel.demo'
AND NOT EXISTS (SELECT 1 FROM listings WHERE slug = 'riverside-seafood-restaurant');

INSERT INTO listings (provider_id, category, title, slug, short_desc, description, address, city, country, latitude, longitude, cover_image_url, base_price, currency, status, view_count, average_rating, review_count)
SELECT pp.id, 'RESTAURANT', 'Old Quarter Pho Tasting Table', 'old-quarter-pho-tasting-table',
       'A curated tasting of northern pho styles.',
       'Taste beef, chicken, and regional noodle variations with a host who explains broth, herbs, and local dining customs.',
       '27 Bat Dan', 'Ha Noi', 'Vietnam', 21.03400000, 105.84680000, '/demo-images/restaurant.svg', 220000, 'VND', 'ACTIVE', 1340, 4.80, 220
FROM provider_profiles pp JOIN users u ON u.id = pp.user_id WHERE u.email = 'restaurant@aitravel.demo'
AND NOT EXISTS (SELECT 1 FROM listings WHERE slug = 'old-quarter-pho-tasting-table');

INSERT INTO listings (provider_id, category, title, slug, short_desc, description, address, city, country, latitude, longitude, cover_image_url, base_price, currency, status, view_count, average_rating, review_count)
SELECT pp.id, 'RESTAURANT', 'Da Lat Garden Brunch', 'da-lat-garden-brunch',
       'Farm-to-table brunch in a greenhouse garden.',
       'Enjoy Da Lat vegetables, local cheese, coffee, and pastries in a breezy garden setting.',
       '6 Hoang Hoa Tham', 'Da Lat', 'Vietnam', 11.94850000, 108.45890000, '/demo-images/restaurant.svg', 280000, 'VND', 'ACTIVE', 760, 4.60, 96
FROM provider_profiles pp JOIN users u ON u.id = pp.user_id WHERE u.email = 'restaurant@aitravel.demo'
AND NOT EXISTS (SELECT 1 FROM listings WHERE slug = 'da-lat-garden-brunch');

INSERT INTO listings (provider_id, category, title, slug, short_desc, description, address, city, country, latitude, longitude, cover_image_url, base_price, currency, status, view_count, average_rating, review_count)
SELECT pp.id, 'RESTAURANT', 'Hoi An Vegan Heritage Kitchen', 'hoi-an-vegan-heritage-kitchen',
       'Plant-forward Vietnamese classics in Ancient Town.',
       'A colorful plant-based kitchen serving cao lau, fresh rolls, herbal drinks, and market-inspired specials.',
       '15 Nguyen Thai Hoc', 'Hoi An', 'Vietnam', 15.87760000, 108.32820000, '/demo-images/restaurant.svg', 260000, 'VND', 'ACTIVE', 830, 4.70, 143
FROM provider_profiles pp JOIN users u ON u.id = pp.user_id WHERE u.email = 'restaurant@aitravel.demo'
AND NOT EXISTS (SELECT 1 FROM listings WHERE slug = 'hoi-an-vegan-heritage-kitchen');

INSERT INTO listings (provider_id, category, title, slug, short_desc, description, address, city, country, latitude, longitude, cover_image_url, base_price, currency, status, view_count, average_rating, review_count)
SELECT pp.id, 'VEHICLE', 'Da Nang Motorbike Rental', 'da-nang-motorbike-rental',
       'Reliable scooters for beach and city exploring.',
       'Daily motorbike rental with helmets, phone holder, roadside support, and easy hotel delivery.',
       '5 Nguyen Van Thoai', 'Da Nang', 'Vietnam', 16.05330000, 108.24410000, '/demo-images/vehicle.svg', 180000, 'VND', 'ACTIVE', 980, 4.50, 118
FROM provider_profiles pp JOIN users u ON u.id = pp.user_id WHERE u.email = 'vehicle@aitravel.demo'
AND NOT EXISTS (SELECT 1 FROM listings WHERE slug = 'da-nang-motorbike-rental');

INSERT INTO listings (provider_id, category, title, slug, short_desc, description, address, city, country, latitude, longitude, cover_image_url, base_price, currency, status, view_count, average_rating, review_count)
SELECT pp.id, 'VEHICLE', 'Nha Trang Private Car with Driver', 'nha-trang-private-car-with-driver',
       'Comfortable private car and driver for coastal trips.',
       'Door-to-door car service for airport transfers, island piers, and day trips around Nha Trang.',
       '22 Tran Phu', 'Nha Trang', 'Vietnam', 12.23880000, 109.19670000, '/demo-images/vehicle.svg', 950000, 'VND', 'ACTIVE', 640, 4.65, 81
FROM provider_profiles pp JOIN users u ON u.id = pp.user_id WHERE u.email = 'vehicle@aitravel.demo'
AND NOT EXISTS (SELECT 1 FROM listings WHERE slug = 'nha-trang-private-car-with-driver');

INSERT INTO listings (provider_id, category, title, slug, short_desc, description, address, city, country, latitude, longitude, cover_image_url, base_price, currency, status, view_count, average_rating, review_count)
SELECT pp.id, 'VEHICLE', 'Phu Quoc Airport Transfer Van', 'phu-quoc-airport-transfer-van',
       'Spacious van transfer for families and groups.',
       'Pre-booked van transfers between Phu Quoc airport, resorts, and ferry points with luggage space.',
       'Phu Quoc International Airport', 'Phu Quoc', 'Vietnam', 10.16980000, 103.99310000, '/demo-images/vehicle.svg', 650000, 'VND', 'ACTIVE', 510, 4.45, 64
FROM provider_profiles pp JOIN users u ON u.id = pp.user_id WHERE u.email = 'vehicle@aitravel.demo'
AND NOT EXISTS (SELECT 1 FROM listings WHERE slug = 'phu-quoc-airport-transfer-van');

INSERT INTO listings (provider_id, category, title, slug, short_desc, description, address, city, country, latitude, longitude, cover_image_url, base_price, currency, status, view_count, average_rating, review_count)
SELECT pp.id, 'EXPERIENCE', 'Traditional Vietnamese Cooking Class', 'traditional-vietnamese-cooking-class',
       'Market visit and hands-on Vietnamese cooking class.',
       'Shop for herbs and produce, learn family recipes, and cook a multi-course Vietnamese meal with a local host.',
       '30 Tran Phu', 'Hoi An', 'Vietnam', 15.87800000, 108.32940000, '/demo-images/experience.svg', 690000, 'VND', 'ACTIVE', 1580, 4.92, 341
FROM provider_profiles pp JOIN users u ON u.id = pp.user_id WHERE u.email = 'experience@aitravel.demo'
AND NOT EXISTS (SELECT 1 FROM listings WHERE slug = 'traditional-vietnamese-cooking-class');

INSERT INTO listings (provider_id, category, title, slug, short_desc, description, address, city, country, latitude, longitude, cover_image_url, base_price, currency, status, view_count, average_rating, review_count)
SELECT pp.id, 'EXPERIENCE', 'Hidden Coffee Tour Da Lat', 'hidden-coffee-tour-da-lat',
       'Coffee farm visit and specialty cafe trail.',
       'Meet growers, taste robusta and arabica, and discover tucked-away cafes around Da Lat.',
       '7 Tran Hung Dao', 'Da Lat', 'Vietnam', 11.94040000, 108.45520000, '/demo-images/experience.svg', 420000, 'VND', 'ACTIVE', 1160, 4.78, 208
FROM provider_profiles pp JOIN users u ON u.id = pp.user_id WHERE u.email = 'experience@aitravel.demo'
AND NOT EXISTS (SELECT 1 FROM listings WHERE slug = 'hidden-coffee-tour-da-lat');

INSERT INTO listings (provider_id, category, title, slug, short_desc, description, address, city, country, latitude, longitude, cover_image_url, base_price, currency, status, view_count, average_rating, review_count)
SELECT pp.id, 'EXPERIENCE', 'Hoi An Lantern Making Workshop', 'hoi-an-lantern-making-workshop',
       'Craft your own silk lantern with local artisans.',
       'Learn the story of Hoi An lanterns and make a foldable silk lantern to take home.',
       '21 Le Loi', 'Hoi An', 'Vietnam', 15.87790000, 108.32710000, '/demo-images/experience.svg', 360000, 'VND', 'ACTIVE', 970, 4.82, 175
FROM provider_profiles pp JOIN users u ON u.id = pp.user_id WHERE u.email = 'experience@aitravel.demo'
AND NOT EXISTS (SELECT 1 FROM listings WHERE slug = 'hoi-an-lantern-making-workshop');

INSERT INTO listings (provider_id, category, title, slug, short_desc, description, address, city, country, latitude, longitude, cover_image_url, base_price, currency, status, view_count, average_rating, review_count)
SELECT pp.id, 'EXPERIENCE', 'Mekong Delta Cycling Morning', 'mekong-delta-cycling-morning',
       'Gentle cycling through orchards and riverside lanes.',
       'Ride quiet village paths, visit a fruit garden, and enjoy a local snack stop with a community host.',
       'Cai Be Pier', 'Ho Chi Minh City', 'Vietnam', 10.33430000, 106.02940000, '/demo-images/experience.svg', 540000, 'VND', 'ACTIVE', 720, 4.58, 89
FROM provider_profiles pp JOIN users u ON u.id = pp.user_id WHERE u.email = 'experience@aitravel.demo'
AND NOT EXISTS (SELECT 1 FROM listings WHERE slug = 'mekong-delta-cycling-morning');

-- -------------------------------------------------------------
-- Category details
-- -------------------------------------------------------------
INSERT INTO hotel_details (listing_id, star_rating, total_rooms, check_in_time, check_out_time, has_pool, has_spa, has_gym, has_restaurant, has_free_wifi, has_parking, pet_friendly)
SELECT id, 5, 120, '14:00', '12:00', 1, 1, 1, 1, 1, 1, 0 FROM listings WHERE slug = 'ocean-view-resort-da-nang'
ON DUPLICATE KEY UPDATE star_rating = VALUES(star_rating);
INSERT INTO hotel_details (listing_id, star_rating, total_rooms, check_in_time, check_out_time, has_pool, has_spa, has_gym, has_restaurant, has_free_wifi, has_parking, pet_friendly)
SELECT id, 3, 18, '14:00', '11:30', 0, 0, 0, 0, 1, 1, 1 FROM listings WHERE slug = 'cozy-pine-homestay-da-lat'
ON DUPLICATE KEY UPDATE star_rating = VALUES(star_rating);
INSERT INTO hotel_details (listing_id, star_rating, total_rooms, check_in_time, check_out_time, has_pool, has_spa, has_gym, has_restaurant, has_free_wifi, has_parking, pet_friendly)
SELECT id, 4, 42, '14:00', '12:00', 0, 1, 0, 1, 1, 0, 0 FROM listings WHERE slug = 'old-quarter-boutique-stay-ha-noi'
ON DUPLICATE KEY UPDATE star_rating = VALUES(star_rating);
INSERT INTO hotel_details (listing_id, star_rating, total_rooms, check_in_time, check_out_time, has_pool, has_spa, has_gym, has_restaurant, has_free_wifi, has_parking, pet_friendly)
SELECT id, 4, 36, '14:00', '12:00', 1, 0, 0, 1, 1, 1, 0 FROM listings WHERE slug = 'riverside-heritage-villa-hoi-an'
ON DUPLICATE KEY UPDATE star_rating = VALUES(star_rating);
INSERT INTO hotel_details (listing_id, star_rating, total_rooms, check_in_time, check_out_time, has_pool, has_spa, has_gym, has_restaurant, has_free_wifi, has_parking, pet_friendly)
SELECT id, 4, 28, '14:00', '12:00', 1, 1, 0, 1, 1, 1, 0 FROM listings WHERE slug = 'phu-quoc-garden-bungalow'
ON DUPLICATE KEY UPDATE star_rating = VALUES(star_rating);

INSERT INTO tour_details (listing_id, duration_days, duration_hours, max_group_size, min_group_size, tour_type, meeting_point, includes, excludes, itinerary)
SELECT id, 1, 3, 12, 2, 'GROUP', 'Japanese Covered Bridge, Hoi An', 'Local guide, tastings, lantern story stops', 'Personal expenses, hotel pickup', 'Old town lanes, heritage houses, lantern streets, river photo stop' FROM listings WHERE slug = 'hoi-an-lantern-walking-tour'
ON DUPLICATE KEY UPDATE duration_hours = VALUES(duration_hours);
INSERT INTO tour_details (listing_id, duration_days, duration_hours, max_group_size, min_group_size, tour_type, meeting_point, includes, excludes, itinerary)
SELECT id, 1, 7, 10, 2, 'GROUP', 'Sapa Stone Church', 'Guide, village lunch, trekking route support', 'Tips, personal trekking gear', 'Rice terraces, village paths, viewpoint lunch, cultural visit' FROM listings WHERE slug = 'sapa-trekking-experience'
ON DUPLICATE KEY UPDATE duration_hours = VALUES(duration_hours);
INSERT INTO tour_details (listing_id, duration_days, duration_hours, max_group_size, min_group_size, tour_type, meeting_point, includes, excludes, itinerary)
SELECT id, 1, 5, 18, 4, 'GROUP', 'An Thoi Marina', 'Boat, snorkeling gear, light seafood snacks', 'Alcohol, hotel pickup outside Duong Dong', 'Marina check-in, snorkeling cove, sunset cruise' FROM listings WHERE slug = 'phu-quoc-sunset-boat-tour'
ON DUPLICATE KEY UPDATE duration_hours = VALUES(duration_hours);
INSERT INTO tour_details (listing_id, duration_days, duration_hours, max_group_size, min_group_size, tour_type, meeting_point, includes, excludes, itinerary)
SELECT id, 1, 5, 16, 2, 'GROUP', 'District 1 hotel pickup zone', 'Guide, entrance ticket, round-trip vehicle', 'Meals, personal expenses', 'City pickup, Cu Chi tunnel visit, documentary stop, return transfer' FROM listings WHERE slug = 'cu-chi-tunnels-half-day-tour'
ON DUPLICATE KEY UPDATE duration_hours = VALUES(duration_hours);

INSERT INTO restaurant_details (listing_id, cuisine_type, seating_capacity, opening_hours, price_range, has_delivery, has_dine_in, has_takeaway, has_reservations, vegetarian_friendly)
SELECT id, 'Vietnamese seafood', 90, 'Daily 10:00-22:30', 'PREMIUM', 0, 1, 1, 1, 1 FROM listings WHERE slug = 'riverside-seafood-restaurant'
ON DUPLICATE KEY UPDATE cuisine_type = VALUES(cuisine_type);
INSERT INTO restaurant_details (listing_id, cuisine_type, seating_capacity, opening_hours, price_range, has_delivery, has_dine_in, has_takeaway, has_reservations, vegetarian_friendly)
SELECT id, 'Northern Vietnamese', 40, 'Daily 06:00-14:00', 'MID', 1, 1, 1, 1, 0 FROM listings WHERE slug = 'old-quarter-pho-tasting-table'
ON DUPLICATE KEY UPDATE cuisine_type = VALUES(cuisine_type);
INSERT INTO restaurant_details (listing_id, cuisine_type, seating_capacity, opening_hours, price_range, has_delivery, has_dine_in, has_takeaway, has_reservations, vegetarian_friendly)
SELECT id, 'Farm-to-table brunch', 56, 'Daily 08:00-15:00', 'MID', 0, 1, 1, 1, 1 FROM listings WHERE slug = 'da-lat-garden-brunch'
ON DUPLICATE KEY UPDATE cuisine_type = VALUES(cuisine_type);
INSERT INTO restaurant_details (listing_id, cuisine_type, seating_capacity, opening_hours, price_range, has_delivery, has_dine_in, has_takeaway, has_reservations, vegetarian_friendly)
SELECT id, 'Vegan Vietnamese', 48, 'Daily 10:00-21:00', 'MID', 1, 1, 1, 1, 1 FROM listings WHERE slug = 'hoi-an-vegan-heritage-kitchen'
ON DUPLICATE KEY UPDATE cuisine_type = VALUES(cuisine_type);

INSERT INTO vehicle_details (listing_id, vehicle_type, brand, model, manufacture_year, seats, fuel_type, transmission, has_driver, requires_license, min_rental_days)
SELECT id, 'MOTORBIKE', 'Honda', 'Air Blade 125', 2023, 2, 'PETROL', 'AUTOMATIC', 0, 1, 1 FROM listings WHERE slug = 'da-nang-motorbike-rental'
ON DUPLICATE KEY UPDATE brand = VALUES(brand);
INSERT INTO vehicle_details (listing_id, vehicle_type, brand, model, manufacture_year, seats, fuel_type, transmission, has_driver, requires_license, min_rental_days)
SELECT id, 'CAR', 'Toyota', 'Vios', 2022, 4, 'PETROL', 'AUTOMATIC', 1, 0, 1 FROM listings WHERE slug = 'nha-trang-private-car-with-driver'
ON DUPLICATE KEY UPDATE brand = VALUES(brand);
INSERT INTO vehicle_details (listing_id, vehicle_type, brand, model, manufacture_year, seats, fuel_type, transmission, has_driver, requires_license, min_rental_days)
SELECT id, 'VAN', 'Hyundai', 'Starex', 2021, 9, 'DIESEL', 'AUTOMATIC', 1, 0, 1 FROM listings WHERE slug = 'phu-quoc-airport-transfer-van'
ON DUPLICATE KEY UPDATE brand = VALUES(brand);

INSERT INTO experience_details (listing_id, duration_hours, max_participants, min_participants, skill_level, includes, what_to_bring, meeting_point)
SELECT id, 4.0, 12, 2, 'BEGINNER', 'Market walk, ingredients, lunch, recipes', 'Comfortable shoes and appetite', 'Hoi An Central Market gate' FROM listings WHERE slug = 'traditional-vietnamese-cooking-class'
ON DUPLICATE KEY UPDATE duration_hours = VALUES(duration_hours);
INSERT INTO experience_details (listing_id, duration_hours, max_participants, min_participants, skill_level, includes, what_to_bring, meeting_point)
SELECT id, 3.0, 10, 2, 'ALL', 'Coffee tastings, farm visit, cafe map', 'Light jacket and camera', 'Da Lat Railway Station' FROM listings WHERE slug = 'hidden-coffee-tour-da-lat'
ON DUPLICATE KEY UPDATE duration_hours = VALUES(duration_hours);
INSERT INTO experience_details (listing_id, duration_hours, max_participants, min_participants, skill_level, includes, what_to_bring, meeting_point)
SELECT id, 2.0, 14, 1, 'BEGINNER', 'Lantern frame, silk, artisan instruction', 'Nothing required', '21 Le Loi, Hoi An' FROM listings WHERE slug = 'hoi-an-lantern-making-workshop'
ON DUPLICATE KEY UPDATE duration_hours = VALUES(duration_hours);
INSERT INTO experience_details (listing_id, duration_hours, max_participants, min_participants, skill_level, includes, what_to_bring, meeting_point)
SELECT id, 4.5, 8, 2, 'ALL', 'Bicycle, helmet, local snack, guide', 'Sun protection and comfortable clothing', 'Cai Be Pier' FROM listings WHERE slug = 'mekong-delta-cycling-morning'
ON DUPLICATE KEY UPDATE duration_hours = VALUES(duration_hours);

-- -------------------------------------------------------------
-- Listing images
-- -------------------------------------------------------------
INSERT INTO listing_images (listing_id, image_url, alt_text, display_order, is_primary)
SELECT l.id, l.cover_image_url, CONCAT(l.title, ' cover image'), 0, 1
FROM listings l
WHERE l.slug IN (
  'ocean-view-resort-da-nang','cozy-pine-homestay-da-lat','old-quarter-boutique-stay-ha-noi','riverside-heritage-villa-hoi-an','phu-quoc-garden-bungalow',
  'hoi-an-lantern-walking-tour','sapa-trekking-experience','phu-quoc-sunset-boat-tour','cu-chi-tunnels-half-day-tour',
  'riverside-seafood-restaurant','old-quarter-pho-tasting-table','da-lat-garden-brunch','hoi-an-vegan-heritage-kitchen',
  'da-nang-motorbike-rental','nha-trang-private-car-with-driver','phu-quoc-airport-transfer-van',
  'traditional-vietnamese-cooking-class','hidden-coffee-tour-da-lat','hoi-an-lantern-making-workshop','mekong-delta-cycling-morning'
)
AND NOT EXISTS (
  SELECT 1 FROM listing_images li WHERE li.listing_id = l.id AND li.is_primary = 1
);

-- -------------------------------------------------------------
-- Inventory and 60 days availability
-- -------------------------------------------------------------
INSERT INTO inventory (listing_id, name, inventory_type, capacity, minimum_quantity, maximum_quantity, price_multiplier)
SELECT l.id,
       CASE l.category
         WHEN 'HOTEL' THEN 'Deluxe room'
         WHEN 'RESTAURANT' THEN 'Reservation table'
         WHEN 'TOUR' THEN 'Daily departure'
         WHEN 'VEHICLE' THEN 'Rental unit'
         ELSE 'Experience session'
       END,
       CASE l.category
         WHEN 'HOTEL' THEN 'ROOM_TYPE'
         WHEN 'RESTAURANT' THEN 'SLOT'
         WHEN 'TOUR' THEN 'SCHEDULE'
         WHEN 'VEHICLE' THEN 'GENERAL'
         ELSE 'SLOT'
       END,
       CASE l.category
         WHEN 'HOTEL' THEN 12
         WHEN 'RESTAURANT' THEN 24
         WHEN 'TOUR' THEN 16
         WHEN 'VEHICLE' THEN 5
         ELSE 12
       END,
       1,
       CASE l.category WHEN 'RESTAURANT' THEN 8 WHEN 'HOTEL' THEN 4 ELSE 6 END,
       1.00
FROM listings l
WHERE l.slug IN (
  'ocean-view-resort-da-nang','cozy-pine-homestay-da-lat','old-quarter-boutique-stay-ha-noi','riverside-heritage-villa-hoi-an','phu-quoc-garden-bungalow',
  'hoi-an-lantern-walking-tour','sapa-trekking-experience','phu-quoc-sunset-boat-tour','cu-chi-tunnels-half-day-tour',
  'riverside-seafood-restaurant','old-quarter-pho-tasting-table','da-lat-garden-brunch','hoi-an-vegan-heritage-kitchen',
  'da-nang-motorbike-rental','nha-trang-private-car-with-driver','phu-quoc-airport-transfer-van',
  'traditional-vietnamese-cooking-class','hidden-coffee-tour-da-lat','hoi-an-lantern-making-workshop','mekong-delta-cycling-morning'
)
AND NOT EXISTS (SELECT 1 FROM inventory i WHERE i.listing_id = l.id AND i.deleted_at IS NULL);

INSERT INTO availability_calendar (listing_id, inventory_id, date, price, total_capacity, booked_units, reserved_units, blocked_capacity, status)
SELECT l.id,
       i.id,
       DATE_ADD(CURDATE(), INTERVAL d.n DAY),
       ROUND(l.base_price * i.price_multiplier, -3),
       i.capacity,
       0,
       0,
       0,
       'AVAILABLE'
FROM listings l
JOIN inventory i ON i.listing_id = l.id AND i.deleted_at IS NULL
JOIN (
  SELECT 0 n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
  UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11
  UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15 UNION ALL SELECT 16 UNION ALL SELECT 17
  UNION ALL SELECT 18 UNION ALL SELECT 19 UNION ALL SELECT 20 UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23
  UNION ALL SELECT 24 UNION ALL SELECT 25 UNION ALL SELECT 26 UNION ALL SELECT 27 UNION ALL SELECT 28 UNION ALL SELECT 29
  UNION ALL SELECT 30 UNION ALL SELECT 31 UNION ALL SELECT 32 UNION ALL SELECT 33 UNION ALL SELECT 34 UNION ALL SELECT 35
  UNION ALL SELECT 36 UNION ALL SELECT 37 UNION ALL SELECT 38 UNION ALL SELECT 39 UNION ALL SELECT 40 UNION ALL SELECT 41
  UNION ALL SELECT 42 UNION ALL SELECT 43 UNION ALL SELECT 44 UNION ALL SELECT 45 UNION ALL SELECT 46 UNION ALL SELECT 47
  UNION ALL SELECT 48 UNION ALL SELECT 49 UNION ALL SELECT 50 UNION ALL SELECT 51 UNION ALL SELECT 52 UNION ALL SELECT 53
  UNION ALL SELECT 54 UNION ALL SELECT 55 UNION ALL SELECT 56 UNION ALL SELECT 57 UNION ALL SELECT 58 UNION ALL SELECT 59
) d
WHERE l.status = 'ACTIVE'
AND l.cover_image_url LIKE '/demo-images/%'
ON DUPLICATE KEY UPDATE
  price = VALUES(price),
  total_capacity = VALUES(total_capacity),
  status = VALUES(status);

-- -------------------------------------------------------------
-- Demo cart, notifications, and settlements
-- -------------------------------------------------------------
INSERT INTO carts (user_id, status)
SELECT u.id, 'ACTIVE' FROM users u
WHERE u.email = 'customer@aitravel.demo'
AND NOT EXISTS (SELECT 1 FROM carts c WHERE c.user_id = u.id AND c.status = 'ACTIVE' AND c.deleted_at IS NULL);

INSERT INTO cart_items (cart_id, listing_id, inventory_id, quantity, start_date, end_date, time_slot)
SELECT c.id, l.id, i.id, 1, DATE_ADD(CURDATE(), INTERVAL 7 DAY), DATE_ADD(CURDATE(), INTERVAL 8 DAY), '14:00'
FROM carts c
JOIN users u ON u.id = c.user_id
JOIN listings l ON l.slug = 'ocean-view-resort-da-nang'
JOIN inventory i ON i.listing_id = l.id
WHERE u.email = 'customer@aitravel.demo'
AND c.status = 'ACTIVE'
AND NOT EXISTS (SELECT 1 FROM cart_items ci WHERE ci.cart_id = c.id AND ci.listing_id = l.id);

INSERT INTO notifications (user_id, type, title, message, status)
SELECT u.id, 'SYSTEM_ALERT', 'Welcome to demo mode', 'Explore seeded Vietnam listings, AI planning, checkout, and mock payments.', 'UNREAD'
FROM users u
WHERE u.email IN ('customer@aitravel.demo','hotel@aitravel.demo','tour@aitravel.demo')
AND NOT EXISTS (SELECT 1 FROM notifications n WHERE n.user_id = u.id AND n.title = 'Welcome to demo mode');

INSERT INTO settlements (provider_id, amount, currency, status, period_start, period_end, gross_amount, platform_fee, provider_amount, tax_amount)
SELECT u.id, 12850000, 'VND', 'COMPLETED', DATE_SUB(CURDATE(), INTERVAL 30 DAY), CURDATE(), 15000000, 1500000, 12850000, 650000
FROM users u WHERE u.email = 'hotel@aitravel.demo'
AND NOT EXISTS (SELECT 1 FROM settlements s WHERE s.provider_id = u.id AND s.period_end = CURDATE());

INSERT INTO settlements (provider_id, amount, currency, status, period_start, period_end, gross_amount, platform_fee, provider_amount, tax_amount)
SELECT u.id, 8200000, 'VND', 'PROCESSING', DATE_SUB(CURDATE(), INTERVAL 30 DAY), CURDATE(), 9600000, 960000, 8200000, 440000
FROM users u WHERE u.email = 'tour@aitravel.demo'
AND NOT EXISTS (SELECT 1 FROM settlements s WHERE s.provider_id = u.id AND s.period_end = CURDATE());
