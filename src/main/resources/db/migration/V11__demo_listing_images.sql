-- Replace demo SVG placeholders with realistic travel marketplace imagery.
-- This migration preserves existing listing IDs, slugs, prices, categories, and business data.

UPDATE listings
SET cover_image_url = CASE slug
  WHEN 'ocean-view-resort-da-nang' THEN 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1400&q=80'
  WHEN 'cozy-pine-homestay-da-lat' THEN 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80'
  WHEN 'old-quarter-boutique-stay-ha-noi' THEN 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80'
  WHEN 'riverside-heritage-villa-hoi-an' THEN 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1400&q=80'
  WHEN 'phu-quoc-garden-bungalow' THEN 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1400&q=80'
  WHEN 'hoi-an-lantern-walking-tour' THEN 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1400&q=80'
  WHEN 'sapa-trekking-experience' THEN 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80'
  WHEN 'phu-quoc-sunset-boat-tour' THEN 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80'
  WHEN 'cu-chi-tunnels-half-day-tour' THEN 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1400&q=80'
  WHEN 'riverside-seafood-restaurant' THEN 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80'
  WHEN 'old-quarter-pho-tasting-table' THEN 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1400&q=80'
  WHEN 'da-lat-garden-brunch' THEN 'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=1400&q=80'
  WHEN 'hoi-an-vegan-heritage-kitchen' THEN 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1400&q=80'
  WHEN 'da-nang-motorbike-rental' THEN 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1400&q=80'
  WHEN 'nha-trang-private-car-with-driver' THEN 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1400&q=80'
  WHEN 'phu-quoc-airport-transfer-van' THEN 'https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&w=1400&q=80'
  WHEN 'traditional-vietnamese-cooking-class' THEN 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1400&q=80'
  WHEN 'hidden-coffee-tour-da-lat' THEN 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1400&q=80'
  WHEN 'hoi-an-lantern-making-workshop' THEN 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=1400&q=80'
  WHEN 'mekong-delta-cycling-morning' THEN 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80'
  ELSE cover_image_url
END
WHERE slug IN (
  'ocean-view-resort-da-nang','cozy-pine-homestay-da-lat','old-quarter-boutique-stay-ha-noi','riverside-heritage-villa-hoi-an','phu-quoc-garden-bungalow',
  'hoi-an-lantern-walking-tour','sapa-trekking-experience','phu-quoc-sunset-boat-tour','cu-chi-tunnels-half-day-tour',
  'riverside-seafood-restaurant','old-quarter-pho-tasting-table','da-lat-garden-brunch','hoi-an-vegan-heritage-kitchen',
  'da-nang-motorbike-rental','nha-trang-private-car-with-driver','phu-quoc-airport-transfer-van',
  'traditional-vietnamese-cooking-class','hidden-coffee-tour-da-lat','hoi-an-lantern-making-workshop','mekong-delta-cycling-morning'
);

UPDATE listing_images li
JOIN listings l ON l.id = li.listing_id
SET li.deleted_at = CURRENT_TIMESTAMP
WHERE li.deleted_at IS NULL
  AND li.image_url LIKE '/demo-images/%'
  AND l.slug IN (
    'ocean-view-resort-da-nang','cozy-pine-homestay-da-lat','old-quarter-boutique-stay-ha-noi','riverside-heritage-villa-hoi-an','phu-quoc-garden-bungalow',
    'hoi-an-lantern-walking-tour','sapa-trekking-experience','phu-quoc-sunset-boat-tour','cu-chi-tunnels-half-day-tour',
    'riverside-seafood-restaurant','old-quarter-pho-tasting-table','da-lat-garden-brunch','hoi-an-vegan-heritage-kitchen',
    'da-nang-motorbike-rental','nha-trang-private-car-with-driver','phu-quoc-airport-transfer-van',
    'traditional-vietnamese-cooking-class','hidden-coffee-tour-da-lat','hoi-an-lantern-making-workshop','mekong-delta-cycling-morning'
  );

