package com.travel.marketplace.modules.listing.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.travel.marketplace.exception.BadRequestException;
import com.travel.marketplace.exception.ErrorCode;
import com.travel.marketplace.exception.ResourceNotFoundException;
import com.travel.marketplace.modules.booking.repository.BookingRepository;
import com.travel.marketplace.modules.listing.dto.AdminListingCategoryResponse;
import com.travel.marketplace.modules.listing.dto.AdminListingPerformanceResponse;
import com.travel.marketplace.modules.listing.dto.AdminListingResponse;
import com.travel.marketplace.modules.listing.dto.AdminListingSearchRequest;
import com.travel.marketplace.modules.listing.dto.AdminListingStatisticsResponse;
import com.travel.marketplace.modules.listing.dto.AdminListingTopProviderResponse;
import com.travel.marketplace.modules.listing.dto.CreateListingRequest;
import com.travel.marketplace.modules.listing.dto.ListingMapper;
import com.travel.marketplace.modules.listing.dto.ListingResponse;
import com.travel.marketplace.modules.listing.dto.ListingSearchRequest;
import com.travel.marketplace.modules.listing.dto.UpdateListingRequest;
import com.travel.marketplace.modules.listing.entity.*;
import com.travel.marketplace.modules.listing.enums.ListingCategory;
import com.travel.marketplace.modules.listing.enums.ListingStatus;
import com.travel.marketplace.modules.listing.repository.*;
import com.travel.marketplace.modules.provider.enums.VerificationStatus;
import com.travel.marketplace.modules.user.entity.ProviderProfile;
import com.travel.marketplace.modules.user.entity.User;
import com.travel.marketplace.modules.user.repository.ProviderProfileRepository;
import com.travel.marketplace.modules.user.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.regex.Pattern;

@Service
public class ListingServiceImpl implements ListingService {

    private static final Logger log = LoggerFactory.getLogger(ListingServiceImpl.class);

    private final ListingRepository listingRepository;
    private final ListingImageRepository listingImageRepository;
    private final HotelDetailRepository hotelDetailRepository;
    private final TourDetailRepository tourDetailRepository;
    private final RestaurantDetailRepository restaurantDetailRepository;
    private final VehicleDetailRepository vehicleDetailRepository;
    private final ExperienceDetailRepository experienceDetailRepository;
    private final UserRepository userRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final BookingRepository bookingRepository;
    private final ListingMapper listingMapper;
    private final ObjectMapper objectMapper;
    private static final Set<String> ADMIN_SORT_ALLOWLIST = Set.of("id", "title", "category", "status", "city", "basePrice", "averageRating", "createdAt", "updatedAt");

    private static final Set<String> HOTEL_DETAIL_KEYS = new HashSet<>(Arrays.asList(
            "starRating", "totalRooms", "checkInTime", "checkOutTime",
            "hasPool", "hasSpa", "hasGym", "hasRestaurant", "hasFreeWifi", "hasParking", "petFriendly"
    ));
    private static final Set<String> TOUR_DETAIL_KEYS = new HashSet<>(Arrays.asList(
            "durationDays", "durationHours", "maxGroupSize", "minGroupSize", "tourType",
            "meetingPoint", "includes", "excludes", "itinerary"
    ));
    private static final Set<String> RESTAURANT_DETAIL_KEYS = new HashSet<>(Arrays.asList(
            "cuisineType", "seatingCapacity", "openingHours", "priceRange", "hasDelivery",
            "hasDineIn", "hasTakeaway", "hasReservations", "halalCertified", "vegetarianFriendly"
    ));
    private static final Set<String> VEHICLE_DETAIL_KEYS = new HashSet<>(Arrays.asList(
            "vehicleType", "brand", "model", "manufactureYear", "seats", "fuelType",
            "transmission", "hasDriver", "requiresLicense", "minRentalDays"
    ));
    private static final Set<String> EXPERIENCE_DETAIL_KEYS = new HashSet<>(Arrays.asList(
            "durationHours", "maxParticipants", "minParticipants", "skillLevel",
            "includes", "whatToBring", "meetingPoint"
    ));

