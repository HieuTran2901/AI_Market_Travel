package com.travel.marketplace.modules.trip.service;

import com.travel.marketplace.exception.BusinessException;
import com.travel.marketplace.exception.ErrorCode;
import com.travel.marketplace.modules.ai.assistant.dto.AssistantResponse;
import com.travel.marketplace.modules.listing.entity.Listing;
import com.travel.marketplace.modules.listing.enums.ListingStatus;
import com.travel.marketplace.modules.listing.repository.ListingRepository;
import com.travel.marketplace.modules.trip.dto.*;
import com.travel.marketplace.modules.trip.entity.Trip;
import com.travel.marketplace.modules.trip.entity.TripActivity;
import com.travel.marketplace.modules.trip.entity.TripDay;
import com.travel.marketplace.modules.trip.enums.TripSource;
import com.travel.marketplace.modules.trip.enums.TripStatus;
import com.travel.marketplace.modules.trip.repository.TripActivityRepository;
import com.travel.marketplace.modules.trip.repository.TripRepository;
import com.travel.marketplace.modules.user.entity.User;
import com.travel.marketplace.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class AiTripDraftService {

    private static final Duration DRAFT_TTL = Duration.ofMinutes(45);

    private final TripRepository tripRepository;
    private final TripActivityRepository tripActivityRepository;
    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final Map<UUID, DraftRecord> drafts = new ConcurrentHashMap<>();

    public AssistantResponse.TripDraft createDraft(Long userId, AssistantResponse.ItineraryCard card) {
        UUID draftId = UUID.randomUUID();
        Instant expiresAt = Instant.now().plus(DRAFT_TTL);
        AssistantResponse.TripDraft draft = toDraft(draftId, card, expiresAt);
        drafts.put(draftId, new DraftRecord(userId, card, draft, expiresAt, null));
        return draft;
    }

    @Transactional
    public TripSaveResponse confirmDraft(UUID draftId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND));
        DraftRecord draft = drafts.get(draftId);
        if (draft == null) {
            Optional<Trip> existing = tripRepository.findByAiDraftIdAndUserId(draftId.toString(), user.getId());
            if (existing.isPresent()) {
                return TripSaveResponse.builder().success(true).trip(toResponse(existing.get())).build();
            }
            throw new BusinessException(ErrorCode.DRAFT_NOT_FOUND, "Trip draft was not found.", HttpStatus.NOT_FOUND);
        }
        if (draft.userId() != null && !draft.userId().equals(user.getId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "You cannot save this draft.", HttpStatus.FORBIDDEN);
        }
        if (draft.savedTripId() != null) {
            Trip existing = tripRepository.findById(draft.savedTripId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.TRIP_SAVE_FAILED, "Saved trip was not found.", HttpStatus.INTERNAL_SERVER_ERROR));
            return TripSaveResponse.builder().success(true).trip(toResponse(existing)).build();
        }
        if (Instant.now().isAfter(draft.expiresAt())) {
            drafts.remove(draftId);
            throw new BusinessException(ErrorCode.DRAFT_EXPIRED, "Trip draft has expired. Please generate it again.", HttpStatus.GONE);
        }

        AssistantResponse.ItineraryCard card = draft.card();
        Set<Long> referencedIds = collectListingIds(card);
        Map<Long, Listing> activeListings = listingRepository.findAllById(referencedIds).stream()
                .filter(listing -> listing.getStatus() == ListingStatus.ACTIVE)
                .collect(Collectors.toMap(Listing::getId, listing -> listing));
        if (!referencedIds.isEmpty() && activeListings.isEmpty()) {
            throw new BusinessException(ErrorCode.NO_ACTIVE_LISTINGS, "No active marketplace services remain available for this draft.", HttpStatus.CONFLICT);
        }

        Trip trip = Trip.builder()
                .user(user)
                .aiDraftId(draftId.toString())
                .title(firstNonBlank(card.getTitle(), card.getDestination() + " Trip"))
                .slug(uniqueSlug(card.getDestination(), card.getTitle()))
                .destination(firstNonBlank(card.getDestination(), "Your trip"))
                .startDate(card.getStartDate())
                .endDate(card.getEndDate())
                .durationDays(card.getDurationDays() == null ? Math.max(1, card.getDays().size()) : card.getDurationDays())
                .durationNights(card.getDurationNights() == null ? Math.max(0, Math.max(1, card.getDays().size()) - 1) : card.getDurationNights())
                .travelerCount(card.getTravelerCount() == null ? 1 : card.getTravelerCount())
                .budget(card.getBudget() == null ? null : card.getBudget().getRequestedTotal())
                .estimatedCost(recalculateEstimatedCost(card, activeListings))
                .currency(card.getBudget() == null ? "VND" : firstNonBlank(card.getBudget().getCurrency(), "VND"))
                .summary(card.getSummary())
                .heroImageUrl(card.getHeroImageUrl())
                .status(TripStatus.UPCOMING)
                .createdSource(TripSource.AI)
                .build();

        List<AssistantResponse.ItineraryDay> sourceDays = card.getDays() == null ? List.of() : card.getDays();
        for (AssistantResponse.ItineraryDay sourceDay : sourceDays) {
            TripDay day = TripDay.builder()
                    .dayNumber(sourceDay.getDayNumber())
                    .title(firstNonBlank(sourceDay.getTitle(), "Day " + sourceDay.getDayNumber()))
                    .summary(firstNonBlank(sourceDay.getShortDescription(), "A grounded day from your AI trip draft."))
                    .imageUrl(firstNonBlank(sourceDay.getImageUrl(), sourceDay.getHighlightImageUrl()))
                    .build();
            addActivity(day, 1, "MORNING", sourceDay.getMorning(), firstRelatedListing(sourceDay, activeListings));
            addActivity(day, 2, "AFTERNOON", sourceDay.getAfternoon(), firstRelatedListing(sourceDay, activeListings));
            addActivity(day, 3, "EVENING", sourceDay.getEvening(), null);
            trip.addDay(day);
        }

        Trip saved = tripRepository.save(trip);
        drafts.put(draftId, new DraftRecord(user.getId(), card, draft.draft(), draft.expiresAt(), saved.getId()));
        return TripSaveResponse.builder().success(true).trip(toResponse(saved)).build();
    }

    @Transactional(readOnly = true)
    public List<TripResponse> listTrips(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND));
        return tripRepository.findAllByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TripResponse getTrip(String slug, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND));
        Trip trip = tripRepository.findDetailWithDaysBySlugAndUserId(slug, user.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Trip not found", HttpStatus.NOT_FOUND));
        List<Long> dayIds = trip.getDays() == null ? List.of() : trip.getDays().stream()
                .map(TripDay::getId)
                .filter(Objects::nonNull)
                .toList();
        Map<Long, List<TripActivity>> activitiesByDayId = dayIds.isEmpty()
                ? Map.of()
                : tripActivityRepository.findAllByTripDayIds(dayIds).stream()
                        .collect(Collectors.groupingBy(activity -> activity.getDay().getId(), LinkedHashMap::new, Collectors.toList()));
        return toResponse(trip, activitiesByDayId);
    }

    private AssistantResponse.TripDraft toDraft(UUID draftId, AssistantResponse.ItineraryCard card, Instant expiresAt) {
        return AssistantResponse.TripDraft.builder()
                .draftId(draftId.toString())
                .title(card.getTitle())
                .destination(card.getDestination())
                .durationDays(card.getDurationDays())
                .durationNights(card.getDurationNights())
                .startDate(card.getStartDate())
                .endDate(card.getEndDate())
                .travelerCount(card.getTravelerCount())
                .budget(card.getBudget())
                .summary(card.getSummary())
                .heroImageUrl(card.getHeroImageUrl())
                .days(card.getDays())
                .marketplacePicks(card.getRecommendedListings())
                .missingCategories(card.getMissingCategories())
                .feasible(card.getBudget() == null || Boolean.TRUE.equals(card.getBudget().getFeasible()))
                .expiresAt(expiresAt)
                .build();
    }

    private void addActivity(TripDay day, int order, String timeOfDay, String description, Listing listing) {
        if ((description == null || description.isBlank()) && listing == null) {
            return;
        }
        day.addActivity(TripActivity.builder()
                .displayOrder(order)
                .timeOfDay(timeOfDay)
                .title(listing == null ? timeOfDay.substring(0, 1) + timeOfDay.substring(1).toLowerCase(Locale.ROOT) : listing.getTitle())
                .description(firstNonBlank(description, listing == null ? null : listing.getShortDesc(), "Trip activity"))
                .listing(listing)
                .estimatedCost(listing == null ? null : listing.getBasePrice())
                .build());
    }

    private Listing firstRelatedListing(AssistantResponse.ItineraryDay day, Map<Long, Listing> listings) {
        for (Long id : day.getRelatedListingIds() == null ? List.<Long>of() : day.getRelatedListingIds()) {
            Listing listing = listings.get(id);
            if (listing != null) return listing;
        }
        return null;
    }

    private Set<Long> collectListingIds(AssistantResponse.ItineraryCard card) {
        Set<Long> ids = new LinkedHashSet<>();
        if (card.getRecommendedListings() != null) {
            card.getRecommendedListings().stream().map(AssistantResponse.ListingRecommendation::getId).filter(Objects::nonNull).forEach(ids::add);
        }
        if (card.getDays() != null) {
            card.getDays().stream()
                    .flatMap(day -> (day.getRelatedListingIds() == null ? List.<Long>of() : day.getRelatedListingIds()).stream())
                    .forEach(ids::add);
        }
        return ids;
    }

    private BigDecimal recalculateEstimatedCost(AssistantResponse.ItineraryCard card, Map<Long, Listing> listings) {
        BigDecimal budgetTotal = totalFromBudgetSummary(card.getBudget());
        if (budgetTotal.signum() > 0) {
            return budgetTotal;
        }
        return collectListingIds(card).stream()
                .map(listings::get)
                .filter(Objects::nonNull)
                .map(Listing::getBasePrice)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal totalFromBudgetSummary(AssistantResponse.BudgetSummary budget) {
        if (budget == null) {
            return BigDecimal.ZERO;
        }
        BigDecimal explicitTotal = firstPositive(budget.getTotal(), budget.getEstimatedTotal());
        if (explicitTotal.signum() > 0) {
            return explicitTotal;
        }
        AssistantResponse.BudgetBreakdown breakdown = budget.getBreakdown();
        if (breakdown == null) {
            return BigDecimal.ZERO;
        }
        return safe(breakdown.getAccommodation())
                .add(safe(breakdown.getFood()))
                .add(safe(breakdown.getTransport()))
                .add(safe(breakdown.getActivities()))
                .add(safe(breakdown.getBuffer()));
    }

    private BigDecimal firstPositive(BigDecimal... values) {
        for (BigDecimal value : values) {
            if (value != null && value.signum() > 0) {
                return value;
            }
        }
        return BigDecimal.ZERO;
    }

    private BigDecimal safe(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private TripResponse toResponse(Trip trip) {
        return toResponse(trip, null);
    }

    private TripResponse toResponse(Trip trip, Map<Long, List<TripActivity>> activitiesByDayId) {
        List<TripDayResponse> days = trip.getDays() == null ? List.of() : trip.getDays().stream()
                .map(day -> TripDayResponse.builder()
                        .dayNumber(day.getDayNumber())
                        .title(day.getTitle())
                        .summary(day.getSummary())
                        .imageUrl(day.getImageUrl())
                        .activities(resolveActivities(day, activitiesByDayId).stream()
                                .map(activity -> TripActivityResponse.builder()
                                        .timeOfDay(activity.getTimeOfDay())
                                        .title(activity.getTitle())
                                        .description(activity.getDescription())
                                        .listingId(activity.getListing() == null ? null : activity.getListing().getId())
                                        .listingSlug(activity.getListing() == null ? null : activity.getListing().getSlug())
                                        .estimatedCost(activity.getEstimatedCost())
                                        .build())
                                .toList())
                        .build())
                .toList();
        BigDecimal estimatedCost = repairedEstimatedCost(trip, days);
        return TripResponse.builder()
                .id(trip.getId())
                .slug(trip.getSlug())
                .title(trip.getTitle())
                .destination(trip.getDestination())
                .startDate(trip.getStartDate())
                .endDate(trip.getEndDate())
                .durationDays(trip.getDurationDays())
                .durationNights(trip.getDurationNights())
                .durationText(trip.getDurationDays() + "D / " + trip.getDurationNights() + "N")
                .travelerCount(trip.getTravelerCount())
                .budget(trip.getBudget())
                .estimatedCost(estimatedCost)
                .currency(trip.getCurrency())
                .summary(trip.getSummary())
                .heroImageUrl(trip.getHeroImageUrl())
                .status(trip.getStatus().name())
                .detailPath("/trips/" + trip.getSlug())
                .days(days)
                .build();
    }

    private BigDecimal repairedEstimatedCost(Trip trip, List<TripDayResponse> days) {
        BigDecimal stored = trip.getEstimatedCost();
        if (stored != null && stored.signum() > 0) {
            return stored;
        }
        BigDecimal activityTotal = days == null ? BigDecimal.ZERO : days.stream()
                .flatMap(day -> day.activities() == null ? Stream.<TripActivityResponse>empty() : day.activities().stream())
                .map(TripActivityResponse::estimatedCost)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return activityTotal.signum() > 0 ? activityTotal : stored;
    }

    private List<TripActivity> resolveActivities(TripDay day, Map<Long, List<TripActivity>> activitiesByDayId) {
        if (activitiesByDayId != null) {
            return activitiesByDayId.getOrDefault(day.getId(), List.of());
        }
        return day.getActivities() == null ? List.of() : day.getActivities();
    }

    private String uniqueSlug(String destination, String title) {
        String base = slugify(firstNonBlank(title, destination, "trip"));
        String slug = base;
        int suffix = 2;
        while (tripRepository.existsBySlug(slug)) {
            slug = base + "-" + suffix++;
        }
        return slug;
    }

    private String slugify(String value) {
        String normalized = Normalizer.normalize(value.toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace('đ', 'd')
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        return normalized.isBlank() ? "trip" : normalized;
    }

    private String firstNonBlank(String... values) {
        if (values == null) return null;
        for (String value : values) {
            if (value != null && !value.isBlank()) return value.trim();
        }
        return null;
    }

    private record DraftRecord(
            Long userId,
            AssistantResponse.ItineraryCard card,
            AssistantResponse.TripDraft draft,
            Instant expiresAt,
            Long savedTripId
    ) {}
}
