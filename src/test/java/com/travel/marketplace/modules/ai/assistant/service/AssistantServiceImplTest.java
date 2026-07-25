package com.travel.marketplace.modules.ai.assistant.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.travel.marketplace.modules.ai.assistant.dto.AssistantRequest;
import com.travel.marketplace.modules.ai.assistant.dto.AssistantResponse;
import com.travel.marketplace.modules.ai.prompt.PromptTemplateRegistry;
import com.travel.marketplace.modules.ai.provider.AiProvider;
import com.travel.marketplace.modules.ai.provider.AiRequest;
import com.travel.marketplace.modules.ai.provider.AiResponse;
import com.travel.marketplace.modules.listing.dto.ListingResponse;
import com.travel.marketplace.modules.trip.service.AiTripDraftService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentCaptor.forClass;
import org.mockito.ArgumentCaptor;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class AssistantServiceImplTest {

    private AiProvider aiProvider;
    private MarketplaceAiContextService marketplaceAiContextService;
    private PromptTemplateRegistry promptRegistry;
    private AiTripDraftService aiTripDraftService;
    private AssistantServiceImpl service;

    @BeforeEach
    void setUp() {
        aiProvider = mock(AiProvider.class);
        marketplaceAiContextService = mock(MarketplaceAiContextService.class);
        promptRegistry = mock(PromptTemplateRegistry.class);
        aiTripDraftService = mock(AiTripDraftService.class);
        when(aiTripDraftService.createDraft(any(), any())).thenAnswer(invocation -> {
            AssistantResponse.ItineraryCard card = invocation.getArgument(1);
            return AssistantResponse.TripDraft.builder()
                    .draftId("00000000-0000-0000-0000-000000000001")
                    .title(card.getTitle())
                    .destination(card.getDestination())
                    .durationDays(card.getDurationDays())
                    .durationNights(card.getDurationNights())
                    .travelerCount(card.getTravelerCount())
                    .budget(card.getBudget())
                    .summary(card.getSummary())
                    .heroImageUrl(card.getHeroImageUrl())
                    .days(card.getDays())
                    .marketplacePicks(card.getRecommendedListings())
                    .missingCategories(card.getMissingCategories())
                    .feasible(card.getBudget() == null || Boolean.TRUE.equals(card.getBudget().getFeasible()))
                    .expiresAt(java.time.Instant.now().plusSeconds(2700))
                    .build();
        });
        service = new AssistantServiceImpl(
                aiProvider,
                marketplaceAiContextService,
                promptRegistry,
                new StructuredAssistantResponseParser(new ObjectMapper()),
                new DestinationImageResolver(),
                aiTripDraftService
        );
    }

    @Test
    void vietnameseGreetingReturnsTextWithoutMarketplaceLookup() {
        AssistantResponse response = service.chat(request("chào bạn"));

        assertThat(response.getType()).isEqualTo("TEXT");
        assertThat(response.getIntent()).isEqualTo("GREETING");
        assertThat(response.getPurpose()).isEqualTo("GREETING");
        assertThat(response.getContextUsed()).isFalse();
        assertThat(response.getRecommendations()).isEmpty();
        verifyNoInteractions(marketplaceAiContextService, aiProvider, promptRegistry);
    }

    @Test
    void englishGreetingReturnsTextWithoutMarketplaceLookup() {
        AssistantResponse response = service.chat(request("hello"));

        assertThat(response.getType()).isEqualTo("TEXT");
        assertThat(response.getIntent()).isEqualTo("GREETING");
        assertThat(response.getRecommendations()).isEmpty();
        verifyNoInteractions(marketplaceAiContextService, aiProvider, promptRegistry);
    }

    @Test
    void assistantIdentityQuestionReturnsTextWithoutMarketplaceLookup() {
        AssistantResponse response = service.chat(request("ban la ai?"));

        assertThat(response.getType()).isEqualTo("TEXT");
        assertThat(response.getIntent()).isEqualTo("ASSISTANT_IDENTITY");
        assertThat(response.getRecommendations()).isEmpty();
        verifyNoInteractions(marketplaceAiContextService, aiProvider, promptRegistry);
    }

    @Test
    void assistantCapabilitiesQuestionReturnsTextWithoutMarketplaceLookup() {
        AssistantResponse response = service.chat(request("ban co the lam gi?"));

        assertThat(response.getType()).isEqualTo("TEXT");
        assertThat(response.getIntent()).isEqualTo("ASSISTANT_CAPABILITIES");
        assertThat(response.getRecommendations()).isEmpty();
        verifyNoInteractions(marketplaceAiContextService, aiProvider, promptRegistry);
    }

    @Test
    void databaseCapabilityQuestionReturnsTextEvenWithPriorItineraryContext() {
        AssistantResponse response = service.chat(AssistantRequest.builder()
                .message("ban co the doc du lieu database khong?")
                .history(List.of())
                .extractedContext(Map.of(
                        "destination", "Ha Noi",
                        "responseMode", "itinerary",
                        "wantsItinerary", true
                ))
                .build());

        assertThat(response.getType()).isEqualTo("TEXT");
        assertThat(response.getIntent()).isEqualTo("ASSISTANT_CAPABILITIES");
        assertThat(response.getRecommendations()).isEmpty();
        assertThat(response.getItineraryCard()).isNull();
        verifyNoInteractions(marketplaceAiContextService, aiProvider, promptRegistry);
    }

    @Test
    void staleItineraryContextDoesNotTurnGeneralQuestionIntoItinerary() {
        when(promptRegistry.render(eq("assistant"), any())).thenReturn("assistant prompt");
        when(aiProvider.complete(any(AiRequest.class))).thenReturn(AiResponse.builder()
                .text("Da Nang has beaches, bridges, seafood, and nearby cultural day trips.")
                .build());

        AssistantResponse response = service.chat(AssistantRequest.builder()
                .message("Da Nang co gi dep?")
                .history(List.of())
                .extractedContext(Map.of(
                        "destination", "Da Nang",
                        "responseMode", "itinerary",
                        "wantsItinerary", true
                ))
                .build());

        assertThat(response.getType()).isEqualTo("TEXT");
        assertThat(response.getIntent()).isEqualTo("GENERAL_TRAVEL_QUESTION");
        assertThat(response.getItineraryCard()).isNull();
        verify(marketplaceAiContextService, never()).search(any());
        verify(aiProvider).complete(any(AiRequest.class));
    }

    @Test
    void generalDestinationQuestionDoesNotAttachListingCards() {
        when(promptRegistry.render(eq("assistant"), any())).thenReturn("assistant prompt");
        when(aiProvider.complete(any(AiRequest.class))).thenReturn(AiResponse.builder()
                .text("Da Nang is known for beaches, bridges, seafood, and easy day trips.")
                .build());

        AssistantResponse response = service.chat(request("Da Nang co gi dep?"));

        assertThat(response.getType()).isEqualTo("TEXT");
        assertThat(response.getIntent()).isEqualTo("GENERAL_TRAVEL_QUESTION");
        assertThat(response.getContextUsed()).isFalse();
        assertThat(response.getRecommendations()).isEmpty();
        verify(marketplaceAiContextService, never()).search(any());
    }

    @Test
    void marketplaceSearchUsesRealListingContextOnlyForSearchIntent() {
        ListingResponse listing = listing(42L, "Ocean View Resort Da Nang", "HOTEL");
        when(marketplaceAiContextService.search(any())).thenReturn(List.of(listing));
        when(aiProvider.complete(any(AiRequest.class))).thenReturn(AiResponse.builder()
                .text("""
                        {
                          "message": "I found one active stay in Da Nang.",
                          "destination": "Da Nang",
                          "summary": "Grounded in active marketplace listings.",
                          "listingIds": [42],
                          "followUpSuggestions": ["Build an itinerary"]
                        }
                        """)
                .build());

        AssistantResponse response = service.chat(request("Co khach san nao o Da Nang duoi 1 trieu?"));

        assertThat(response.getType()).isEqualTo("RECOMMENDATIONS");
        assertThat(response.getIntent()).isEqualTo("MARKETPLACE_SEARCH");
        assertThat(response.getContextUsed()).isTrue();
        assertThat(response.getRecommendations()).extracting(AssistantResponse.ListingRecommendation::getId).containsExactly(42L);
        assertThat(response.getRecommendations()).extracting(AssistantResponse.ListingRecommendation::getSlug).containsExactly("ocean-view-resort-da-nang");
        assertThat(response.getRecommendations()).extracting(AssistantResponse.ListingRecommendation::getSource).containsExactly("DATABASE");
        verify(marketplaceAiContextService).search(any());
    }

    @Test
    void exactListingSearchIsGlobalAndIgnoresStaleDestinationContext() {
        ListingResponse listing = listing(77L, "Riverside Seafood Restaurant", "RESTAURANT");
        when(marketplaceAiContextService.search(any())).thenReturn(List.of(listing));

        AssistantResponse response = service.chat(AssistantRequest.builder()
                .message("Riverside Seafood Restaurant")
                .history(List.of())
                .extractedContext(Map.of(
                        "destination", "Da Nang",
                        "responseMode", "recommendation"
                ))
                .build());

        ArgumentCaptor<MarketplaceAiContextService.MarketplaceQueryContext> captor = forClass(MarketplaceAiContextService.MarketplaceQueryContext.class);
        verify(marketplaceAiContextService).search(captor.capture());
        assertThat(response.getType()).isEqualTo("LISTING_RESULT");
        assertThat(response.getIntent()).isEqualTo("EXACT_LISTING_SEARCH");
        assertThat(response.getRecommendations()).extracting(AssistantResponse.ListingRecommendation::getId).containsExactly(77L);
        assertThat(response.getRecommendations()).extracting(AssistantResponse.ListingRecommendation::getSlug).containsExactly("riverside-seafood-restaurant");
        assertThat(captor.getValue().destination()).isNull();
        assertThat(captor.getValue().listingName()).isEqualTo("Riverside Seafood Restaurant");
        verifyNoInteractions(aiProvider, promptRegistry);
    }

    @Test
    void restaurantSearchInDaNangUsesDestinationAndRestaurantCategory() {
        ListingResponse listing = listing(88L, "Riverside Seafood Restaurant", "RESTAURANT");
        when(marketplaceAiContextService.search(any())).thenReturn(List.of(listing));
        when(aiProvider.complete(any(AiRequest.class))).thenReturn(AiResponse.builder()
                .text("""
                        {
                          "message": "I found restaurant options in Da Nang.",
                          "destination": "Da Nang",
                          "summary": "Restaurant matches.",
                          "listingIds": [88],
                          "followUpSuggestions": ["Add to itinerary"]
                        }
                        """)
                .build());

        AssistantResponse response = service.chat(request("Nha hang o Da Nang"));

        ArgumentCaptor<MarketplaceAiContextService.MarketplaceQueryContext> captor = forClass(MarketplaceAiContextService.MarketplaceQueryContext.class);
        verify(marketplaceAiContextService).search(captor.capture());
        assertThat(response.getType()).isEqualTo("RECOMMENDATIONS");
        assertThat(response.getIntent()).isEqualTo("RECOMMENDATION_REQUEST");
        assertThat(captor.getValue().destination()).isEqualTo("Da Nang");
        assertThat(captor.getValue().categories()).contains("RESTAURANT");
    }

    @Test
    void genericHotelRecommendationWithoutDestinationAsksClarificationWithoutLookup() {
        AssistantResponse response = service.chat(request("Goi y khach san"));

        assertThat(response.getType()).isEqualTo("CLARIFICATION");
        assertThat(response.getIntent()).isEqualTo("MARKETPLACE_SEARCH");
        assertThat(response.getContextUsed()).isFalse();
        assertThat(response.getRecommendations()).isEmpty();
        verifyNoInteractions(marketplaceAiContextService, aiProvider, promptRegistry);
    }

    @Test
    void greetingAfterRecommendationContextDoesNotReplayStaleCards() {
        AssistantResponse response = service.chat(AssistantRequest.builder()
                .message("xin chao")
                .history(List.of())
                .extractedContext(Map.of(
                        "destination", "Da Nang",
                        "responseMode", "recommendation"
                ))
                .build());

        assertThat(response.getType()).isEqualTo("TEXT");
        assertThat(response.getIntent()).isEqualTo("GREETING");
        assertThat(response.getRecommendations()).isEmpty();
        verifyNoInteractions(marketplaceAiContextService, aiProvider, promptRegistry);
    }

    @Test
    void cheapFollowUpWithoutPriorTripContextAsksForClarificationWithoutLookup() {
        AssistantResponse response = service.chat(request("Re hon"));

        assertThat(response.getType()).isEqualTo("CLARIFICATION");
        assertThat(response.getIntent()).isEqualTo("GENERAL_TRAVEL_QUESTION");
        assertThat(response.getRecommendations()).isEmpty();
        verifyNoInteractions(marketplaceAiContextService, aiProvider, promptRegistry);
    }

    @Test
    void cheapFollowUpWithPriorItineraryContextKeepsStructuredRouting() {
        ListingResponse listing = listing(99L, "Blue Coast Hotel", "HOTEL");
        when(marketplaceAiContextService.search(any())).thenReturn(List.of(listing));
        when(aiProvider.complete(any(AiRequest.class))).thenReturn(AiResponse.builder()
                .text("""
                        {
                          "title": "Cheaper Da Nang trip",
                          "destination": "Da Nang",
                          "durationText": "3D / 2N",
                          "summary": "A lower-budget plan around Da Nang.",
                          "listingIds": [99],
                          "days": [
                            {
                              "dayNumber": 1,
                              "title": "Beach arrival",
                              "morning": "Arrive and check in.",
                              "afternoon": "Walk along the beach.",
                              "evening": "Try a casual seafood dinner.",
                              "relatedListingIds": [99]
                            }
                          ],
                          "followUpSuggestions": ["Add more food stops"]
                        }
                        """)
                .build());

        AssistantResponse response = service.chat(AssistantRequest.builder()
                .message("Re hon")
                .history(List.of())
                .extractedContext(Map.of(
                        "destination", "Da Nang",
                        "responseMode", "itinerary"
                ))
                .build());

        assertThat(response.getType()).isEqualTo("ITINERARY");
        assertThat(response.getIntent()).isEqualTo("ITINERARY_ADJUSTMENT");
        assertThat(response.getContextUsed()).isTrue();
        assertThat(response.getItineraryCard()).isNotNull();
        verify(marketplaceAiContextService).search(any());
    }

    @Test
    void vietnameseTripPlanningReturnsItineraryCard() {
        ListingResponse listing = listing(126L, "Ocean View Resort Da Nang", "HOTEL");
        when(marketplaceAiContextService.search(any())).thenReturn(List.of(listing));
        when(aiProvider.complete(any(AiRequest.class))).thenReturn(AiResponse.builder()
                .text("""
                        {
                          "title": "Lịch trình Đà Nẵng 3 ngày",
                          "destination": "Da Nang",
                          "durationText": "3 ngày / 2 đêm",
                          "summary": "Biển, ẩm thực và điểm ngắm cảnh nổi bật.",
                          "listingIds": [126],
                          "days": [
                            {
                              "dayNumber": 1,
                              "title": "Đến Đà Nẵng và nghỉ biển",
                              "morning": "Nhận phòng.",
                              "afternoon": "Đi dạo biển Mỹ Khê.",
                              "evening": "Ăn tối hải sản.",
                              "relatedListingIds": [126]
                            }
                          ],
                          "followUpSuggestions": ["Làm rẻ hơn"]
                        }
                        """)
                .build());

        AssistantResponse response = service.chat(request("Lập kế hoạch Đà Nẵng 3 ngày"));

        assertThat(response.getType()).isEqualTo("ITINERARY");
        assertThat(response.getIntent()).isEqualTo("TRIP_PLANNING");
        assertThat(response.getItineraryCard()).isNotNull();
        assertThat(response.getItineraryCard().getDestination()).isEqualTo("Da Nang");
        assertThat(response.getItineraryCard().getDurationDays()).isEqualTo(3);
        assertThat(response.getMessage()).doesNotContain("##").doesNotContain("---").doesNotContain("**");
    }

    @Test
    void hoiAnHotelRecommendationReturnsRecommendationCards() {
        ListingResponse listing = listing(127L, "Hoi An Boutique Stay", "HOTEL");
        listing.setCity("Hoi An");
        when(marketplaceAiContextService.search(any())).thenReturn(List.of(listing));
        when(aiProvider.complete(any(AiRequest.class))).thenReturn(AiResponse.builder()
                .text("""
                        {
                          "message": "Mình tìm thấy khách sạn phù hợp ở Hội An.",
                          "destination": "Hoi An",
                          "summary": "Các lựa chọn đang hoạt động trong marketplace.",
                          "listingIds": [127],
                          "followUpSuggestions": ["Lập lịch trình Hội An"]
                        }
                        """)
                .build());

        AssistantResponse response = service.chat(request("Gợi ý khách sạn Hội An"));

        assertThat(response.getType()).isEqualTo("RECOMMENDATIONS");
        assertThat(response.getIntent()).isEqualTo("MARKETPLACE_SEARCH");
        assertThat(response.getRecommendations()).extracting(AssistantResponse.ListingRecommendation::getId).containsExactly(127L);
        assertThat(response.getRecommendations()).extracting(AssistantResponse.ListingRecommendation::getSlug).containsExactly("hoi-an-boutique-stay");
    }

    @Test
    void itineraryPlanningReturnsCardEvenWhenProviderJsonCannotBeParsed() {
        ListingResponse listing = listing(123L, "Ocean View Resort Da Nang", "HOTEL");
        when(marketplaceAiContextService.search(any())).thenReturn(List.of(listing));
        when(aiProvider.complete(any(AiRequest.class))).thenReturn(AiResponse.builder()
                .text("Here is a markdown itinerary that is not valid JSON.")
                .build());

        AssistantResponse response = service.chat(request("Plan a 3 day trip to Da Nang"));

        assertThat(response.getType()).isEqualTo("ITINERARY");
        assertThat(response.getIntent()).isEqualTo("TRIP_PLANNING");
        assertThat(response.getItineraryCard()).isNotNull();
        assertThat(response.getItinerary()).isNotNull();
        assertThat(response.getItineraryCard().getDays()).isNotEmpty();
        assertThat(response.getItineraryCard().getListingRecommendations())
                .extracting(AssistantResponse.ListingRecommendation::getId)
                .contains(123L);
        assertThat(response.getMessage()).doesNotContain("##").doesNotContain("---").doesNotContain("**");
    }

    @Test
    void itineraryPlanningParsesFencedJsonWithoutRawMarkdown() {
        ListingResponse listing = listing(124L, "Ocean View Resort Da Nang", "HOTEL");
        when(marketplaceAiContextService.search(any())).thenReturn(List.of(listing));
        when(aiProvider.complete(any(AiRequest.class))).thenReturn(AiResponse.builder()
                .text("""
                        ```json
                        {
                          "title": "Da Nang visual trip",
                          "destination": "Da Nang",
                          "durationText": "3D / 2N",
                          "summary": "Beach, seafood, and city highlights.",
                          "listingIds": [124],
                          "days": [
                            {
                              "dayNumber": 1,
                              "title": "Beach arrival",
                              "morning": "Arrive and check in.",
                              "afternoon": "Walk My Khe Beach.",
                              "evening": "Seafood dinner.",
                              "relatedListingIds": [124]
                            }
                          ]
                        }
                        ```
                        """)
                .build());

        AssistantResponse response = service.chat(request("Plan a 3 day trip to Da Nang"));

        assertThat(response.getType()).isEqualTo("ITINERARY");
        assertThat(response.getItineraryCard().getTitle()).isEqualTo("Da Nang Marketplace Itinerary");
        assertThat(response.getItineraryCard().getDays()).hasSize(3);
        verify(aiProvider, times(1)).complete(any(AiRequest.class));
    }

    @Test
    void oneDayDaLatBudgetUsesOneDayAndBudgetSummary() {
        ListingResponse brunch = listing(201L, "Da Lat Garden Brunch", "RESTAURANT");
        brunch.setCity("Da Lat");
        brunch.setBasePrice(BigDecimal.valueOf(150000));
        when(marketplaceAiContextService.search(any())).thenReturn(List.of(brunch));
        when(aiProvider.complete(any(AiRequest.class))).thenReturn(AiResponse.builder()
                .text("""
                        {
                          "title": "Da Lat budget day",
                          "destination": "Da Lat",
                          "durationText": "1D / 0N",
                          "summary": "A compact low-cost Da Lat day.",
                          "listingIds": [201],
                          "days": [
                            {
                              "dayNumber": 1,
                              "title": "Food and lake walk",
                              "morning": "Walk around the lake.",
                              "afternoon": "Try a light brunch.",
                              "evening": "Keep transport short.",
                              "relatedListingIds": [201]
                            }
                          ]
                        }
                        """)
                .build());

        AssistantResponse response = service.chat(request("Da Lat 1 day budget 1 million"));

        assertThat(response.getType()).isEqualTo("ITINERARY");
        assertThat(response.getItineraryCard().getDurationDays()).isEqualTo(1);
        assertThat(response.getItineraryCard().getDays()).hasSize(1);
        assertThat(response.getItineraryCard().getBudget()).isNotNull();
        assertThat(response.getItineraryCard().getBudget().getRequestedTotal()).isEqualByComparingTo("1000000");
        assertThat(response.getItineraryCard().getBudget().getEstimatedTotal()).isLessThanOrEqualTo(BigDecimal.valueOf(1_000_000));
    }

    @Test
    void budgetSummaryTotalFallsBackToBreakdownWhenProviderSelectsNoListings() {
        ListingResponse restaurant = listing(211L, "Da Nang Local Table", "RESTAURANT");
        restaurant.setBasePrice(BigDecimal.valueOf(100000));
        when(marketplaceAiContextService.search(any())).thenReturn(List.of(restaurant));
        when(aiProvider.complete(any(AiRequest.class))).thenReturn(AiResponse.builder()
                .text("""
                        {
                          "title": "Da Nang budget trip",
                          "destination": "Da Nang",
                          "durationText": "3D / 2N",
                          "summary": "A simple budget plan.",
                          "listingIds": [],
                          "days": [
                            {
                              "dayNumber": 1,
                              "title": "Arrival",
                              "morning": "Arrive.",
                              "afternoon": "Walk locally.",
                              "evening": "Rest.",
                              "relatedListingIds": []
                            }
                          ]
                        }
                        """)
                .build());

        AssistantResponse response = service.chat(request("Da Nang 3 days total budget 2 million"));

        assertThat(response.getType()).isEqualTo("ITINERARY");
        AssistantResponse.BudgetSummary budget = response.getItineraryCard().getBudget();
        assertThat(budget).isNotNull();
        assertThat(budget.getBreakdown().getAccommodation()).isEqualByComparingTo("800000");
        assertThat(budget.getBreakdown().getFood()).isEqualByComparingTo("500000");
        assertThat(budget.getBreakdown().getTransport()).isEqualByComparingTo("300000");
        assertThat(budget.getBreakdown().getActivities()).isEqualByComparingTo("300000");
        assertThat(budget.getBreakdown().getBuffer()).isEqualByComparingTo("100000");
        assertThat(budget.getEstimatedTotal()).isEqualByComparingTo("2000000");
        assertThat(budget.getTotal()).isEqualByComparingTo("2000000");
        assertThat(budget.getWithinBudget()).isTrue();
    }

    @Test
    void unrealisticTotalBudgetReturnsClarification() {
        ListingResponse stay = listing(202L, "Da Lat Cozy Stay", "HOTEL");
        stay.setCity("Da Lat");
        stay.setBasePrice(BigDecimal.valueOf(850000));
        when(marketplaceAiContextService.search(any())).thenReturn(List.of(stay));

        AssistantResponse response = service.chat(request("Da Lat 3 days 2 people total budget 1 million"));

        assertThat(response.getType()).isEqualTo("CLARIFICATION");
        assertThat(response.getBudgetAdvice()).isNotNull();
        assertThat(response.getBudgetAdvice().getRequestedTotal()).isEqualByComparingTo("1000000");
        verify(aiProvider, never()).complete(any());
    }

    @Test
    void fourDayRequestNormalizesProviderThreeDayOutput() {
        ListingResponse listing = listing(203L, "Ocean View Resort Da Nang", "HOTEL");
        when(marketplaceAiContextService.search(any())).thenReturn(List.of(listing));
        when(aiProvider.complete(any(AiRequest.class))).thenReturn(AiResponse.builder()
                .text("""
                        {
                          "title": "Da Nang four day trip",
                          "destination": "Da Nang",
                          "durationText": "4D / 3N",
                          "summary": "Provider only returned three days.",
                          "listingIds": [203],
                          "days": [
                            { "dayNumber": 1, "title": "Day one", "morning": "Arrive" },
                            { "dayNumber": 2, "title": "Day two", "morning": "Beach" },
                            { "dayNumber": 3, "title": "Day three", "morning": "Food" }
                          ]
                        }
                        """)
                .build());

        AssistantResponse response = service.chat(request("Plan a 4-day trip to Da Nang"));

        assertThat(response.getType()).isEqualTo("ITINERARY");
        assertThat(response.getItineraryCard().getDurationDays()).isEqualTo(4);
        assertThat(response.getItineraryCard().getDays()).hasSize(4);
    }

    @Test
    void perPersonBudgetNormalizesToTotalBudget() {
        ListingResponse listing = listing(204L, "Da Lat Coffee Walk", "EXPERIENCE");
        listing.setCity("Da Lat");
        listing.setBasePrice(BigDecimal.valueOf(200000));
        when(marketplaceAiContextService.search(any())).thenReturn(List.of(listing));
        when(aiProvider.complete(any(AiRequest.class))).thenReturn(AiResponse.builder()
                .text("""
                        {
                          "title": "Da Lat per-person plan",
                          "destination": "Da Lat",
                          "durationText": "3D / 2N",
                          "summary": "A budget-aware plan.",
                          "listingIds": [204],
                          "days": [
                            { "dayNumber": 1, "title": "Arrival", "morning": "Arrive" },
                            { "dayNumber": 2, "title": "Coffee", "morning": "Cafe walk" },
                            { "dayNumber": 3, "title": "Departure", "morning": "Pack" }
                          ]
                        }
                        """)
                .build());

        AssistantResponse response = service.chat(request("Da Lat 3 days 2 people 1 million per person"));

        assertThat(response.getType()).isEqualTo("ITINERARY");
        assertThat(response.getItineraryCard().getBudget().getRequestedTotal()).isEqualByComparingTo("2000000");
    }

    @Test
    void itineraryPlanningRepairsMalformedProviderMarkdownOnce() {
        ListingResponse listing = listing(125L, "Ocean View Resort Da Nang", "HOTEL");
        when(marketplaceAiContextService.search(any())).thenReturn(List.of(listing));
        when(aiProvider.complete(any(AiRequest.class)))
                .thenReturn(AiResponse.builder()
                        .text("""
                                ## Ngày 1
                                **Sáng**: Đi biển
                                ---
                                """)
                        .build())
                .thenReturn(AiResponse.builder()
                        .text("""
                                {
                                  "title": "Repaired Da Nang trip",
                                  "destination": "Da Nang",
                                  "durationText": "3D / 2N",
                                  "summary": "A repaired structured itinerary.",
                                  "listingIds": [125],
                                  "days": [
                                    {
                                      "dayNumber": 1,
                                      "title": "Beach arrival",
                                      "morning": "Arrive and check in.",
                                      "afternoon": "Walk My Khe Beach.",
                                      "evening": "Seafood dinner.",
                                      "relatedListingIds": [125]
                                    }
                                  ]
                                }
                                """)
                        .build());

        AssistantResponse response = service.chat(request("Plan a 3 day trip to Da Nang"));

        assertThat(response.getType()).isEqualTo("ITINERARY");
        assertThat(response.getItineraryCard().getTitle()).isEqualTo("Da Nang Marketplace Itinerary");
        assertThat(response.getMessage()).doesNotContain("##").doesNotContain("---").doesNotContain("**");
        verify(aiProvider, times(2)).complete(any(AiRequest.class));
    }

    @Test
    void recommendationIgnoresModelGeneratedMetadataAndUsesDatabaseCard() {
        ListingResponse listing = listing(301L, "Real Da Lat Garden Brunch", "RESTAURANT");
        listing.setCity("Da Lat");
        listing.setBasePrice(BigDecimal.valueOf(180000));
        when(marketplaceAiContextService.search(any())).thenReturn(List.of(listing));
        when(aiProvider.complete(any(AiRequest.class))).thenReturn(AiResponse.builder()
                .text("""
                        {
                          "message": "Try Invented Luxury Cafe for 10 VND.",
                          "destination": "Da Lat",
                          "summary": "Invented metadata should not leak.",
                          "listingIds": [301],
                          "recommendations": [
                            { "id": 301, "title": "Invented Luxury Cafe", "price": 10, "slug": "fake" }
                          ]
                        }
                        """)
                .build());

        AssistantResponse response = service.chat(request("Goi y nha hang o Da Lat"));

        assertThat(response.getType()).isEqualTo("RECOMMENDATIONS");
        assertThat(response.getRecommendations()).hasSize(1);
        AssistantResponse.ListingRecommendation card = response.getRecommendations().getFirst();
        assertThat(card.getTitle()).isEqualTo("Real Da Lat Garden Brunch");
        assertThat(card.getSlug()).isEqualTo("real-da-lat-garden-brunch");
        assertThat(card.getPrice()).isEqualByComparingTo("180000");
        assertThat(card.getSource()).isEqualTo("DATABASE");
    }

    @Test
    void itineraryDiscardsUnknownModelListingIds() {
        ListingResponse listing = listing(302L, "Verified Da Lat Stay", "HOTEL");
        listing.setCity("Da Lat");
        when(marketplaceAiContextService.search(any())).thenReturn(List.of(listing));
        when(aiProvider.complete(any(AiRequest.class))).thenReturn(AiResponse.builder()
                .text("""
                        {
                          "title": "Invented trip",
                          "destination": "Da Lat",
                          "durationText": "2D / 1N",
                          "summary": "Invented Hotel should not appear.",
                          "listingIds": [99999],
                          "days": [
                            {
                              "dayNumber": 1,
                              "title": "Invented Hotel day",
                              "highlightListingId": 99999,
                              "relatedListingIds": [99999]
                            },
                            {
                              "dayNumber": 2,
                              "title": "Departure",
                              "relatedListingIds": []
                            }
                          ]
                        }
                        """)
                .build());

        AssistantResponse response = service.chat(request("Plan a 2 day trip to Da Lat"));

        assertThat(response.getType()).isEqualTo("ITINERARY");
        assertThat(response.getItineraryCard().getRecommendedListings()).isEmpty();
        assertThat(response.getItineraryCard().getDays())
                .allSatisfy(day -> assertThat(day.getRelatedListingIds()).doesNotContain(99999L));
        assertThat(response.getMessage()).doesNotContain("Invented Hotel");
    }

    @Test
    void noMarketplaceDataReturnsClarificationWithoutProviderCall() {
        when(marketplaceAiContextService.search(any())).thenReturn(List.of());

        AssistantResponse response = service.chat(request("Plan a 2 day trip to Cat Ba"));

        assertThat(response.getType()).isEqualTo("CLARIFICATION");
        assertThat(response.getRecommendations()).isEmpty();
        assertThat(response.getItineraryCard()).isNull();
        verify(aiProvider, never()).complete(any());
    }

    @Test
    void inactiveListingsAreNotUsedForGroundedItinerary() {
        ListingResponse listing = listing(303L, "Suspended Stay", "HOTEL");
        listing.setStatus("SUSPENDED");
        when(marketplaceAiContextService.search(any())).thenReturn(List.of(listing));

        AssistantResponse response = service.chat(request("Plan a 2 day trip to Da Lat"));

        assertThat(response.getType()).isEqualTo("CLARIFICATION");
        assertThat(response.getRecommendations()).isEmpty();
        verify(aiProvider, never()).complete(any());
    }

    private AssistantRequest request(String message) {
        return AssistantRequest.builder()
                .message(message)
                .history(List.of())
                .build();
    }

    private ListingResponse listing(Long id, String title, String category) {
        return ListingResponse.builder()
                .id(id)
                .title(title)
                .slug(title.toLowerCase().replace(" ", "-"))
                .category(category)
                .city("Da Nang")
                .country("Vietnam")
                .status("ACTIVE")
                .providerName("Blue Coast Hospitality")
                .basePrice(BigDecimal.valueOf(850000))
                .currency("VND")
                .averageRating(BigDecimal.valueOf(4.8))
                .reviewCount(12)
                .coverImageUrl("/images/da-nang.jpg")
                .shortDesc("Beach stay in Da Nang.")
                .build();
    }
}