    public ListingServiceImpl(
            ListingRepository listingRepository,
            ListingImageRepository listingImageRepository,
            HotelDetailRepository hotelDetailRepository,
            TourDetailRepository tourDetailRepository,
            RestaurantDetailRepository restaurantDetailRepository,
            VehicleDetailRepository vehicleDetailRepository,
            ExperienceDetailRepository experienceDetailRepository,
            UserRepository userRepository,
            ProviderProfileRepository providerProfileRepository,
            BookingRepository bookingRepository,
            ListingMapper listingMapper,
            ObjectMapper objectMapper
    ) {
        this.listingRepository = listingRepository;
        this.listingImageRepository = listingImageRepository;
        this.hotelDetailRepository = hotelDetailRepository;
        this.tourDetailRepository = tourDetailRepository;
        this.restaurantDetailRepository = restaurantDetailRepository;
        this.vehicleDetailRepository = vehicleDetailRepository;
        this.experienceDetailRepository = experienceDetailRepository;
        this.userRepository = userRepository;
        this.providerProfileRepository = providerProfileRepository;
        this.bookingRepository = bookingRepository;
        this.listingMapper = listingMapper;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public ListingResponse createListing(String userEmail, CreateListingRequest request) {
        User user = getUserByEmail(userEmail);
        ProviderProfile provider = getProviderProfile(user.getId());

        ListingCategory category = parseCategory(request.getCategory());

        String slug = generateSlug(request.getTitle());

        Listing listing = Listing.builder()
                .provider(provider)
                .category(category)
                .title(request.getTitle())
                .slug(slug)
                .shortDesc(request.getShortDesc())
                .description(request.getDescription())
                .address(request.getAddress())
                .city(request.getCity())
                .country(request.getCountry() != null ? request.getCountry() : "Vietnam")
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .coverImageUrl(request.getCoverImageUrl())
                .basePrice(request.getBasePrice())
                .currency(request.getCurrency() != null ? request.getCurrency() : "VND")
                .detailsExtra(extractExtraDetails(category, request.getDetails()))
                .status(ListingStatus.DRAFT) // Always starts as DRAFT
                .build();

        Listing savedListing = listingRepository.save(listing);

        // Save images
        List<ListingImage> savedImages = saveImages(savedListing, request.getImageUrls());

        // Save Detail
        Object detailEntity = saveDetailEntity(savedListing, category, request.getDetails());

        return listingMapper.toResponse(savedListing, savedImages, detailEntity);
    }

    @Override
    @Transactional
    public ListingResponse updateListing(String userEmail, Long listingId, UpdateListingRequest request) {
        User user = getUserByEmail(userEmail);
        ProviderProfile provider = getProviderProfile(user.getId());
        Listing listing = getListingByIdInternal(listingId);

        // Security check: Must be owner
        if (!listing.getProvider().getId().equals(provider.getId())) {
            throw new BadRequestException("You don't own this listing", ErrorCode.FORBIDDEN);
        }

        // Apply partial updates
        if (request.getTitle() != null && !request.getTitle().equals(listing.getTitle())) {
            listing.setTitle(request.getTitle());
            listing.setSlug(generateSlug(request.getTitle())); // Re-generate slug on title change
        }
        if (request.getShortDesc() != null) listing.setShortDesc(request.getShortDesc());
        if (request.getDescription() != null) listing.setDescription(request.getDescription());
        if (request.getAddress() != null) listing.setAddress(request.getAddress());
        if (request.getCity() != null) listing.setCity(request.getCity());
        if (request.getCountry() != null) listing.setCountry(request.getCountry());
        if (request.getLatitude() != null) listing.setLatitude(request.getLatitude());
        if (request.getLongitude() != null) listing.setLongitude(request.getLongitude());
        if (request.getCoverImageUrl() != null) listing.setCoverImageUrl(request.getCoverImageUrl());
        if (request.getBasePrice() != null) listing.setBasePrice(request.getBasePrice());
        if (request.getCurrency() != null) listing.setCurrency(request.getCurrency());
        if (request.getDetails() != null) listing.setDetailsExtra(extractExtraDetails(listing.getCategory(), request.getDetails()));

        Listing savedListing = listingRepository.save(listing);

        // Update images if provided (simplistic replacement for Phase 2)
        List<ListingImage> images = listingImageRepository.findByListingIdOrderByDisplayOrderAsc(listingId);
        if (request.getImageUrls() != null) {
            // Soft delete old ones
            for (ListingImage img : images) {
                listingImageRepository.softDeleteById(img.getId(), Instant.now());
            }
            images = saveImages(savedListing, request.getImageUrls());
        }

        // Update Detail if provided
        Object detailEntity = getDetailEntity(savedListing);
        if (request.getDetails() != null) {
            detailEntity = updateDetailEntity(savedListing, detailEntity, request.getDetails());
        }

        return listingMapper.toResponse(savedListing, images, detailEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public ListingResponse getListingById(Long listingId) {
        Listing listing = getListingByIdInternal(listingId);
        List<ListingImage> images = listingImageRepository.findByListingIdOrderByDisplayOrderAsc(listingId);
        Object detailEntity = getDetailEntity(listing);
        return listingMapper.toResponse(listing, images, detailEntity);
    }

    @Override
    @Transactional
    public ListingResponse getListingBySlug(String slug) {
        Listing listing = listingRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found with slug: " + slug));
        
        // Increment view count
        listing.setViewCount(listing.getViewCount() + 1);
        listingRepository.save(listing);

        List<ListingImage> images = listingImageRepository.findByListingIdOrderByDisplayOrderAsc(listing.getId());
        Object detailEntity = getDetailEntity(listing);
        return listingMapper.toResponse(listing, images, detailEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ListingResponse> getMyListings(String userEmail, Pageable pageable) {
        User user = getUserByEmail(userEmail);
        ProviderProfile provider = getProviderProfile(user.getId());

        return listingRepository.findAllByProviderId(provider.getId(), pageable)
                .map(listing -> {
                    List<ListingImage> images = listingImageRepository.findByListingIdOrderByDisplayOrderAsc(listing.getId());
                    return listingMapper.toResponse(listing, images, getDetailEntity(listing));
                });
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ListingResponse> searchListings(ListingSearchRequest searchRequest, Pageable pageable) {
        return listingRepository.findAll(ListingSpecification.filterBy(searchRequest), pageable)
                .map(listing -> {
                    List<ListingImage> images = listingImageRepository.findByListingIdOrderByDisplayOrderAsc(listing.getId());
                    return listingMapper.toResponse(listing, images, getDetailEntity(listing));
                });
    }

    @Override
    @Transactional
    public void deleteListing(String userEmail, Long listingId) {
        User user = getUserByEmail(userEmail);
        ProviderProfile provider = getProviderProfile(user.getId());
        Listing listing = getListingByIdInternal(listingId);

        if (!listing.getProvider().getId().equals(provider.getId())) {
            throw new BadRequestException("You don't own this listing", ErrorCode.FORBIDDEN);
        }

        listingRepository.softDeleteById(listingId, Instant.now());
        log.info("Soft deleted listing id={}", listingId);
    }

    @Override
    @Transactional
    public ListingResponse changeListingStatus(String userEmail, Long listingId, ListingStatus newStatus) {
        User user = getUserByEmail(userEmail);
        ProviderProfile provider = getProviderProfile(user.getId());
        Listing listing = getListingByIdInternal(listingId);

        if (!listing.getProvider().getId().equals(provider.getId())) {
            throw new BadRequestException("You don't own this listing", ErrorCode.FORBIDDEN);
        }

        // Provider can only change to certain statuses
        if (newStatus == ListingStatus.PENDING_REVIEW) {
            // Check if provider is approved
            if (!provider.isApproved()) {
                throw new BadRequestException("Your provider profile must be APPROVED before submitting listings for review.");
            }
            listing.setStatus(ListingStatus.PENDING_REVIEW);
        } else if (newStatus == ListingStatus.INACTIVE || newStatus == ListingStatus.ARCHIVED || newStatus == ListingStatus.DRAFT) {
            listing.setStatus(newStatus);
        } else {
            throw new BadRequestException("Providers cannot directly set status to " + newStatus);
        }

        Listing saved = listingRepository.save(listing);
        return getListingById(listingId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ListingResponse> getAllListingsForAdmin(Pageable pageable) {
        return listingRepository.findAll(pageable)
                .map(listing -> listingMapper.toResponse(listing, null, null));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AdminListingResponse> getAdminListings(AdminListingSearchRequest request, int page, int size, String sort) {
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), resolveAdminSort(sort));
        Page<Listing> listings = listingRepository.findAll(AdminListingSpecification.filterBy(request), pageable);
        Map<Long, Long> bookingCounts = loadListingBookingCounts(listings.getContent().stream().map(Listing::getId).toList());
        return listings.map(listing -> toAdminListingResponse(listing, bookingCounts.getOrDefault(listing.getId(), 0L)));
    }

    @Override
    @Transactional(readOnly = true)
    public AdminListingStatisticsResponse getAdminListingStatistics() {
        long total = listingRepository.count();
        List<AdminListingCategoryResponse> categories = getAdminListingCategoryDistribution(total);
        return new AdminListingStatisticsResponse(
                total,
                listingRepository.countByStatus(ListingStatus.ACTIVE),
                listingRepository.countByStatus(ListingStatus.PENDING_REVIEW),
                listingRepository.countByStatus(ListingStatus.DRAFT),
                listingRepository.countByStatus(ListingStatus.SUSPENDED),
                listingRepository.countByStatus(ListingStatus.REJECTED),
                categories
        );
    }

    @Override
    @Transactional(readOnly = true)
    public AdminListingPerformanceResponse getAdminListingPerformance(String range) {
        String normalizedRange = "7d".equalsIgnoreCase(range) ? "7d" : "90d".equalsIgnoreCase(range) ? "90d" : "30d";
        long totalViews = listingRepository.sumViewCount();
        long totalBookings = bookingRepository.count();
        return new AdminListingPerformanceResponse(normalizedRange, false, false, totalViews, totalBookings, Collections.emptyList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminListingTopProviderResponse> getAdminListingTopProviders(int limit) {
        PageRequest pageable = PageRequest.of(0, Math.min(Math.max(limit, 1), 20));
        return listingRepository.topProvidersByActiveListingCount(pageable).stream()
                .map(row -> new AdminListingTopProviderResponse(
                        (Long) row[0],
                        (String) row[1],
                        (String) row[2],
                        (Long) row[3],
                        row[4] != null ? BigDecimal.valueOf(((Number) row[4]).doubleValue()).setScale(1, RoundingMode.HALF_UP) : BigDecimal.ZERO
                ))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminListingResponse> getRecentAdminListingSubmissions(int limit) {
        PageRequest pageable = PageRequest.of(0, Math.min(Math.max(limit, 1), 20), Sort.by(Sort.Direction.DESC, "updatedAt"));
        Page<Listing> listings = listingRepository.findAllByStatusIn(List.of(ListingStatus.PENDING_REVIEW, ListingStatus.DRAFT), pageable);
        Map<Long, Long> bookingCounts = loadListingBookingCounts(listings.getContent().stream().map(Listing::getId).toList());
        return listings.getContent().stream()
                .map(listing -> toAdminListingResponse(listing, bookingCounts.getOrDefault(listing.getId(), 0L)))
                .toList();
    }

    @Override
    @Transactional
    public ListingResponse adminChangeListingStatus(Long listingId, ListingStatus newStatus, String reason) {
        Listing listing = getListingByIdInternal(listingId);
        validateAdminStatusTransition(listing.getStatus(), newStatus, reason);
        listing.setStatus(newStatus);
        if (newStatus == ListingStatus.REJECTED || newStatus == ListingStatus.SUSPENDED) {
            listing.setRejectionReason(reason != null ? reason.trim() : null);
        } else {
            listing.setRejectionReason(null);
        }
        listingRepository.save(listing);
        return getListingById(listingId);
    }

    private void validateAdminStatusTransition(ListingStatus currentStatus, ListingStatus newStatus, String reason) {
        if (newStatus == null) {
            throw new BadRequestException("Listing status is required.");
        }

        if (newStatus == ListingStatus.REJECTED && (reason == null || reason.isBlank())) {
            throw new BadRequestException("Rejection reason is required.");
        }

        if (newStatus == ListingStatus.ACTIVE) {
            if (currentStatus == ListingStatus.PENDING_REVIEW || currentStatus == ListingStatus.SUSPENDED || currentStatus == ListingStatus.INACTIVE) {
                return;
            }
            throw new BadRequestException("Only pending, suspended, or inactive listings can be activated by admin.");
        }

        if (newStatus == ListingStatus.REJECTED) {
            if (currentStatus == ListingStatus.PENDING_REVIEW) {
                return;
            }
            throw new BadRequestException("Only pending listings can be rejected.");
        }

        if (newStatus == ListingStatus.SUSPENDED) {
            if (currentStatus == ListingStatus.ACTIVE) {
                return;
            }
            throw new BadRequestException("Only active listings can be suspended.");
        }

        throw new BadRequestException("Unsupported admin listing status transition from " + currentStatus + " to " + newStatus + ".");
    }

    private List<AdminListingCategoryResponse> getAdminListingCategoryDistribution(long totalListings) {
        long safeTotal = Math.max(totalListings, 1L);
        return listingRepository.countByCategory().stream()
                .map(row -> {
                    ListingCategory category = (ListingCategory) row[0];
                    long count = (Long) row[1];
                    BigDecimal percentage = BigDecimal.valueOf(count * 100.0 / safeTotal).setScale(1, RoundingMode.HALF_UP);
                    return new AdminListingCategoryResponse(category != null ? category.name() : "OTHER", count, percentage);
                })
                .toList();
    }

    private Map<Long, Long> loadListingBookingCounts(List<Long> listingIds) {
        if (listingIds.isEmpty()) {
            return Map.of();
        }
        return bookingRepository.countBookingsByListingIds(listingIds).stream()
                .collect(Collectors.toMap(row -> (Long) row[0], row -> (Long) row[1], Long::sum));
    }

    private AdminListingResponse toAdminListingResponse(Listing listing, long bookingCount) {
        ProviderProfile provider = listing.getProvider();
        boolean providerVerified = provider != null && VerificationStatus.APPROVED.equals(provider.getVerificationStatus());
        return new AdminListingResponse(
                listing.getId(),
                listing.getTitle(),
                listing.getSlug(),
                listing.getCoverImageUrl(),
                provider != null ? provider.getId() : null,
                provider != null ? provider.getBusinessName() : null,
                providerVerified,
                listing.getCategory() != null ? listing.getCategory().name() : null,
                listing.getStatus() != null ? listing.getStatus().name() : null,
                listing.getCity(),
                listing.getCountry(),
                listing.getBasePrice(),
                listing.getCurrency(),
                resolvePriceUnit(listing.getCategory()),
                listing.getAverageRating() != null ? listing.getAverageRating() : BigDecimal.ZERO,
                listing.getReviewCount() != null ? listing.getReviewCount() : 0L,
                bookingCount,
                listing.getViewCount() != null ? listing.getViewCount() : 0L,
                listing.getCreatedAt(),
                listing.getUpdatedAt(),
                listing.getStatus() == ListingStatus.PENDING_REVIEW ? listing.getUpdatedAt() : listing.getCreatedAt()
        );
    }

    private Sort resolveAdminSort(String sort) {
        String property = "updatedAt";
        Sort.Direction direction = Sort.Direction.DESC;
        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",", 2);
            if (parts.length > 0 && ADMIN_SORT_ALLOWLIST.contains(parts[0])) {
                property = parts[0];
            }
            if (parts.length > 1 && "asc".equalsIgnoreCase(parts[1])) {
                direction = Sort.Direction.ASC;
            }
        }
        return Sort.by(direction, property);
    }

    private String resolvePriceUnit(ListingCategory category) {
        if (category == null) {
            return "booking";
        }
        return switch (category) {
            case HOTEL -> "night";
            case TOUR, EXPERIENCE -> "person";
            case VEHICLE -> "day";
            case RESTAURANT -> "booking";
        };
    }

    // ── Private Helpers ──────────────────────────────────────────

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private ProviderProfile getProviderProfile(Long userId) {
        return providerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Provider profile not found"));
    }

    private Listing getListingByIdInternal(Long id) {
        return listingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found with id: " + id));
    }

    private ListingCategory parseCategory(String category) {
        try {
            return ListingCategory.valueOf(category.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid listing category: " + category);
        }
    }

    private String generateSlug(String title) {
        if (title == null) return "listing-" + System.currentTimeMillis();
        
        String nonWhitespace = Pattern.compile("[\\s]").matcher(title).replaceAll("-");
        String normalized = Normalizer.normalize(nonWhitespace, Normalizer.Form.NFD);
        String slug = Pattern.compile("[^\\w-]").matcher(normalized).replaceAll("").toLowerCase(Locale.ENGLISH);
        
        // Ensure uniqueness
        String finalSlug = slug;
        int counter = 1;
        while (listingRepository.existsBySlug(finalSlug)) {
            finalSlug = slug + "-" + counter;
            counter++;
        }
        return finalSlug;
    }

    private List<ListingImage> saveImages(Listing listing, List<String> imageUrls) {
        List<ListingImage> saved = new ArrayList<>();
        if (imageUrls != null && !imageUrls.isEmpty()) {
            for (int i = 0; i < imageUrls.size(); i++) {
                ListingImage img = ListingImage.builder()
                        .listing(listing)
                        .imageUrl(imageUrls.get(i))
                        .displayOrder(i)
                        .isPrimary(i == 0) // First image is primary
                        .build();
                saved.add(listingImageRepository.save(img));
            }
        }
        return saved;
    }

    private Object saveDetailEntity(Listing listing, ListingCategory category, Map<String, Object> detailsMap) {
        if (detailsMap == null) return null;

        try {
            switch (category) {
                case HOTEL:
                    HotelDetail hotelDetail = objectMapper.convertValue(extractCategoryDetails(category, detailsMap), HotelDetail.class);
                    hotelDetail.setListing(listing);
                    return hotelDetailRepository.save(hotelDetail);
                case TOUR:
                    TourDetail tourDetail = objectMapper.convertValue(extractCategoryDetails(category, detailsMap), TourDetail.class);
                    tourDetail.setListing(listing);
                    return tourDetailRepository.save(tourDetail);
                case RESTAURANT:
                    RestaurantDetail restaurantDetail = objectMapper.convertValue(extractCategoryDetails(category, detailsMap), RestaurantDetail.class);
                    restaurantDetail.setListing(listing);
                    return restaurantDetailRepository.save(restaurantDetail);
                case VEHICLE:
                    VehicleDetail vehicleDetail = objectMapper.convertValue(extractCategoryDetails(category, detailsMap), VehicleDetail.class);
                    vehicleDetail.setListing(listing);
                    return vehicleDetailRepository.save(vehicleDetail);
                case EXPERIENCE:
                    ExperienceDetail experienceDetail = objectMapper.convertValue(extractCategoryDetails(category, detailsMap), ExperienceDetail.class);
                    experienceDetail.setListing(listing);
                    return experienceDetailRepository.save(experienceDetail);
                default:
                    return null;
            }
        } catch (Exception e) {
            log.error("Failed to parse detail entity from map", e);
            throw new BadRequestException("Invalid details provided for category " + category);
        }
    }

    private Object getDetailEntity(Listing listing) {
        switch (listing.getCategory()) {
            case HOTEL:
                return hotelDetailRepository.findByListingId(listing.getId()).orElse(null);
            case TOUR:
                return tourDetailRepository.findByListingId(listing.getId()).orElse(null);
            case RESTAURANT:
                return restaurantDetailRepository.findByListingId(listing.getId()).orElse(null);
            case VEHICLE:
                return vehicleDetailRepository.findByListingId(listing.getId()).orElse(null);
            case EXPERIENCE:
                return experienceDetailRepository.findByListingId(listing.getId()).orElse(null);
            default:
                return null;
        }
    }

    private Object updateDetailEntity(Listing listing, Object currentDetail, Map<String, Object> newDetailsMap) {
        // Simple approach: parse map to new object, copy ID and save
        try {
            switch (listing.getCategory()) {
                case HOTEL:
                    HotelDetail newHotel = objectMapper.convertValue(extractCategoryDetails(listing.getCategory(), newDetailsMap), HotelDetail.class);
                    if (currentDetail != null) newHotel.setId(((HotelDetail)currentDetail).getId());
                    newHotel.setListing(listing);
                    return hotelDetailRepository.save(newHotel);
                case TOUR:
                    TourDetail newTour = objectMapper.convertValue(extractCategoryDetails(listing.getCategory(), newDetailsMap), TourDetail.class);
                    if (currentDetail != null) newTour.setId(((TourDetail)currentDetail).getId());
                    newTour.setListing(listing);
                    return tourDetailRepository.save(newTour);
                case RESTAURANT:
                    RestaurantDetail newRestaurant = objectMapper.convertValue(extractCategoryDetails(listing.getCategory(), newDetailsMap), RestaurantDetail.class);
                    if (currentDetail != null) newRestaurant.setId(((RestaurantDetail)currentDetail).getId());
                    newRestaurant.setListing(listing);
                    return restaurantDetailRepository.save(newRestaurant);
                case VEHICLE:
                    VehicleDetail newVehicle = objectMapper.convertValue(extractCategoryDetails(listing.getCategory(), newDetailsMap), VehicleDetail.class);
                    if (currentDetail != null) newVehicle.setId(((VehicleDetail)currentDetail).getId());
                    newVehicle.setListing(listing);
                    return vehicleDetailRepository.save(newVehicle);
                case EXPERIENCE:
                    ExperienceDetail newExperience = objectMapper.convertValue(extractCategoryDetails(listing.getCategory(), newDetailsMap), ExperienceDetail.class);
                    if (currentDetail != null) newExperience.setId(((ExperienceDetail)currentDetail).getId());
                    newExperience.setListing(listing);
                    return experienceDetailRepository.save(newExperience);
                default:
                    return currentDetail;
            }
        } catch (Exception e) {
            log.error("Failed to update detail entity from map", e);
            throw new BadRequestException("Invalid details provided for category " + listing.getCategory());
        }
    }

    private Map<String, Object> extractCategoryDetails(ListingCategory category, Map<String, Object> detailsMap) {
        return filterDetails(detailsMap, categoryKeys(category), true);
    }

    private Map<String, Object> extractExtraDetails(ListingCategory category, Map<String, Object> detailsMap) {
        return filterDetails(detailsMap, categoryKeys(category), false);
    }

    private Map<String, Object> filterDetails(Map<String, Object> detailsMap, Set<String> allowedKeys, boolean keepAllowed) {
        Map<String, Object> filtered = new LinkedHashMap<>();
        if (detailsMap == null) return filtered;
        for (Map.Entry<String, Object> entry : detailsMap.entrySet()) {
            if (entry.getValue() == null) continue;
            boolean isAllowed = allowedKeys.contains(entry.getKey());
            if ((keepAllowed && isAllowed) || (!keepAllowed && !isAllowed)) {
                filtered.put(entry.getKey(), entry.getValue());
            }
        }
        return filtered;
    }

    private Set<String> categoryKeys(ListingCategory category) {
        switch (category) {
            case HOTEL:
                return HOTEL_DETAIL_KEYS;
            case TOUR:
                return TOUR_DETAIL_KEYS;
            case RESTAURANT:
                return RESTAURANT_DETAIL_KEYS;
            case VEHICLE:
                return VEHICLE_DETAIL_KEYS;
            case EXPERIENCE:
                return EXPERIENCE_DETAIL_KEYS;
            default:
                return Set.of();
        }
    }
}