INSERT INTO listing_images (listing_id, image_url, alt_text, display_order, is_primary)
SELECT l.id, img.image_url, img.alt_text, img.display_order, img.is_primary
FROM listings l
JOIN (
  SELECT 'ocean-view-resort-da-nang' slug, 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1400&q=80' image_url, 'Ocean View Resort Da Nang beachfront pool' alt_text, 0 display_order, 1 is_primary UNION ALL
  SELECT 'ocean-view-resort-da-nang', 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1400&q=80', 'Ocean View Resort Da Nang guest room', 1, 0 UNION ALL
  SELECT 'ocean-view-resort-da-nang', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80', 'Ocean View Resort Da Nang lobby', 2, 0 UNION ALL
  SELECT 'ocean-view-resort-da-nang', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1400&q=80', 'Ocean View Resort Da Nang terrace', 3, 0 UNION ALL

  SELECT 'cozy-pine-homestay-da-lat', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80', 'Cozy Pine Homestay Da Lat mountain view', 0, 1 UNION ALL
  SELECT 'cozy-pine-homestay-da-lat', 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1400&q=80', 'Cozy Pine Homestay Da Lat cabin exterior', 1, 0 UNION ALL
  SELECT 'cozy-pine-homestay-da-lat', 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1400&q=80', 'Cozy Pine Homestay Da Lat forest stay', 2, 0 UNION ALL
  SELECT 'cozy-pine-homestay-da-lat', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80', 'Cozy Pine Homestay Da Lat warm interior', 3, 0 UNION ALL

  SELECT 'old-quarter-boutique-stay-ha-noi', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80', 'Old Quarter Boutique Stay Ha Noi hotel exterior', 0, 1 UNION ALL
  SELECT 'old-quarter-boutique-stay-ha-noi', 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1400&q=80', 'Old Quarter Boutique Stay Ha Noi suite', 1, 0 UNION ALL
  SELECT 'old-quarter-boutique-stay-ha-noi', 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1400&q=80', 'Old Quarter Boutique Stay Ha Noi room', 2, 0 UNION ALL
  SELECT 'old-quarter-boutique-stay-ha-noi', 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1400&q=80', 'Old Quarter Boutique Stay Ha Noi city design detail', 3, 0 UNION ALL

  SELECT 'riverside-heritage-villa-hoi-an', 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1400&q=80', 'Riverside Heritage Villa Hoi An garden villa', 0, 1 UNION ALL
  SELECT 'riverside-heritage-villa-hoi-an', 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=1400&q=80', 'Riverside Heritage Villa Hoi An riverside house', 1, 0 UNION ALL
  SELECT 'riverside-heritage-villa-hoi-an', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80', 'Riverside Heritage Villa Hoi An courtyard', 2, 0 UNION ALL
  SELECT 'riverside-heritage-villa-hoi-an', 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1400&q=80', 'Riverside Heritage Villa Hoi An pool', 3, 0 UNION ALL

  SELECT 'phu-quoc-garden-bungalow', 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1400&q=80', 'Phu Quoc Garden Bungalow resort pool', 0, 1 UNION ALL
  SELECT 'phu-quoc-garden-bungalow', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80', 'Phu Quoc Garden Bungalow beach', 1, 0 UNION ALL
  SELECT 'phu-quoc-garden-bungalow', 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1400&q=80', 'Phu Quoc Garden Bungalow tropical villa', 2, 0 UNION ALL
  SELECT 'phu-quoc-garden-bungalow', 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1400&q=80', 'Phu Quoc Garden Bungalow room', 3, 0 UNION ALL

  SELECT 'hoi-an-lantern-walking-tour', 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1400&q=80', 'Hoi An Lantern Walking Tour old town', 0, 1 UNION ALL
  SELECT 'hoi-an-lantern-walking-tour', 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=1400&q=80', 'Hoi An Lantern Walking Tour lantern street', 1, 0 UNION ALL
  SELECT 'hoi-an-lantern-walking-tour', 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1400&q=80', 'Hoi An Lantern Walking Tour heritage lanes', 2, 0 UNION ALL
  SELECT 'hoi-an-lantern-walking-tour', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80', 'Hoi An Lantern Walking Tour riverside evening', 3, 0 UNION ALL

  SELECT 'sapa-trekking-experience', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80', 'Sapa Trekking Experience mountain route', 0, 1 UNION ALL
  SELECT 'sapa-trekking-experience', 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1400&q=80', 'Sapa Trekking Experience scenic trail', 1, 0 UNION ALL
  SELECT 'sapa-trekking-experience', 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80', 'Sapa Trekking Experience terrace viewpoint', 2, 0 UNION ALL
  SELECT 'sapa-trekking-experience', 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1400&q=80', 'Sapa Trekking Experience guided hike', 3, 0 UNION ALL

  SELECT 'phu-quoc-sunset-boat-tour', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80', 'Phu Quoc Sunset Boat Tour beach sunset', 0, 1 UNION ALL
  SELECT 'phu-quoc-sunset-boat-tour', 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=80', 'Phu Quoc Sunset Boat Tour island water', 1, 0 UNION ALL
  SELECT 'phu-quoc-sunset-boat-tour', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1400&q=80', 'Phu Quoc Sunset Boat Tour boat trip', 2, 0 UNION ALL
  SELECT 'phu-quoc-sunset-boat-tour', 'https://images.unsplash.com/photo-1471922694854-ff1b63b20054?auto=format&fit=crop&w=1400&q=80', 'Phu Quoc Sunset Boat Tour snorkeling cove', 3, 0 UNION ALL

  SELECT 'cu-chi-tunnels-half-day-tour', 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1400&q=80', 'Cu Chi Tunnels Half-Day Tour Vietnam landscape', 0, 1 UNION ALL
  SELECT 'cu-chi-tunnels-half-day-tour', 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1400&q=80', 'Cu Chi Tunnels Half-Day Tour heritage site', 1, 0 UNION ALL
  SELECT 'cu-chi-tunnels-half-day-tour', 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1400&q=80', 'Cu Chi Tunnels Half-Day Tour guided path', 2, 0 UNION ALL
  SELECT 'cu-chi-tunnels-half-day-tour', 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1400&q=80', 'Cu Chi Tunnels Half-Day Tour group excursion', 3, 0 UNION ALL

  SELECT 'riverside-seafood-restaurant', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80', 'Riverside Seafood Restaurant dining room', 0, 1 UNION ALL
  SELECT 'riverside-seafood-restaurant', 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1400&q=80', 'Riverside Seafood Restaurant table service', 1, 0 UNION ALL
  SELECT 'riverside-seafood-restaurant', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1400&q=80', 'Riverside Seafood Restaurant seafood platter', 2, 0 UNION ALL
  SELECT 'riverside-seafood-restaurant', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=80', 'Riverside Seafood Restaurant sunset table', 3, 0 UNION ALL

  SELECT 'old-quarter-pho-tasting-table', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1400&q=80', 'Old Quarter Pho Tasting Table noodle tasting', 0, 1 UNION ALL
  SELECT 'old-quarter-pho-tasting-table', 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1400&q=80', 'Old Quarter Pho Tasting Table broth preparation', 1, 0 UNION ALL
  SELECT 'old-quarter-pho-tasting-table', 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1400&q=80', 'Old Quarter Pho Tasting Table fresh herbs', 2, 0 UNION ALL
  SELECT 'old-quarter-pho-tasting-table', 'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=1400&q=80', 'Old Quarter Pho Tasting Table kitchen counter', 3, 0 UNION ALL

  SELECT 'da-lat-garden-brunch', 'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=1400&q=80', 'Da Lat Garden Brunch greenhouse dining', 0, 1 UNION ALL
  SELECT 'da-lat-garden-brunch', 'https://images.unsplash.com/photo-1481833761820-0509d3217039?auto=format&fit=crop&w=1400&q=80', 'Da Lat Garden Brunch cafe interior', 1, 0 UNION ALL
  SELECT 'da-lat-garden-brunch', 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1400&q=80', 'Da Lat Garden Brunch farm produce', 2, 0 UNION ALL
  SELECT 'da-lat-garden-brunch', 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=1400&q=80', 'Da Lat Garden Brunch breakfast table', 3, 0 UNION ALL

  SELECT 'hoi-an-vegan-heritage-kitchen', 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1400&q=80', 'Hoi An Vegan Heritage Kitchen plant based meal', 0, 1 UNION ALL
  SELECT 'hoi-an-vegan-heritage-kitchen', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1400&q=80', 'Hoi An Vegan Heritage Kitchen fresh salad', 1, 0 UNION ALL
  SELECT 'hoi-an-vegan-heritage-kitchen', 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1400&q=80', 'Hoi An Vegan Heritage Kitchen colorful bowl', 2, 0 UNION ALL
  SELECT 'hoi-an-vegan-heritage-kitchen', 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1400&q=80', 'Hoi An Vegan Heritage Kitchen dining space', 3, 0 UNION ALL

  SELECT 'da-nang-motorbike-rental', 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1400&q=80', 'Da Nang Motorbike Rental scooter', 0, 1 UNION ALL
  SELECT 'da-nang-motorbike-rental', 'https://images.unsplash.com/photo-1517846693594-1567da72af75?auto=format&fit=crop&w=1400&q=80', 'Da Nang Motorbike Rental road ride', 1, 0 UNION ALL
  SELECT 'da-nang-motorbike-rental', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80', 'Da Nang Motorbike Rental coastal route', 2, 0 UNION ALL
  SELECT 'da-nang-motorbike-rental', 'https://images.unsplash.com/photo-1524591652733-73fa1ae7b5ee?auto=format&fit=crop&w=1400&q=80', 'Da Nang Motorbike Rental city scooter', 3, 0 UNION ALL

  SELECT 'nha-trang-private-car-with-driver', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1400&q=80', 'Nha Trang Private Car with Driver sedan', 0, 1 UNION ALL
  SELECT 'nha-trang-private-car-with-driver', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1400&q=80', 'Nha Trang Private Car with Driver luxury car', 1, 0 UNION ALL
  SELECT 'nha-trang-private-car-with-driver', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=80', 'Nha Trang Private Car with Driver coastal transfer', 2, 0 UNION ALL
  SELECT 'nha-trang-private-car-with-driver', 'https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?auto=format&fit=crop&w=1400&q=80', 'Nha Trang Private Car with Driver comfortable ride', 3, 0 UNION ALL

  SELECT 'phu-quoc-airport-transfer-van', 'https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&w=1400&q=80', 'Phu Quoc Airport Transfer Van road transfer', 0, 1 UNION ALL
  SELECT 'phu-quoc-airport-transfer-van', 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1400&q=80', 'Phu Quoc Airport Transfer Van spacious vehicle', 1, 0 UNION ALL
  SELECT 'phu-quoc-airport-transfer-van', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1400&q=80', 'Phu Quoc Airport Transfer Van airport pickup', 2, 0 UNION ALL
  SELECT 'phu-quoc-airport-transfer-van', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=80', 'Phu Quoc Airport Transfer Van group transport', 3, 0 UNION ALL

  SELECT 'traditional-vietnamese-cooking-class', 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1400&q=80', 'Traditional Vietnamese Cooking Class hands-on cooking', 0, 1 UNION ALL
  SELECT 'traditional-vietnamese-cooking-class', 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1400&q=80', 'Traditional Vietnamese Cooking Class market ingredients', 1, 0 UNION ALL
  SELECT 'traditional-vietnamese-cooking-class', 'https://images.unsplash.com/photo-1506368249639-73a05d6f6488?auto=format&fit=crop&w=1400&q=80', 'Traditional Vietnamese Cooking Class fresh herbs', 2, 0 UNION ALL
  SELECT 'traditional-vietnamese-cooking-class', 'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=1400&q=80', 'Traditional Vietnamese Cooking Class kitchen workshop', 3, 0 UNION ALL

  SELECT 'hidden-coffee-tour-da-lat', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1400&q=80', 'Hidden Coffee Tour Da Lat specialty coffee', 0, 1 UNION ALL
  SELECT 'hidden-coffee-tour-da-lat', 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1400&q=80', 'Hidden Coffee Tour Da Lat coffee beans', 1, 0 UNION ALL
  SELECT 'hidden-coffee-tour-da-lat', 'https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?auto=format&fit=crop&w=1400&q=80', 'Hidden Coffee Tour Da Lat cafe tasting', 2, 0 UNION ALL
  SELECT 'hidden-coffee-tour-da-lat', 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=1400&q=80', 'Hidden Coffee Tour Da Lat farm visit', 3, 0 UNION ALL

  SELECT 'hoi-an-lantern-making-workshop', 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=1400&q=80', 'Hoi An Lantern Making Workshop silk lanterns', 0, 1 UNION ALL
  SELECT 'hoi-an-lantern-making-workshop', 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1400&q=80', 'Hoi An Lantern Making Workshop old town craft', 1, 0 UNION ALL
  SELECT 'hoi-an-lantern-making-workshop', 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1400&q=80', 'Hoi An Lantern Making Workshop artisan street', 2, 0 UNION ALL
  SELECT 'hoi-an-lantern-making-workshop', 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1400&q=80', 'Hoi An Lantern Making Workshop handmade design', 3, 0 UNION ALL

  SELECT 'mekong-delta-cycling-morning', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80', 'Mekong Delta Cycling Morning village route', 0, 1 UNION ALL
  SELECT 'mekong-delta-cycling-morning', 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80', 'Mekong Delta Cycling Morning countryside', 1, 0 UNION ALL
  SELECT 'mekong-delta-cycling-morning', 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1400&q=80', 'Mekong Delta Cycling Morning riverside village', 2, 0 UNION ALL
  SELECT 'mekong-delta-cycling-morning', 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1400&q=80', 'Mekong Delta Cycling Morning guided cycling', 3, 0
) img ON img.slug = l.slug
WHERE NOT EXISTS (
  SELECT 1
  FROM listing_images existing
  WHERE existing.listing_id = l.id
    AND existing.image_url = img.image_url
    AND existing.deleted_at IS NULL
);
