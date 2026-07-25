package com.travel.marketplace.modules.ai.assistant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssistantResponse {
    public enum AssistantResponseType {
        TEXT,
        LISTING_RESULT,
        RECOMMENDATIONS,
        ITINERARY,
        CLARIFICATION,
        ERROR
    }

    @Builder.Default
    private boolean success = true;

    /**
     * TEXT for normal chat, RECOMMENDATIONS for listing suggestions, ITINERARY for a rich travel plan card.
     */
    @Builder.Default
    private String type = AssistantResponseType.TEXT.name();

    private String intent;
    private String purpose;
    private Double confidence;
    private Boolean contextUsed;

    private String message;

    private String reply;

    /** Optional suggested follow-up actions/questions */
    private List<String> suggestedActions;

    private List<String> suggestions;

    private String destination;
    private String heroImageUrl;
    private String summary;
    @Builder.Default
    private List<ListingRecommendation> recommendations = new ArrayList<>();
    private List<String> followUpSuggestions;
    private Map<String, Object> extractedContext;

    private ItineraryCard itineraryCard;

    /** Alias used by the newer rich-message contract. */
    private ItineraryCard itinerary;

    private TripDraft tripDraft;

    private BudgetAdvice budgetAdvice;

    private boolean mockedAi;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItineraryCard {
        private String title;
        private String destination;
        private Integer durationDays;
        private Integer durationNights;
        private LocalDate startDate;
        private LocalDate endDate;
        private String durationText;
        private String travelerText;
        private String budgetText;
        private Integer travelerCount;
        private BudgetSummary budget;
        private String bestTimeText;
        private String summary;
        private String heroImageUrl;
        private String mapLabel;
        private String mapImageUrl;
        @Builder.Default
        private List<ListingRecommendation> listingRecommendations = new ArrayList<>();
        @Builder.Default
        private List<ListingRecommendation> recommendedListings = new ArrayList<>();
        @Builder.Default
        private List<ItineraryDay> days = new ArrayList<>();
        @Builder.Default
        private List<String> followUpSuggestions = new ArrayList<>();
        private Boolean insufficientMarketplaceData;
        @Builder.Default
        private List<String> missingCategories = new ArrayList<>();
        private String groundingMode;
        private String draftId;
        private Instant draftExpiresAt;
        private Boolean supportsTripSave;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TripDraft {
        private String draftId;
        private String title;
        private String destination;
        private Integer durationDays;
        private Integer durationNights;
        private LocalDate startDate;
        private LocalDate endDate;
        private Integer travelerCount;
        private BudgetSummary budget;
        private String summary;
        private String heroImageUrl;
        @Builder.Default
        private List<ItineraryDay> days = new ArrayList<>();
        @Builder.Default
        private List<ListingRecommendation> marketplacePicks = new ArrayList<>();
        @Builder.Default
        private List<String> missingCategories = new ArrayList<>();
        private Boolean feasible;
        private Instant expiresAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BudgetSummary {
        private java.math.BigDecimal requestedTotal;
        private java.math.BigDecimal estimatedTotal;
        private java.math.BigDecimal total;
        private String currency;
        private Boolean feasible;
        private Boolean withinBudget;
        private BudgetBreakdown breakdown;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BudgetBreakdown {
        private java.math.BigDecimal accommodation;
        private java.math.BigDecimal food;
        private java.math.BigDecimal transport;
        private java.math.BigDecimal activities;
        private java.math.BigDecimal buffer;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BudgetAdvice {
        private java.math.BigDecimal requestedTotal;
        private java.math.BigDecimal minimumEstimatedBudget;
        private String currency;
        @Builder.Default
        private List<String> alternatives = new ArrayList<>();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ListingRecommendation {
        private Long id;
        private String title;
        private String name;
        private String category;
        private String imageUrl;
        private String location;
        private String priceText;
        private java.math.BigDecimal price;
        private String currency;
        private String priceUnit;
        private java.math.BigDecimal rating;
        private Integer reviewCount;
        private String slug;
        private String ratingText;
        private String shortDescription;
        private String providerName;
        private String source;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItineraryDay {
        private int dayNumber;
        private String title;
        private String shortLabel;
        private String shortDescription;
        private String morning;
        private String afternoon;
        private String evening;
        private String imageUrl;
        private String highlightImageUrl;
        private List<Long> relatedListingIds;
    }
}
