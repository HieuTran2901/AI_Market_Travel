package com.travel.marketplace.modules.ai.assistant.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.travel.marketplace.modules.ai.assistant.dto.AssistantMessage;
import com.travel.marketplace.modules.ai.assistant.dto.AssistantRequest;
import com.travel.marketplace.modules.ai.assistant.dto.AssistantResponse;
import com.travel.marketplace.modules.ai.prompt.PromptTemplateRegistry;
import com.travel.marketplace.modules.ai.provider.AiProvider;
import com.travel.marketplace.modules.ai.provider.AiRequest;
import com.travel.marketplace.modules.ai.provider.AiResponse;
import com.travel.marketplace.modules.listing.dto.ListingResponse;
import com.travel.marketplace.modules.trip.service.AiTripDraftService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AssistantServiceImpl implements AssistantService {

    private final AiProvider aiProvider;
    private final MarketplaceAiContextService marketplaceAiContextService;
    private final PromptTemplateRegistry promptRegistry;
    private final StructuredAssistantResponseParser structuredParser;
    private final DestinationImageResolver destinationImageResolver;
    private final AiTripDraftService aiTripDraftService;

    private static final Pattern DURATION_PATTERN = Pattern.compile("(\\d+)\\s*[- ]?\\s*(?:day|days|night|nights|ngay|dem|ngày|đêm)", Pattern.CASE_INSENSITIVE);
    private static final Pattern TRAVELER_PATTERN = Pattern.compile("(\\d+)\\s*(?:people|person|travelers|adults|guests|wife|couple|nguoi|người|khach|khách)", Pattern.CASE_INSENSITIVE);
    public enum AssistantIntent {
        GREETING,
        ASSISTANT_IDENTITY,
        ASSISTANT_CAPABILITIES,
        CASUAL_CONVERSATION,
        GENERAL_TRAVEL_QUESTION,
        EXACT_LISTING_SEARCH,
        MARKETPLACE_SEARCH,
        RECOMMENDATION_REQUEST,
        TRIP_PLANNING,
        ITINERARY_ADJUSTMENT,
        LISTING_COMPARISON,
        LISTING_DETAIL_QUESTION,
        BOOKING_HELP,
        CLARIFICATION_REQUIRED,
        UNSUPPORTED
    }

    public enum MessagePurpose {
        GREETING,
        QUESTION,
        COMMAND,
        SEARCH,
        FOLLOW_UP,
        FEEDBACK,
        UNKNOWN
    }

    public record IntentResult(
            AssistantIntent intent,
            MessagePurpose purpose,
            double confidence,
            boolean requiresMarketplaceData,
            boolean requiresStructuredResponse,
            TravelContext context
    ) {}

    private record TravelContext(
            String destination,
            String previousDestination,
            String listingName,
            Integer durationDays,
            String travelDates,
            Integer travelerCount,
            String budgetLevel,
            BigDecimal budgetAmount,
            BigDecimal budgetPerPerson,
            String currency,
            String budgetScope,
            List<String> interests,
            String accommodationPreference,
            String transportPreference,
            String tripStyle,
            List<Long> previouslyRecommendedListings,
            String previousResponseMode,
            boolean wantsItinerary
    ) {
        Map<String, Object> toMap() {
            Map<String, Object> map = new LinkedHashMap<>();
            put(map, "destination", destination);
            put(map, "previousDestination", previousDestination);
            put(map, "listingName", listingName);
            put(map, "durationDays", durationDays);
            put(map, "travelDates", travelDates);
            put(map, "travelerCount", travelerCount);
            put(map, "budgetLevel", budgetLevel);
            put(map, "budgetAmount", budgetAmount);
            put(map, "budgetPerPerson", budgetPerPerson);
            put(map, "currency", currency);
            put(map, "budgetScope", budgetScope);
            put(map, "interests", interests);
            put(map, "accommodationPreference", accommodationPreference);
            put(map, "transportPreference", transportPreference);
            put(map, "tripStyle", tripStyle);
            put(map, "previouslyRecommendedListings", previouslyRecommendedListings);
            put(map, "previousResponseMode", previousResponseMode);
            put(map, "wantsItinerary", wantsItinerary);
            return map;
        }

        private static void put(Map<String, Object> map, String key, Object value) {
            if (value != null) {
                if (value instanceof List<?> list && list.isEmpty()) {
                    return;
                }
                map.put(key, value);
            }
        }
    }

    private record ParsedBudget(
            BigDecimal amount,
            String currency,
            String scope,
            BigDecimal minAmount,
            BigDecimal maxAmount
    ) {}

    private record BudgetAllocation(
            BigDecimal requestedTotal,
            BigDecimal perPerson,
            String currency,
            BigDecimal accommodationLimit,
            BigDecimal foodLimit,
            BigDecimal transportLimit,
            BigDecimal activityLimit,
            BigDecimal buffer,
            boolean present
    ) {
        Map<String, Object> toMap() {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("requestedTotal", requestedTotal);
            map.put("budgetPerPerson", perPerson);
            map.put("currency", currency);
            map.put("accommodationLimit", accommodationLimit);
            map.put("foodLimit", foodLimit);
            map.put("transportLimit", transportLimit);
            map.put("activityLimit", activityLimit);
            map.put("buffer", buffer);
            return map;
        }
    }

    private record BudgetFeasibility(
            boolean feasible,
            BigDecimal minimumEstimatedTotal,
            List<String> alternatives
    ) {}

    @Override
    public AssistantResponse chat(AssistantRequest request) {
        TravelContext context = extractTravelContext(request);
        IntentResult intentResult = classifyIntent(request, context);

        log.debug(
                "AI routing purpose={} intent={} confidence={} marketplaceLookup={} structured={} destination={}",
                intentResult.purpose(),
                intentResult.intent(),
                intentResult.confidence(),
                intentResult.requiresMarketplaceData(),
                intentResult.requiresStructuredResponse(),
                intentResult.context().destination()
        );

        return switch (intentResult.intent()) {
            case GREETING -> buildGreetingResponse(intentResult);
            case ASSISTANT_IDENTITY -> buildStaticTextResponse(intentResult, "Mình là trợ lý du lịch AI của AI Marketplace Traveler. Mình có thể trò chuyện, gợi ý điểm đến, tìm listing thật trên marketplace và giúp bạn lập lịch trình.");
            case ASSISTANT_CAPABILITIES -> buildStaticTextResponse(intentResult, "Mình có thể giúp bạn tìm nơi lưu trú, nhà hàng, tour, trải nghiệm, so sánh lựa chọn và lập lịch trình theo ngân sách hoặc phong cách du lịch của bạn.");
            case CASUAL_CONVERSATION, BOOKING_HELP, UNSUPPORTED -> buildTextResponse(request, intentResult);
            case GENERAL_TRAVEL_QUESTION -> intentResult.purpose() == MessagePurpose.FOLLOW_UP && intentResult.context().destination() == null
                    ? clarificationResponse(intentResult, "Bạn muốn điều chỉnh chuyến đi hoặc gợi ý cho điểm đến nào?")
                    : buildTextResponse(request, intentResult);
            case CLARIFICATION_REQUIRED -> clarificationResponse(intentResult, "Bạn muốn tìm ở thành phố hoặc khu vực nào?");
            case EXACT_LISTING_SEARCH, MARKETPLACE_SEARCH, RECOMMENDATION_REQUEST, LISTING_COMPARISON, LISTING_DETAIL_QUESTION -> buildRecommendationResponse(request, intentResult);
            case TRIP_PLANNING, ITINERARY_ADJUSTMENT -> buildItineraryResponse(request, intentResult);
        };
    }

    private AssistantResponse buildGreetingResponse(IntentResult intentResult) {
        List<String> suggestions = List.of("Lên kế hoạch chuyến đi", "Tìm khách sạn", "Gợi ý trải nghiệm");
        return AssistantResponse.builder()
                .type(AssistantResponse.AssistantResponseType.TEXT.name())
                .intent(intentResult.intent().name())
                .purpose(intentResult.purpose().name())
                .confidence(intentResult.confidence())
                .contextUsed(false)
                .message("Chào bạn! Mình có thể giúp bạn lên kế hoạch chuyến đi, tìm nơi lưu trú hoặc gợi ý trải nghiệm.")
                .reply("Chào bạn! Mình có thể giúp bạn lên kế hoạch chuyến đi, tìm nơi lưu trú hoặc gợi ý trải nghiệm.")
                .recommendations(List.of())
                .suggestions(suggestions)
                .suggestedActions(suggestions)
                .extractedContext(withResponseMode(intentResult.context(), "text", intentResult.intent()))
                .mockedAi(false)
                .build();
    }

    private AssistantResponse buildStaticTextResponse(IntentResult intentResult, String message) {
        return AssistantResponse.builder()
                .type(AssistantResponse.AssistantResponseType.TEXT.name())
                .intent(intentResult.intent().name())
                .purpose(intentResult.purpose().name())
                .confidence(intentResult.confidence())
                .contextUsed(false)
                .message(message)
                .reply(message)
                .recommendations(List.of())
                .suggestions(List.of("Tìm khách sạn", "Gợi ý nhà hàng", "Lập lịch trình"))
                .suggestedActions(List.of("Tìm khách sạn", "Gợi ý nhà hàng", "Lập lịch trình"))
                .extractedContext(withResponseMode(intentResult.context(), "text", intentResult.intent()))
                .mockedAi(false)
                .build();
    }

    private AssistantResponse buildTextResponse(AssistantRequest request, IntentResult intentResult) {
        TravelContext context = intentResult.context();
        String marketplaceContext = "No marketplace listings are attached for this turn.";
        String conversationContext = formatConversationHistory(request.getHistory());

        Map<String, Object> vars = new LinkedHashMap<>();
        vars.put("marketplaceContext", marketplaceContext);
        vars.put("conversationContext", conversationContext);
        vars.put("userMessage", request.getMessage());

        String prompt = promptRegistry.render("assistant", vars);
        AiResponse aiResponse = aiProvider.complete(AiRequest.builder()
                .prompt(prompt)
                .systemContext("""
                        You are the AI travel concierge for AI Marketplace Traveler.
                        Respond naturally in the user's language.
                        For greetings, casual conversation, questions about yourself, or questions about your capabilities:
                        - answer briefly and naturally
                        - do not create an itinerary
                        - do not return JSON
                        - do not attach listing data unless explicitly requested
                        - do not pretend to expose direct database access
                        When asked whether you can read the database, explain that you can use approved marketplace data supplied by the backend, such as active listings, prices, locations, and ratings, to help search and recommend.
                        """)
                .conversationHistory(toProviderHistory(request.getHistory()))
                .maxTokens(900)
                .temperature(0.7)
                .build());

        List<String> suggestions = generateSuggestedActions(aiResponse.getText(), request, context);
        return AssistantResponse.builder()
                .type(AssistantResponse.AssistantResponseType.TEXT.name())
                .intent(intentResult.intent().name())
                .purpose(intentResult.purpose().name())
                .confidence(intentResult.confidence())
                .contextUsed(false)
                .message(aiResponse.getText())
                .reply(aiResponse.getText())
                .recommendations(List.of())
                .suggestions(suggestions)
                .suggestedActions(suggestions)
                .extractedContext(withResponseMode(context, "text", intentResult.intent()))
                .mockedAi(aiResponse.isMocked())
                .build();
    }

    private AssistantResponse buildRecommendationResponse(AssistantRequest request, IntentResult intentResult) {
        TravelContext context = intentResult.context();
        AssistantIntent intent = intentResult.intent();
        if (!intentResult.requiresMarketplaceData()) {
            return buildTextResponse(request, intentResult);
        }
        if (context.destination() == null && shouldAskForDestination(request.getMessage(), intent)) {
            return clarificationResponse(intentResult, "Bạn muốn tìm gợi ý ở thành phố hoặc khu vực nào?");
        }

        List<ListingResponse> listings = activeListings(fetchRelevantListings(request, context, intent, 10));
        if (intent == AssistantIntent.EXACT_LISTING_SEARCH) {
            return exactListingResponse(intentResult, listings);
        }
        if (listings.isEmpty()) {
            return noMarketplaceDataResponse(
                    intentResult,
                    firstNonBlank(context.destination(), context.previousDestination(), "that destination"),
                    "I could not find active marketplace listings that match that request yet."
            );
        }
        String listingContext = buildDetailedListingContext(listings);
        String prompt = """
                User request:
                %s

                Extracted travel context:
                %s

                <MARKETPLACE_CONTEXT>
                %s
                </MARKETPLACE_CONTEXT>

                Return ONLY valid JSON:
                {
                  "message": "short helpful sentence",
                  "destination": "string",
                  "summary": "string",
                  "listingIds": [1, 2, 3],
                  "followUpSuggestions": ["string"]
                }

                Rules:
                - Use only listing IDs from MARKETPLACE_CONTEXT.
                - Never invent a listing ID, slug, title, price, image, rating, provider, location, category, or availability.
                - Never mention a marketplace business or service unless its ID is present in MARKETPLACE_CONTEXT.
                - If no listing fits, explain that clearly and leave listingIds empty.
                - No markdown fences and no text outside JSON.
                """.formatted(safeText(request.getMessage()), context.toMap(), listingContext);

        AiResponse aiResponse = aiProvider.complete(AiRequest.builder()
                .prompt(prompt)
                .systemContext("You are the AI travel concierge for AI Marketplace Traveler. Return strict JSON for recommendation cards.")
                .conversationHistory(toProviderHistory(request.getHistory()))
                .maxTokens(1100)
                .temperature(0.55)
                .jsonResponse(true)
                .build());

        RecommendationPayload payload = parseRecommendation(aiResponse.getText(), listings, context)
                .orElseGet(() -> fallbackRecommendationPayload(request, listings, context));
        List<String> followUps = payload.followUpSuggestions().isEmpty()
                ? defaultFollowUps(intent)
                : payload.followUpSuggestions();

        return AssistantResponse.builder()
                .type(AssistantResponse.AssistantResponseType.RECOMMENDATIONS.name())
                .intent(intent.name())
                .purpose(intentResult.purpose().name())
                .confidence(intentResult.confidence())
                .contextUsed(true)
                .message(payload.message())
                .reply(payload.message())
                .destination(firstNonBlank(payload.destination(), context.destination(), "Your trip"))
                .summary(payload.summary())
                .heroImageUrl(selectHeroImage(firstNonBlank(payload.destination(), context.destination()), payload.recommendations(), listings))
                .recommendations(payload.recommendations())
                .followUpSuggestions(followUps)
                .suggestions(followUps)
                .suggestedActions(followUps)
                .extractedContext(withResponseMode(context, "recommendation", intent))
                .mockedAi(aiResponse.isMocked())
                .build();
    }

    private AssistantResponse exactListingResponse(IntentResult intentResult, List<ListingResponse> listings) {
        List<AssistantResponse.ListingRecommendation> recommendations = listings.stream()
                .limit(4)
                .map(this::toRecommendation)
                .toList();
        String message = recommendations.isEmpty()
                ? "Mình chưa tìm thấy listing có tên đó trong dữ liệu hiện tại. Bạn có thể cho mình thêm tên thành phố hoặc loại dịch vụ không?"
                : "Mình tìm thấy listing phù hợp trong marketplace.";
        return AssistantResponse.builder()
                .type(AssistantResponse.AssistantResponseType.LISTING_RESULT.name())
                .intent(intentResult.intent().name())
                .purpose(intentResult.purpose().name())
                .confidence(intentResult.confidence())
                .contextUsed(true)
                .message(message)
                .reply(message)
                .summary(recommendations.isEmpty() ? "No active listing matched that name." : "Exact or close title matches from active marketplace listings.")
                .recommendations(recommendations)
                .suggestions(defaultFollowUps(AssistantIntent.MARKETPLACE_SEARCH))
                .suggestedActions(defaultFollowUps(AssistantIntent.MARKETPLACE_SEARCH))
                .extractedContext(withResponseMode(intentResult.context(), "listing_result", intentResult.intent()))
                .mockedAi(false)
                .build();
    }

    private AssistantResponse noMarketplaceDataResponse(IntentResult intentResult, String destination, String reason) {
        String safeDestination = firstNonBlank(destination, "that destination");
        String message = reason + " You can choose another destination with active marketplace data or add more filters.";
        List<String> suggestions = List.of(
                "Choose another destination",
                "Show available marketplace cities",
                "Try a broader search"
        );
        log.info(
                "AI grounding mode=DATABASE_ONLY destination={} candidateListings=0 selectedListings=0 insufficientData=true",
                safeDestination
        );
        return AssistantResponse.builder()
                .type(AssistantResponse.AssistantResponseType.CLARIFICATION.name())
                .intent(intentResult.intent().name())
                .purpose(intentResult.purpose().name())
                .confidence(intentResult.confidence())
                .contextUsed(false)
                .message(message)
                .reply(message)
                .destination(safeDestination)
                .summary("No active database-backed marketplace options matched this request.")
                .recommendations(List.of())
                .suggestions(suggestions)
                .suggestedActions(suggestions)
                .extractedContext(withResponseMode(intentResult.context(), "clarification", intentResult.intent()))
                .mockedAi(false)
                .build();
    }

    private AssistantResponse buildItineraryResponse(AssistantRequest request, IntentResult intentResult) {
        TravelContext context = intentResult.context();
        AssistantIntent intent = intentResult.intent();
        if (!intentResult.requiresMarketplaceData()) {
            return buildTextResponse(request, intentResult);
        }
        int durationDays = context.durationDays() != null ? context.durationDays() : 2;
        BudgetAllocation budgetAllocation = buildBudgetAllocation(context, durationDays);
        List<ListingResponse> listings = activeListings(fetchRelevantListings(request, context, intent, 18));
        List<ListingResponse> rankedListings = rankListingsForPlan(listings, context, budgetAllocation, durationDays);
        BudgetFeasibility feasibility = evaluateBudgetFeasibility(context, budgetAllocation, rankedListings, durationDays);
        if (budgetAllocation.present() && !feasibility.feasible()) {
            log.info(
                    "Trip planning destination={} days={} travelers={} budget={} {} affordableListings={} minimumEstimatedTotal={} feasible=false",
                    firstNonBlank(context.destination(), context.previousDestination(), "unknown"),
                    durationDays,
                    travelerCount(context),
                    budgetAllocation.requestedTotal(),
                    budgetAllocation.currency(),
                    rankedListings.size(),
                    feasibility.minimumEstimatedTotal()
            );
            return buildBudgetClarificationResponse(request, intentResult, budgetAllocation, feasibility);
        }
        List<ListingResponse> promptListings = rankedListings.isEmpty() ? listings : rankedListings;
        if (promptListings.isEmpty()) {
            return noMarketplaceDataResponse(
                    intentResult,
                    firstNonBlank(context.destination(), context.previousDestination(), request.getContextDestination(), "that destination"),
                    "The marketplace does not currently have enough active services for a verified trip plan there."
            );
        }
        String listingContext = buildDetailedListingContext(promptListings);
        List<String> missingCategories = missingPlanningCategories(promptListings, durationDays);

        String prompt = """
                User request:
                %s

                Extracted travel context:
                %s

                Recent conversation:
                %s

                <MARKETPLACE_CONTEXT>
                %s
                </MARKETPLACE_CONTEXT>

                <BUDGET_PLAN>
                %s
                </BUDGET_PLAN>

                Return ONLY valid JSON using this exact shape:
                {
                  "title": "string",
                  "destination": "string",
                  "durationText": "3D / 2N",
                  "travelerText": "optional string",
                  "budgetText": "optional string",
                  "budget": {
                    "requestedTotal": 0,
                    "estimatedTotal": 0,
                    "currency": "VND",
                    "feasible": true
                  },
                  "bestTimeText": "optional string",
                  "summary": "string",
                  "mapLabel": "optional string",
                  "insufficientMarketplaceData": false,
                  "missingCategories": ["HOTEL"],
                  "listingIds": [1, 2],
                  "days": [
                    {
                      "dayNumber": 1,
                      "title": "string",
                      "shortLabel": "string",
                      "highlightListingId": 1,
                      "relatedListingIds": [1, 2]
                    }
                  ],
                  "followUpSuggestions": ["string"]
                }

                Rules:
                - Recommend only listings present in MARKETPLACE_CONTEXT.
                - Never invent a listing ID, slug, title, price, image, rating, provider, location, category, or availability.
                - Never mention a marketplace hotel, restaurant, tour, experience, vehicle, or paid attraction unless its ID is present in MARKETPLACE_CONTEXT.
                - Return listing IDs only; backend will hydrate all names, prices, ratings, providers, links, and images from the database.
                - If marketplace context is limited, set insufficientMarketplaceData=true and list missingCategories.
                - The number of itinerary days must equal %d.
                - Respect the supplied BUDGET_PLAN and avoid selecting listings that exceed the allowed category budget.
                - If the plan is infeasible, set insufficientMarketplaceData=true rather than inventing impossible prices.
                - Respect follow-up constraints such as cheaper, more food, beach, family, romantic, or relaxing.
                - No markdown fences. No text outside JSON.
                """.formatted(
                safeText(request.getMessage()),
                context.toMap(),
                formatConversationHistory(request.getHistory()),
                listingContext,
                budgetAllocation.toMap(),
                durationDays
        );

        AiResponse aiResponse = aiProvider.complete(AiRequest.builder()
                .prompt(prompt)
                .systemContext("""
                        You are the AI travel concierge for AI Marketplace Traveler.
                        You create practical travel plans grounded in supplied marketplace records.
                        Return strict JSON only when asked for an itinerary card.
                        """)
                .conversationHistory(toProviderHistory(request.getHistory()))
                .maxTokens(1800)
                .temperature(0.55)
                .jsonResponse(true)
                .build());

        Optional<AssistantResponse.ItineraryCard> parsed = parseItineraryCard(aiResponse.getText(), request, promptListings, context, durationDays, budgetAllocation);
        boolean initialParseSuccess = parsed.isPresent();
        boolean repairAttempted = false;
        boolean repairParseSuccess = false;
        boolean fallbackUsed = false;
        if (parsed.isEmpty()) {
            repairAttempted = true;
            parsed = repairItineraryResponse(aiResponse.getText(), request, promptListings, context, durationDays, budgetAllocation);
            repairParseSuccess = parsed.isPresent();
        }
        if (parsed.isEmpty()) {
            fallbackUsed = true;
            parsed = Optional.of(fallbackItineraryCard(request, promptListings, context, durationDays, budgetAllocation));
        }

        AssistantResponse.ItineraryCard card = parsed.get();
        card = normalizeItineraryAgainstBudget(card, request, promptListings, context, durationDays, budgetAllocation);
        card.setMissingCategories(missingCategories);
        card.setInsufficientMarketplaceData(!missingCategories.isEmpty() || Boolean.TRUE.equals(card.getInsufficientMarketplaceData()));
        card.setGroundingMode("DATABASE_ONLY");
        card.setSupportsTripSave(true);
        AssistantResponse.TripDraft tripDraft = aiTripDraftService.createDraft(request.getAuthenticatedUserId(), card);
        card.setDraftId(tripDraft.getDraftId());
        card.setDraftExpiresAt(tripDraft.getExpiresAt());
        log.info(
                "AI response pipeline intent={} groundingMode=DATABASE_ONLY expectedType=ITINERARY initialParseSuccess={} repairAttempted={} repairParseSuccess={} fallbackUsed={} finalType=ITINERARY days={} candidateListings={} hydratedListingCount={} missingCategories={} heroImageResolved={} estimatedTotal={} feasible={}",
                intent.name(),
                initialParseSuccess,
                repairAttempted,
                repairParseSuccess,
                fallbackUsed,
                card.getDays() != null ? card.getDays().size() : 0,
                promptListings.size(),
                card.getRecommendedListings() != null ? card.getRecommendedListings().size() : 0,
                missingCategories,
                card.getHeroImageUrl() != null && !card.getHeroImageUrl().isBlank(),
                card.getBudget() != null ? card.getBudget().getEstimatedTotal() : null,
                card.getBudget() == null || Boolean.TRUE.equals(card.getBudget().getFeasible())
        );
        return AssistantResponse.builder()
                .type(AssistantResponse.AssistantResponseType.ITINERARY.name())
                .intent(intent.name())
                .purpose(intentResult.purpose().name())
                .confidence(intentResult.confidence())
                .contextUsed(true)
                .message(card.getSummary())
                .reply(card.getSummary())
                .itineraryCard(card)
                .itinerary(card)
                .tripDraft(tripDraft)
                .suggestions(card.getFollowUpSuggestions())
                .suggestedActions(card.getFollowUpSuggestions())
                .extractedContext(withResponseMode(context, "itinerary", intent))
                .mockedAi(aiResponse.isMocked())
                .build();
    }

    private AssistantResponse.ItineraryCard fallbackItineraryCard(
            AssistantRequest request,
            List<ListingResponse> listings,
            TravelContext context,
            int durationDays,
            BudgetAllocation budgetAllocation
    ) {
        String destination = firstNonBlank(context.destination(), context.previousDestination(), request.getContextDestination(), "Your trip");
        List<AssistantResponse.ListingRecommendation> recommendations = listings.stream()
                .limit(4)
                .map(this::toRecommendation)
                .toList();
        List<AssistantResponse.ItineraryDay> days = new ArrayList<>();
        List<ListingResponse> dayListings = diversifyListingsForDays(listings, durationDays);
        for (int i = 0; i < Math.max(1, durationDays); i++) {
            ListingResponse listing = dayListings.isEmpty() ? null : dayListings.get(i % dayListings.size());
            String label = dynamicDayLabel(listing, context, i, durationDays);
            String title = dynamicDayTitle(destination, listing, label, i, durationDays);
            days.add(AssistantResponse.ItineraryDay.builder()
                    .dayNumber(i + 1)
                    .title(title)
                    .shortLabel(label)
                    .shortDescription(dynamicDayDescription(destination, listing, context))
                    .morning(i == 0 ? "Arrive in " + destination + " and keep the first stop light." : "Start with a low-cost local stop that matches your pace.")
                    .afternoon(listing != null ? "Use " + listing.getTitle() + " as the anchor for this part of the day." : "Explore free or flexible destination highlights.")
                    .evening(i == durationDays - 1 ? "Keep the final evening simple and prepare for departure." : eveningSuggestion(context, listing))
                    .imageUrl(listing != null ? resolveImageUrl(listing) : null)
                    .highlightImageUrl(listing != null ? resolveImageUrl(listing) : null)
                    .relatedListingIds(listing != null && listing.getId() != null ? List.of(listing.getId()) : List.of())
                    .build());
        }
        return AssistantResponse.ItineraryCard.builder()
                .title(destination + " Getaway")
                .destination(destination)
                .durationDays(durationDays)
                .durationNights(Math.max(durationDays - 1, 0))
                .startDate(resolveStartDate(context))
                .endDate(resolveStartDate(context) == null ? null : resolveStartDate(context).plusDays(Math.max(durationDays - 1, 0)))
                .durationText(durationDays + "D / " + Math.max(durationDays - 1, 0) + "N")
                .travelerText(context.travelerCount() != null ? context.travelerCount() + " travelers" : null)
                .budgetText(budgetText(context))
                .travelerCount(context.travelerCount())
                .budget(buildBudgetSummary(budgetAllocation, estimateItineraryTotal(recommendations, listings, durationDays, travelerCount(context)), true))
                .summary("A compact trip plan based on your request" + (recommendations.isEmpty() ? "." : " and active marketplace options."))
                .heroImageUrl(selectHeroImage(destination, recommendations, listings))
                .mapLabel(destination)
                .insufficientMarketplaceData(recommendations.isEmpty())
                .missingCategories(missingPlanningCategories(listings, durationDays))
                .groundingMode("DATABASE_ONLY")
                .listingRecommendations(recommendations)
                .recommendedListings(recommendations)
                .days(days)
                .followUpSuggestions(contextAwareFollowUps(context, budgetAllocation, true))
                .build();
    }

    private IntentResult classifyIntent(AssistantRequest request, TravelContext context) {
        String current = normalize(safeText(request.getMessage()));
        String combined = normalize(safeText(request.getMessage()) + " " + recentUserText(request.getHistory()));

        if (isGreetingOnly(current)) {
            return new IntentResult(AssistantIntent.GREETING, MessagePurpose.GREETING, 0.99, false, false, context);
        }
        if (isAssistantIdentityQuestion(current)) {
            return new IntentResult(AssistantIntent.ASSISTANT_IDENTITY, MessagePurpose.QUESTION, 0.96, false, false, context);
        }
        if (isAssistantCapabilitiesQuestion(current) || isDatabaseCapabilityQuestion(current)) {
            return new IntentResult(AssistantIntent.ASSISTANT_CAPABILITIES, MessagePurpose.QUESTION, 0.96, false, false, context);
        }
        if (context.listingName() != null) {
            return new IntentResult(AssistantIntent.EXACT_LISTING_SEARCH, MessagePurpose.SEARCH, 0.84, true, true, context);
        }
        if (containsAny(current, "booking", "booked", "cancel", "refund", "payment", "reservation")) {
            return new IntentResult(AssistantIntent.BOOKING_HELP, detectPurpose(current), 0.85, false, false, context);
        }
        if (isFollowUp(current) && firstNonBlank(context.destination(), context.previousDestination()) != null) {
            TravelContext followUpContext = context.destination() == null ? withDestination(context, context.previousDestination()) : context;
            AssistantIntent followUpIntent = "itinerary".equals(context.previousResponseMode())
                    ? AssistantIntent.ITINERARY_ADJUSTMENT
                    : AssistantIntent.RECOMMENDATION_REQUEST;
            return new IntentResult(followUpIntent, MessagePurpose.FOLLOW_UP, 0.86, true, true, followUpContext);
        }
        if (isFollowUp(current)) {
            return new IntentResult(AssistantIntent.GENERAL_TRAVEL_QUESTION, MessagePurpose.FOLLOW_UP, 0.58, false, false, context);
        }
        if (context.wantsItinerary()
                || containsAny(current, "itinerary", "schedule", "plan", "route", "day by day", "what should i do", "what to do", "lap ke hoach", "lich trinh", "du lich", "chuyen di", "chuyen du lich")
                || (context.durationDays() != null && context.destination() != null)) {
            return new IntentResult(AssistantIntent.TRIP_PLANNING, MessagePurpose.COMMAND, 0.88, true, true, context);
        }
        if (context.destination() != null && containsAny(current, "co gi", "gi dep", "hay", "dep")) {
            return new IntentResult(AssistantIntent.GENERAL_TRAVEL_QUESTION, MessagePurpose.QUESTION, 0.75, false, false, context);
        }
        if (containsAny(combined, "hotel", "stay", "homestay", "resort", "accommodation", "khach san")
                && context.destination() == null
                && containsAny(current, "recommend", "suggest", "find", "search", "goi y", "tim")) {
            return new IntentResult(AssistantIntent.MARKETPLACE_SEARCH, detectPurpose(current), 0.76, true, true, context);
        }
        if (containsAny(combined, "hotel", "stay", "homestay", "resort", "accommodation", "khach san")) {
            AssistantIntent intent = context.destination() == null && !containsAny(current, "recommend", "suggest", "find", "search", "gợi ý", "tìm")
                    ? AssistantIntent.GENERAL_TRAVEL_QUESTION
                    : AssistantIntent.MARKETPLACE_SEARCH;
            return new IntentResult(intent, detectPurpose(current), intent == AssistantIntent.MARKETPLACE_SEARCH ? 0.86 : 0.68, intent == AssistantIntent.MARKETPLACE_SEARCH, intent == AssistantIntent.MARKETPLACE_SEARCH, context);
        }
        if (containsAny(combined, "food", "seafood", "restaurant", "eat", "coffee", "cafe", "nha hang", "an gi")) {
            boolean explicit = context.destination() != null || containsAny(current, "recommend", "suggest", "find", "search", "goi y", "tim");
            return new IntentResult(explicit ? AssistantIntent.RECOMMENDATION_REQUEST : AssistantIntent.GENERAL_TRAVEL_QUESTION, detectPurpose(current), explicit ? 0.84 : 0.70, explicit, explicit, context);
        }
        if (context.destination() != null && containsAny(combined, "idea", "ideas", "recommend", "suggest", "places", "sightseeing", "beach", "culture", "relax", "goi y", "dia diem", "an choi", "choi gi")) {
            return new IntentResult(AssistantIntent.RECOMMENDATION_REQUEST, detectPurpose(current), 0.82, true, true, context);
        }
        if (containsAny(current, "di dau", "nen di dau", "goi y diem den", "destination recommendation", "where should i go")) {
            return new IntentResult(AssistantIntent.RECOMMENDATION_REQUEST, detectPurpose(current), 0.80, true, true, context);
        }
        if (context.destination() != null && containsAny(combined, "next week", "weekend", "with my wife", "with my family", "medium budget", "not too expensive")) {
            return new IntentResult(AssistantIntent.RECOMMENDATION_REQUEST, detectPurpose(current), 0.78, true, true, context);
        }
        if (context.destination() != null && containsAny(current, "i want to go", "visiting", "going to", "traveling to")) {
            return new IntentResult(AssistantIntent.GENERAL_TRAVEL_QUESTION, MessagePurpose.QUESTION, 0.72, false, false, context);
        }
        if (containsAny(current, "support", "help center", "contact")) {
            return new IntentResult(AssistantIntent.UNSUPPORTED, MessagePurpose.QUESTION, 0.75, false, false, context);
        }
        if (context.destination() != null && containsAny(current, "what", "what is", "có gì", "hay", "đẹp")) {
            return new IntentResult(AssistantIntent.GENERAL_TRAVEL_QUESTION, MessagePurpose.QUESTION, 0.75, false, false, context);
        }
        return new IntentResult(AssistantIntent.CASUAL_CONVERSATION, detectPurpose(current), 0.70, false, false, context);
    }

    private TravelContext extractTravelContext(AssistantRequest request) {
        Map<String, Object> previous = request.getExtractedContext() != null ? request.getExtractedContext() : Map.of();
        String current = safeText(request.getMessage());
        String historyText = recentUserText(request.getHistory());
        String combined = current + " " + historyText;

        String explicitDestination = firstNonBlank(
                request.getContextDestination(),
                detectDestination(current)
        );
        String previousDestination = firstNonBlank(
                asString(previous.get("destination")),
                asString(previous.get("previousDestination")),
                detectDestination(historyText)
        );
        String listingName = detectListingName(current);
        Integer durationDays = firstNonNull(
                detectDurationDays(current),
                asInteger(previous.get("durationDays")),
                detectDurationDays(historyText)
        );
        Integer travelers = firstNonNull(
                detectTravelerCount(current),
                asInteger(previous.get("travelerCount")),
                detectTravelerCount(historyText)
        );
        ParsedBudget currentBudget = detectBudget(current, travelers);
        ParsedBudget historyBudget = detectBudget(historyText, travelers);
        BigDecimal previousBudgetAmount = asBigDecimal(previous.get("budgetAmount"));
        BigDecimal previousBudgetPerPerson = asBigDecimal(previous.get("budgetPerPerson"));
        String previousBudgetScope = asString(previous.get("budgetScope"));
        String previousCurrency = asString(previous.get("currency"));
        if (currentBudget == null && previousBudgetAmount != null && isFollowUp(normalize(current)) && containsAny(normalize(current), "cheaper", "lower budget", "re hon", "re nua", "giam ngan sach")) {
            currentBudget = new ParsedBudget(previousBudgetAmount.multiply(BigDecimal.valueOf(0.85)).setScale(0, RoundingMode.HALF_UP), firstNonBlank(previousCurrency, "VND"), firstNonBlank(previousBudgetScope, "TOTAL"), null, null);
        }
        ParsedBudget selectedBudget = firstNonNull(currentBudget, historyBudget);
        BigDecimal budgetAmount = firstNonNull(
                selectedBudget != null ? selectedBudget.amount() : null,
                previousBudgetAmount
        );
        String currency = firstNonBlank(
                selectedBudget != null ? selectedBudget.currency() : null,
                previousCurrency,
                "VND"
        );
        String budgetScope = firstNonBlank(
                selectedBudget != null ? selectedBudget.scope() : null,
                previousBudgetScope,
                budgetAmount != null ? "TOTAL" : null
        );
        BigDecimal budgetPerPerson = firstNonNull(
                selectedBudget != null && "PER_PERSON".equals(selectedBudget.scope()) ? selectedBudget.amount() : null,
                previousBudgetPerPerson,
                budgetAmount != null && "PER_PERSON".equals(budgetScope) ? budgetAmount : null
        );

        Set<String> interests = new LinkedHashSet<>(asStringList(previous.get("interests")));
        interests.addAll(detectInterests(combined));

        String budgetLevel = firstNonBlank(asString(previous.get("budgetLevel")), detectBudgetLevel(combined));
        String accommodation = firstNonBlank(asString(previous.get("accommodationPreference")), detectAccommodation(combined));
        String transport = firstNonBlank(asString(previous.get("transportPreference")), detectTransport(combined));
        String style = firstNonBlank(asString(previous.get("tripStyle")), detectTripStyle(combined));
        String dates = firstNonBlank(asString(previous.get("travelDates")), detectTravelDates(combined));
        String previousMode = firstNonBlank(asString(previous.get("responseMode")), asString(previous.get("previousResponseMode")));
        String normalizedCurrent = normalize(current);
        boolean currentWantsItinerary = containsAny(
                normalizedCurrent,
                "itinerary",
                "schedule",
                "plan",
                "route",
                "day by day",
                "what should",
                "lap ke hoach",
                "lich trinh",
                "du lich",
                "chuyen di",
                "chuyen du lich"
        );
        boolean wantsItinerary = currentWantsItinerary
                || (Boolean.TRUE.equals(previous.get("wantsItinerary")) && isFollowUp(normalizedCurrent));

        return new TravelContext(
                explicitDestination,
                previousDestination,
                listingName,
                durationDays,
                dates,
                travelers,
                budgetLevel,
                budgetAmount,
                budgetPerPerson,
                currency,
                budgetScope,
                new ArrayList<>(interests),
                accommodation,
                transport,
                style,
                asLongList(previous.get("previouslyRecommendedListings")),
                previousMode,
                wantsItinerary
        );
    }

    private List<ListingResponse> fetchRelevantListings(AssistantRequest request, TravelContext context, AssistantIntent intent, int limit) {
        String destination = context.destination();
        if (destination == null && intent == AssistantIntent.ITINERARY_ADJUSTMENT) {
            destination = context.previousDestination();
        }
        if (destination == null && intent == AssistantIntent.RECOMMENDATION_REQUEST && context.previousResponseMode() != null) {
            destination = context.previousDestination();
        }
        return marketplaceAiContextService.search(new MarketplaceAiContextService.MarketplaceQueryContext(
                destination,
                categoriesForIntent(intent, context),
                null,
                context.budgetAmount(),
                context.interests(),
                context.travelerCount(),
                context.previouslyRecommendedListings(),
                intent == AssistantIntent.EXACT_LISTING_SEARCH ? context.listingName() : null,
                safeText(request.getMessage()),
                limit
        ));
    }

    private List<ListingResponse> activeListings(List<ListingResponse> listings) {
        if (listings == null || listings.isEmpty()) {
            return List.of();
        }
        return listings.stream()
                .filter(listing -> listing.getId() != null)
                .filter(listing -> "ACTIVE".equalsIgnoreCase(listing.getStatus()))
                .toList();
    }

    private String buildDetailedListingContext(List<ListingResponse> listings) {
        if (listings.isEmpty()) {
            return "No matching active marketplace listings were found.";
        }
        StringBuilder sb = new StringBuilder();
        for (ListingResponse l : listings) {
            sb.append("- ID: ").append(l.getId())
                    .append(" | Source: DATABASE")
                    .append(" | Slug: ").append(safeText(l.getSlug()))
                    .append(" | Name: ").append(safeText(l.getTitle()))
                    .append(" | Category: ").append(safeText(l.getCategory()))
                    .append(" | City: ").append(safeText(l.getCity()))
                    .append(" | Country: ").append(safeText(l.getCountry()))
                    .append(" | Price: ").append(l.getBasePrice() != null ? l.getBasePrice() : "N/A").append(" ").append(safeText(l.getCurrency()))
                    .append(" | PriceUnit: ").append(resolvePriceUnit(l))
                    .append(" | Rating: ").append(l.getAverageRating() != null ? l.getAverageRating() : "N/A")
                    .append(" | Reviews: ").append(l.getReviewCount() != null ? l.getReviewCount() : 0)
                    .append(" | Provider: ").append(safeText(l.getProviderName()))
                    .append(" | Image: ").append(firstNonBlank(resolveImageUrl(l), "N/A"))
                    .append(" | Description: ").append(truncate(safeText(firstNonBlank(l.getShortDesc(), l.getDescription())), 180))
                    .append("\n");
        }
        return sb.toString();
    }

    private Optional<RecommendationPayload> parseRecommendation(String aiText, List<ListingResponse> listings, TravelContext context) {
        Optional<JsonNode> parsed = structuredParser.parseObject(aiText);
        if (parsed.isEmpty()) {
            return Optional.empty();
        }
        try {
            JsonNode root = parsed.get();
            boolean modelSelectedIds = hasArrayValues(root.path("listingIds"));
            List<AssistantResponse.ListingRecommendation> recommendations = hydrateRecommendations(root.path("listingIds"), listings);
            if (modelSelectedIds && recommendations.isEmpty()) {
                log.warn("AI grounding violation: recommendation IDs were outside DATABASE_ONLY context");
            }
            String destination = firstNonBlank(root.path("destination").asText(null), context.destination(), "your trip");
            String message = recommendations.isEmpty()
                    ? "I could not find matching active marketplace listings for " + destination + "."
                    : "I found active marketplace options for " + destination + ".";
            return Optional.of(new RecommendationPayload(
                    message,
                    destination,
                    recommendations.isEmpty() ? "No matching active database-backed listings are currently available." : "Curated from active database-backed marketplace listings.",
                    recommendations,
                    readStringArray(root.path("followUpSuggestions"))
            ));
        } catch (Exception e) {
            log.warn("Unable to normalize assistant recommendation JSON");
            return Optional.empty();
        }
    }

    private RecommendationPayload fallbackRecommendationPayload(AssistantRequest request, List<ListingResponse> listings, TravelContext context) {
        List<AssistantResponse.ListingRecommendation> recommendations = listings.stream()
                .limit(5)
                .map(this::toRecommendation)
                .toList();
        String destination = firstNonBlank(context.destination(), "your trip");
        String message = recommendations.isEmpty()
                ? "I could not find active marketplace listings for " + destination + " yet, but I can still help shape the trip."
                : "I found active marketplace options for " + destination + ".";
        return new RecommendationPayload(
                message,
                destination,
                recommendations.isEmpty() ? "No matching active listings are currently available." : "These picks are grounded in active marketplace listings.",
                recommendations,
                defaultFollowUps(AssistantIntent.RECOMMENDATION_REQUEST)
        );
    }

    private Optional<AssistantResponse.ItineraryCard> parseItineraryCard(
            String aiText,
            AssistantRequest request,
            List<ListingResponse> listings,
            TravelContext context,
            int durationDays,
            BudgetAllocation budgetAllocation
    ) {
        Optional<JsonNode> parsed = structuredParser.parseObject(aiText);
        if (parsed.isEmpty()) {
            return Optional.empty();
        }
        try {
            JsonNode root = parsed.get();
            Map<Long, ListingResponse> listingById = listingsById(listings);
            List<AssistantResponse.ListingRecommendation> recommendations = hydrateRecommendations(root.path("listingIds"), listings);
            if (hasArrayValues(root.path("listingIds")) && recommendations.isEmpty()) {
                log.warn("AI grounding violation: itinerary listingIds were outside DATABASE_ONLY context");
            }

            String destination = firstNonBlank(root.path("destination").asText(null), context.destination(), request.getContextDestination(), "Your trip");
            if (destination.isBlank()) {
                return Optional.empty();
            }
            String title = destination + " Marketplace Itinerary";
            if (title.isBlank()) {
                return Optional.empty();
            }
            String heroImage = selectHeroImage(destination, recommendations, listings);

            List<AssistantResponse.ItineraryDay> days = new ArrayList<>();
            JsonNode daysNode = root.path("days");
            if (daysNode.isArray()) {
                for (JsonNode dayNode : daysNode) {
                    List<Long> relatedIds = mergeListingIds(
                            dayNode.path("relatedListingIds"),
                            dayNode.path("listingIds"),
                            dayNode.path("highlightListingId")
                    ).stream()
                            .filter(listingById::containsKey)
                            .toList();
                    long highlightId = dayNode.path("highlightListingId").asLong(relatedIds.isEmpty() ? -1 : relatedIds.getFirst());
                    ListingResponse highlight = listingById.get(highlightId);
                    if (highlight == null && !relatedIds.isEmpty()) {
                        highlight = listingById.get(relatedIds.getFirst());
                    }
                    String label = dynamicDayLabel(highlight, context, days.size(), durationDays);
                    String groundedTitle = dynamicDayTitle(destination, highlight, label, days.size(), durationDays);
                    String groundedDescription = dynamicDayDescription(destination, highlight, context);
                    days.add(AssistantResponse.ItineraryDay.builder()
                            .dayNumber(dayNode.path("dayNumber").asInt(days.size() + 1))
                            .title(groundedTitle)
                            .shortLabel(label)
                            .shortDescription(groundedDescription)
                            .morning(days.isEmpty() ? "Arrive in " + destination + " and keep the first stop light." : "Start with a low-cost local stop that matches your pace.")
                            .afternoon(highlight != null ? "Use " + highlight.getTitle() + " as the verified marketplace anchor for this part of the day." : "Explore flexible public areas near the city center.")
                            .evening(days.size() == durationDays - 1 ? "Keep the final evening simple and prepare for departure." : eveningSuggestion(context, highlight))
                            .imageUrl(highlight != null ? resolveImageUrl(highlight) : imageByIndex(listings, days.size()))
                            .highlightImageUrl(highlight != null ? resolveImageUrl(highlight) : imageByIndex(listings, days.size()))
                            .relatedListingIds(relatedIds)
                            .build());
                }
            }
            if (days.isEmpty()) {
                return Optional.empty();
            }
            days = normalizeDayCount(days, request, listings, context, durationDays);

            List<String> followUps = readStringArray(root.path("followUpSuggestions"));
            if (followUps.isEmpty()) {
                followUps.addAll(defaultFollowUps(AssistantIntent.TRIP_PLANNING));
            }
            if (recommendations.isEmpty()) {
                recommendations = hydrateRecommendationsFromDayIds(days, listings);
            }

            String durationText = firstNonBlank(root.path("durationText").asText(null), durationDays + "D / " + Math.max(durationDays - 1, 0) + "N");
            int nights = Math.max(durationDays - 1, 0);
            BigDecimal estimatedTotal = estimateItineraryTotal(recommendations, listings, durationDays, travelerCount(context));
            return Optional.of(AssistantResponse.ItineraryCard.builder()
                    .title(title)
                    .destination(destination)
                    .durationDays(durationDays)
                    .durationNights(nights)
                    .startDate(resolveStartDate(context))
                    .endDate(resolveStartDate(context) == null ? null : resolveStartDate(context).plusDays(Math.max(durationDays - 1, 0)))
                    .durationText(durationText)
                    .travelerText(firstNonBlank(root.path("travelerText").asText(null), context.travelerCount() != null ? context.travelerCount() + " travelers" : null))
                    .budgetText(firstNonBlank(root.path("budgetText").asText(null), budgetText(context)))
                    .travelerCount(context.travelerCount())
                    .budget(buildBudgetSummary(budgetAllocation, estimatedTotal, true))
                    .bestTimeText(firstNonBlank(root.path("bestTimeText").asText(null), null))
                    .summary(groundedItinerarySummary(destination, recommendations, readStringArray(root.path("missingCategories"))))
                    .heroImageUrl(heroImage)
                    .mapLabel(firstNonBlank(root.path("mapLabel").asText(null), destination))
                    .insufficientMarketplaceData(root.path("insufficientMarketplaceData").asBoolean(false))
                    .missingCategories(readStringArray(root.path("missingCategories")))
                    .groundingMode("DATABASE_ONLY")
                    .listingRecommendations(recommendations)
                    .recommendedListings(recommendations)
                    .days(days)
                    .followUpSuggestions(followUps)
                    .build());
        } catch (Exception e) {
            log.warn("Unable to normalize assistant itinerary JSON");
            return Optional.empty();
        }
    }

    private Optional<AssistantResponse.ItineraryCard> repairItineraryResponse(
            String malformedResponse,
            AssistantRequest request,
            List<ListingResponse> listings,
            TravelContext context,
            int durationDays,
            BudgetAllocation budgetAllocation
    ) {
        String repairPrompt = """
                Convert the following malformed itinerary response into one valid JSON object matching this schema:
                {
                  "title": "string",
                  "destination": "string",
                  "durationText": "3D / 2N",
                  "travelerText": "optional string",
                  "budgetText": "optional string",
                  "bestTimeText": "optional string",
                  "summary": "string",
                  "mapLabel": "optional string",
                  "listingIds": [1, 2],
                  "days": [
                    {
                      "dayNumber": 1,
                      "title": "string",
                      "shortLabel": "string",
                      "highlightListingId": 1,
                      "relatedListingIds": [1, 2]
                    }
                  ],
                  "followUpSuggestions": ["string"]
                }

                Return JSON only. No markdown fences. Preserve the original meaning.
                Use only listing IDs from this allowed set: %s.
                Do not create listing titles, prices, ratings, providers, images, links, or named marketplace services.

                Malformed response:
                %s
                """.formatted(
                listings.stream().map(ListingResponse::getId).filter(id -> id != null).toList(),
                truncate(safeText(malformedResponse), 5000)
        );
        try {
            AiResponse repaired = aiProvider.complete(AiRequest.builder()
                    .prompt(repairPrompt)
                    .systemContext("You repair malformed AI itinerary output into strict JSON only.")
                    .maxTokens(1400)
                    .temperature(0.1)
                    .jsonResponse(true)
                    .build());
            return parseItineraryCard(repaired.getText(), request, listings, context, durationDays, budgetAllocation);
        } catch (Exception ex) {
            log.warn("Assistant itinerary JSON repair failed: {}", ex.getClass().getSimpleName());
            return Optional.empty();
        }
    }

    private AssistantResponse buildBudgetClarificationResponse(
            AssistantRequest request,
            IntentResult intentResult,
            BudgetAllocation allocation,
            BudgetFeasibility feasibility
    ) {
        String destination = firstNonBlank(intentResult.context().destination(), intentResult.context().previousDestination(), "that destination");
        String message = "Your budget of " + formatPrice(allocation.requestedTotal(), allocation.currency())
                + " looks too low for a " + (intentResult.context().durationDays() == null ? "multi-day" : intentResult.context().durationDays() + "-day")
                + " trip to " + destination + " with the current marketplace prices.";
        List<String> suggestions = feasibility.alternatives().isEmpty()
                ? List.of("Reduce to 1 day", "Show free activities", "Exclude accommodation")
                : feasibility.alternatives();
        return AssistantResponse.builder()
                .type(AssistantResponse.AssistantResponseType.CLARIFICATION.name())
                .intent(intentResult.intent().name())
                .purpose(intentResult.purpose().name())
                .confidence(intentResult.confidence())
                .contextUsed(true)
                .message(message)
                .reply(message)
                .recommendations(List.of())
                .suggestions(suggestions)
                .suggestedActions(suggestions)
                .budgetAdvice(AssistantResponse.BudgetAdvice.builder()
                        .requestedTotal(allocation.requestedTotal())
                        .minimumEstimatedBudget(feasibility.minimumEstimatedTotal())
                        .currency(allocation.currency())
                        .alternatives(suggestions)
                        .build())
                .extractedContext(withResponseMode(intentResult.context(), "clarification", intentResult.intent()))
                .mockedAi(false)
                .build();
    }

    private AssistantResponse.ItineraryCard normalizeItineraryAgainstBudget(
            AssistantResponse.ItineraryCard card,
            AssistantRequest request,
            List<ListingResponse> listings,
            TravelContext context,
            int durationDays,
            BudgetAllocation allocation
    ) {
        if (card == null) {
            return fallbackItineraryCard(request, listings, context, durationDays, allocation);
        }
        List<AssistantResponse.ItineraryDay> days = normalizeDayCount(
                card.getDays() == null ? List.of() : card.getDays(),
                request,
                listings,
                context,
                durationDays
        );
        List<AssistantResponse.ListingRecommendation> recommendations = card.getRecommendedListings() == null
                ? List.of()
                : card.getRecommendedListings();
        BigDecimal estimated = estimateItineraryTotal(recommendations, listings, durationDays, travelerCount(context));
        if (allocation.present() && estimated.compareTo(allocation.requestedTotal().multiply(BigDecimal.valueOf(1.10))) > 0) {
            return fallbackItineraryCard(request, rankListingsForPlan(listings, context, allocation, durationDays), context, durationDays, allocation);
        }
        card.setDurationDays(durationDays);
        card.setDurationNights(Math.max(durationDays - 1, 0));
        LocalDate startDate = resolveStartDate(context);
        card.setStartDate(startDate);
        card.setEndDate(startDate == null ? null : startDate.plusDays(Math.max(durationDays - 1, 0)));
        card.setTravelerCount(context.travelerCount());
        card.setBudget(buildBudgetSummary(allocation, estimated, true));
        card.setBudgetText(firstNonBlank(card.getBudgetText(), budgetText(context)));
        card.setDays(days);
        card.setRecommendedListings(recommendations);
        card.setListingRecommendations(recommendations);
        card.setGroundingMode("DATABASE_ONLY");
        if (card.getFollowUpSuggestions() == null || card.getFollowUpSuggestions().isEmpty()) {
            card.setFollowUpSuggestions(contextAwareFollowUps(context, allocation, true));
        }
        return card;
    }

    private List<AssistantResponse.ItineraryDay> normalizeDayCount(
            List<AssistantResponse.ItineraryDay> days,
            AssistantRequest request,
            List<ListingResponse> listings,
            TravelContext context,
            int durationDays
    ) {
        List<AssistantResponse.ItineraryDay> normalizedDays = new ArrayList<>(days == null ? List.of() : days);
        if (normalizedDays.size() > durationDays) {
            normalizedDays = new ArrayList<>(normalizedDays.subList(0, durationDays));
        }
        if (normalizedDays.size() < durationDays) {
            AssistantResponse.ItineraryCard fallback = fallbackItineraryCard(request, listings, context, durationDays, buildBudgetAllocation(context, durationDays));
            for (AssistantResponse.ItineraryDay fallbackDay : fallback.getDays()) {
                if (normalizedDays.size() >= durationDays) break;
                if (fallbackDay.getDayNumber() > normalizedDays.size()) {
                    normalizedDays.add(fallbackDay);
                }
            }
        }
        for (int i = 0; i < normalizedDays.size(); i++) {
            normalizedDays.get(i).setDayNumber(i + 1);
        }
        return normalizedDays;
    }

    private AssistantResponse.ItineraryDay defaultDay(String destination, String imageUrl) {
        return AssistantResponse.ItineraryDay.builder()
                .dayNumber(1)
                .title("Arrival and orientation")
                .shortLabel("Arrival")
                .shortDescription("Settle in and get oriented.")
                .morning("Arrive in " + destination + " and settle into your stay.")
                .afternoon("Explore nearby neighborhoods and local highlights.")
                .evening("Choose a relaxed dinner spot and plan tomorrow's route.")
                .imageUrl(imageUrl)
                .highlightImageUrl(imageUrl)
                .relatedListingIds(List.of())
                .build();
    }

    private List<AssistantResponse.ListingRecommendation> hydrateRecommendations(JsonNode listingIds, List<ListingResponse> listings) {
        Map<Long, ListingResponse> listingById = listingsById(listings);
        List<AssistantResponse.ListingRecommendation> recommendations = new ArrayList<>();
        int requested = 0;
        int discarded = 0;
        if (listingIds.isArray()) {
            for (JsonNode node : listingIds) {
                if (node.canConvertToLong()) {
                    requested++;
                    ListingResponse listing = listingById.get(node.asLong());
                    if (listing != null && "ACTIVE".equalsIgnoreCase(listing.getStatus())) {
                        recommendations.add(toRecommendation(listing));
                    } else {
                        discarded++;
                    }
                }
            }
        }
        if (requested > 0 && discarded > 0) {
            log.warn("AI grounding discardedUnknownOrInactiveIds={} selectedListings={}", discarded, recommendations.size());
        }
        return recommendations;
    }

    private List<AssistantResponse.ListingRecommendation> hydrateRecommendationsFromDayIds(
            List<AssistantResponse.ItineraryDay> days,
            List<ListingResponse> listings
    ) {
        Map<Long, ListingResponse> listingById = listingsById(listings);
        Set<Long> seen = new LinkedHashSet<>();
        List<AssistantResponse.ListingRecommendation> recommendations = new ArrayList<>();
        for (AssistantResponse.ItineraryDay day : days == null ? List.<AssistantResponse.ItineraryDay>of() : days) {
            for (Long id : day.getRelatedListingIds() == null ? List.<Long>of() : day.getRelatedListingIds()) {
                ListingResponse listing = listingById.get(id);
                if (listing != null && "ACTIVE".equalsIgnoreCase(listing.getStatus()) && seen.add(id)) {
                    recommendations.add(toRecommendation(listing));
                }
            }
        }
        return recommendations.stream().limit(4).toList();
    }

    private BudgetAllocation buildBudgetAllocation(TravelContext context, int durationDays) {
        BigDecimal requested = context.budgetAmount();
        BigDecimal perPerson = context.budgetPerPerson();
        String currency = firstNonBlank(context.currency(), "VND");
        int travelers = travelerCount(context);
        if (requested == null && perPerson != null) {
            requested = perPerson.multiply(BigDecimal.valueOf(travelers));
        }
        if (requested == null) {
            return new BudgetAllocation(null, null, currency, null, null, null, null, null, false);
        }
        if ("PER_PERSON".equals(context.budgetScope())) {
            perPerson = requested;
            requested = requested.multiply(BigDecimal.valueOf(travelers));
        } else if (perPerson == null && travelers > 0) {
            perPerson = requested.divide(BigDecimal.valueOf(travelers), 0, RoundingMode.HALF_UP);
        }

        boolean dayTrip = durationDays <= 1;
        BigDecimal accommodation = requested.multiply(BigDecimal.valueOf(dayTrip ? 0.10 : 0.40)).setScale(0, RoundingMode.HALF_UP);
        BigDecimal food = requested.multiply(BigDecimal.valueOf(dayTrip ? 0.35 : 0.25)).setScale(0, RoundingMode.HALF_UP);
        BigDecimal transport = requested.multiply(BigDecimal.valueOf(dayTrip ? 0.20 : 0.15)).setScale(0, RoundingMode.HALF_UP);
        BigDecimal activities = requested.multiply(BigDecimal.valueOf(dayTrip ? 0.30 : 0.15)).setScale(0, RoundingMode.HALF_UP);
        BigDecimal buffer = requested.subtract(accommodation).subtract(food).subtract(transport).subtract(activities).max(BigDecimal.ZERO);
        return new BudgetAllocation(requested, perPerson, currency, accommodation, food, transport, activities, buffer, true);
    }

    private List<ListingResponse> rankListingsForPlan(List<ListingResponse> listings, TravelContext context, BudgetAllocation allocation, int durationDays) {
        if (listings == null || listings.isEmpty()) {
            return List.of();
        }
        int travelers = travelerCount(context);
        return listings.stream()
                .filter(listing -> listing.getId() != null)
                .filter(listing -> "ACTIVE".equalsIgnoreCase(listing.getStatus()))
                .filter(listing -> !allocation.present() || isListingWithinCategoryBudget(listing, allocation, durationDays, travelers))
                .sorted(Comparator
                        .comparingDouble((ListingResponse listing) -> listingScore(listing, context, allocation, durationDays, travelers)).reversed()
                        .thenComparing(listing -> listing.getId() == null ? Long.MAX_VALUE : listing.getId()))
                .limit(12)
                .toList();
    }

    private boolean isListingWithinCategoryBudget(ListingResponse listing, BudgetAllocation allocation, int durationDays, int travelers) {
        BigDecimal limit = categoryLimit(listing, allocation);
        if (limit == null || limit.compareTo(BigDecimal.ZERO) <= 0) {
            return true;
        }
        BigDecimal cost = estimateListingCost(listing, durationDays, travelers);
        return cost.compareTo(limit.multiply(BigDecimal.valueOf(1.15))) <= 0;
    }

    private double listingScore(ListingResponse listing, TravelContext context, BudgetAllocation allocation, int durationDays, int travelers) {
        double score = 0;
        BigDecimal rating = listing.getAverageRating() == null ? BigDecimal.ZERO : listing.getAverageRating();
        score += rating.doubleValue() * 10;
        score += Math.min(10, listing.getReviewCount() == null ? 0 : listing.getReviewCount() / 10.0);
        if (context.previouslyRecommendedListings() != null && context.previouslyRecommendedListings().contains(listing.getId())) {
            score -= 18;
        }
        String category = normalize(listing.getCategory());
        for (String interest : context.interests()) {
            if (("food".equals(interest) || "seafood".equals(interest)) && category.contains("restaurant")) score += 12;
            if ("beach".equals(interest) && containsAny(normalize(firstNonBlank(listing.getTitle(), listing.getShortDesc(), listing.getCity())), "beach", "sea", "ocean", "coast")) score += 10;
            if ("culture".equals(interest) && (category.contains("tour") || category.contains("experience"))) score += 8;
        }
        if (allocation.present()) {
            BigDecimal limit = categoryLimit(listing, allocation);
            BigDecimal cost = estimateListingCost(listing, durationDays, travelers);
            if (limit != null && limit.compareTo(BigDecimal.ZERO) > 0) {
                double ratio = cost.divide(limit, 4, RoundingMode.HALF_UP).doubleValue();
                score += ratio <= 1 ? 30 - (ratio * 8) : -25 * ratio;
            }
        }
        return score;
    }

    private BudgetFeasibility evaluateBudgetFeasibility(TravelContext context, BudgetAllocation allocation, List<ListingResponse> affordableListings, int durationDays) {
        if (!allocation.present()) {
            return new BudgetFeasibility(true, BigDecimal.ZERO, List.of());
        }
        int travelers = travelerCount(context);
        BigDecimal cheapestHotel = cheapestCost(affordableListings, "HOTEL", durationDays, travelers);
        BigDecimal cheapestRestaurant = cheapestCost(affordableListings, "RESTAURANT", durationDays, travelers);
        BigDecimal cheapestActivity = cheapestCost(affordableListings, "TOUR", durationDays, travelers);
        if (cheapestActivity.compareTo(BigDecimal.ZERO) == 0) {
            cheapestActivity = cheapestCost(affordableListings, "EXPERIENCE", durationDays, travelers);
        }

        BigDecimal minAccommodation = durationDays > 1
                ? (cheapestHotel.compareTo(BigDecimal.ZERO) > 0 ? cheapestHotel : BigDecimal.valueOf(250_000L).multiply(BigDecimal.valueOf(durationDays - 1)))
                : BigDecimal.ZERO;
        BigDecimal minFood = cheapestRestaurant.compareTo(BigDecimal.ZERO) > 0
                ? cheapestRestaurant.min(BigDecimal.valueOf(120_000L).multiply(BigDecimal.valueOf((long) durationDays * travelers)))
                : BigDecimal.valueOf(120_000L).multiply(BigDecimal.valueOf((long) durationDays * travelers));
        BigDecimal minTransport = BigDecimal.valueOf(80_000L).multiply(BigDecimal.valueOf(durationDays));
        BigDecimal minActivities = cheapestActivity.compareTo(BigDecimal.ZERO) > 0
                ? cheapestActivity.min(BigDecimal.valueOf(50_000L).multiply(BigDecimal.valueOf(durationDays)))
                : BigDecimal.valueOf(50_000L).multiply(BigDecimal.valueOf(durationDays));
        BigDecimal minimum = minAccommodation.add(minFood).add(minTransport).add(minActivities);
        boolean feasible = allocation.requestedTotal().compareTo(minimum.multiply(BigDecimal.valueOf(0.90)).setScale(0, RoundingMode.HALF_UP)) >= 0;
        List<String> alternatives = feasible ? List.of() : List.of(
                "Reduce the trip to 1 day",
                "Exclude accommodation from the budget",
                "Increase the budget to around " + formatPrice(minimum, allocation.currency())
        );
        return new BudgetFeasibility(feasible, minimum, alternatives);
    }

    private BigDecimal cheapestCost(List<ListingResponse> listings, String category, int durationDays, int travelers) {
        return listings.stream()
                .filter(listing -> category.equalsIgnoreCase(firstNonBlank(listing.getCategory(), "")))
                .map(listing -> estimateListingCost(listing, durationDays, travelers))
                .filter(cost -> cost.compareTo(BigDecimal.ZERO) > 0)
                .min(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);
    }

    private AssistantResponse.ListingRecommendation toRecommendation(ListingResponse listing) {
        return AssistantResponse.ListingRecommendation.builder()
                .id(listing.getId())
                .title(firstNonBlank(listing.getTitle(), "Marketplace listing"))
                .name(firstNonBlank(listing.getTitle(), "Marketplace listing"))
                .category(listing.getCategory())
                .imageUrl(resolveImageUrl(listing))
                .location(List.of(listing.getCity(), listing.getCountry()).stream().filter(s -> s != null && !s.isBlank()).collect(Collectors.joining(", ")))
                .priceText(formatPrice(listing.getBasePrice(), listing.getCurrency()))
                .price(listing.getBasePrice())
                .currency(firstNonBlank(listing.getCurrency(), "VND"))
                .priceUnit(resolvePriceUnit(listing))
                .rating(listing.getAverageRating())
                .reviewCount(listing.getReviewCount())
                .slug(listing.getSlug())
                .ratingText(listing.getAverageRating() != null ? listing.getAverageRating() + " (" + (listing.getReviewCount() != null ? listing.getReviewCount() : 0) + ")" : "No reviews")
                .shortDescription(truncate(firstNonBlank(listing.getShortDesc(), listing.getDescription(), ""), 120))
                .providerName(listing.getProviderName())
                .source("DATABASE")
                .build();
    }

    private String selectHeroImage(List<AssistantResponse.ListingRecommendation> recommendations, List<ListingResponse> listings) {
        return selectHeroImage(null, recommendations, listings);
    }

    private String selectHeroImage(String destination, List<AssistantResponse.ListingRecommendation> recommendations, List<ListingResponse> listings) {
        return destinationImageResolver.heroImage(destination, recommendations, listings);
    }

    private String imageByIndex(List<ListingResponse> listings, int index) {
        return destinationImageResolver.dayImage(listings, index);
    }

    private String resolveImageUrl(ListingResponse listing) {
        if (listing.getCoverImageUrl() != null && !listing.getCoverImageUrl().isBlank()) {
            return listing.getCoverImageUrl();
        }
        if (listing.getImages() != null) {
            return listing.getImages().stream()
                    .filter(image -> Boolean.TRUE.equals(image.getIsPrimary()) && image.getImageUrl() != null && !image.getImageUrl().isBlank())
                    .findFirst()
                    .or(() -> listing.getImages().stream().filter(image -> image.getImageUrl() != null && !image.getImageUrl().isBlank()).findFirst())
                    .map(ListingResponse.ListingImageResponse::getImageUrl)
                    .orElse(null);
        }
        return null;
    }

    private String formatPrice(BigDecimal amount, String currency) {
        if (amount == null) {
            return "Price unavailable";
        }
        String safeCurrency = firstNonBlank(currency, "VND");
        try {
            NumberFormat format = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("vi-VN"));
            format.setCurrency(java.util.Currency.getInstance(safeCurrency));
            format.setMaximumFractionDigits(0);
            return format.format(amount);
        } catch (Exception ignored) {
            return amount.toPlainString() + " " + safeCurrency;
        }
    }

    private BigDecimal estimateListingCost(ListingResponse listing, int durationDays, int travelers) {
        if (listing == null || listing.getBasePrice() == null) {
            return BigDecimal.ZERO;
        }
        BigDecimal price = listing.getBasePrice();
        String priceUnit = normalize(resolvePriceUnit(listing));
        if (priceUnit.contains("night")) {
            int nights = Math.max(durationDays - 1, 0);
            return nights <= 0 ? BigDecimal.ZERO : price.multiply(BigDecimal.valueOf(nights));
        }
        if (priceUnit.contains("person")) {
            return price.multiply(BigDecimal.valueOf(Math.max(1, travelers)));
        }
        if (priceUnit.contains("day")) {
            return price.multiply(BigDecimal.valueOf(Math.max(1, durationDays)));
        }
        String category = normalize(listing.getCategory());
        int nights = Math.max(durationDays - 1, 0);
        if (category.contains("hotel") || category.contains("stay") || category.contains("homestay")) {
            return nights <= 0 ? BigDecimal.ZERO : price.multiply(BigDecimal.valueOf(nights));
        }
        if (category.contains("tour") || category.contains("experience")) {
            return price.multiply(BigDecimal.valueOf(Math.max(1, travelers)));
        }
        if (category.contains("vehicle") || category.contains("car")) {
            return price.multiply(BigDecimal.valueOf(Math.max(1, durationDays)));
        }
        if (category.contains("restaurant")) {
            return price.multiply(BigDecimal.valueOf(Math.max(1, travelers)));
        }
        return price;
    }

    private String resolvePriceUnit(ListingResponse listing) {
        Object detailsPriceUnit = listing.getDetails() == null ? null : firstNonNull(
                listing.getDetails().get("priceUnit"),
                listing.getDetails().get("price_unit"),
                listing.getDetails().get("unit")
        );
        String explicit = detailsPriceUnit == null ? null : detailsPriceUnit.toString();
        if (explicit != null && !explicit.isBlank()) {
            return explicit.toUpperCase(Locale.ROOT);
        }
        String category = normalize(listing.getCategory());
        if (category.contains("hotel") || category.contains("stay") || category.contains("homestay")) return "NIGHT";
        if (category.contains("tour") || category.contains("experience")) return "PERSON";
        if (category.contains("vehicle") || category.contains("car")) return "DAY";
        if (category.contains("restaurant")) return "BOOKING";
        return "BOOKING";
    }

    private BigDecimal categoryLimit(ListingResponse listing, BudgetAllocation allocation) {
        String category = normalize(listing.getCategory());
        if (category.contains("hotel") || category.contains("stay") || category.contains("homestay")) return allocation.accommodationLimit();
        if (category.contains("restaurant")) return allocation.foodLimit();
        if (category.contains("vehicle") || category.contains("car")) return allocation.transportLimit();
        if (category.contains("tour") || category.contains("experience")) return allocation.activityLimit();
        return allocation.requestedTotal();
    }

    private BigDecimal estimateItineraryTotal(
            List<AssistantResponse.ListingRecommendation> recommendations,
            List<ListingResponse> listings,
            int durationDays,
            int travelers
    ) {
        Map<Long, ListingResponse> byId = listingsById(listings);
        BigDecimal total = BigDecimal.ZERO;
        Set<Long> seen = new LinkedHashSet<>();
        for (AssistantResponse.ListingRecommendation recommendation : recommendations == null ? List.<AssistantResponse.ListingRecommendation>of() : recommendations) {
            if (recommendation.getId() == null || !seen.add(recommendation.getId())) {
                continue;
            }
            ListingResponse listing = byId.get(recommendation.getId());
            if (listing != null) {
                total = total.add(estimateListingCost(listing, durationDays, travelers));
            }
        }
        return total;
    }

    private AssistantResponse.BudgetSummary buildBudgetSummary(BudgetAllocation allocation, BigDecimal estimatedTotal, boolean feasible) {
        if (!allocation.present()) {
            return null;
        }
        BigDecimal accommodation = safe(allocation.accommodationLimit());
        BigDecimal food = safe(allocation.foodLimit());
        BigDecimal transport = safe(allocation.transportLimit());
        BigDecimal activities = safe(allocation.activityLimit());
        BigDecimal buffer = safe(allocation.buffer());
        BigDecimal breakdownTotal = sumCostBreakdown(accommodation, food, transport, activities, buffer);
        BigDecimal calculatedTotal = breakdownTotal.signum() > 0 ? breakdownTotal : safe(estimatedTotal);
        boolean withinBudget = allocation.requestedTotal() == null || calculatedTotal.compareTo(allocation.requestedTotal()) <= 0;
        return AssistantResponse.BudgetSummary.builder()
                .requestedTotal(allocation.requestedTotal())
                .estimatedTotal(calculatedTotal)
                .total(calculatedTotal)
                .currency(allocation.currency())
                .feasible(feasible && withinBudget)
                .withinBudget(withinBudget)
                .breakdown(AssistantResponse.BudgetBreakdown.builder()
                        .accommodation(accommodation)
                        .food(food)
                        .transport(transport)
                        .activities(activities)
                        .buffer(buffer)
                        .build())
                .build();
    }

    private BigDecimal safe(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private BigDecimal sumCostBreakdown(
            BigDecimal accommodation,
            BigDecimal food,
            BigDecimal transport,
            BigDecimal activities,
            BigDecimal buffer
    ) {
        return safe(accommodation)
                .add(safe(food))
                .add(safe(transport))
                .add(safe(activities))
                .add(safe(buffer));
    }

    private int travelerCount(TravelContext context) {
        return Math.max(1, context.travelerCount() == null ? 1 : context.travelerCount());
    }

    private List<ListingResponse> diversifyListingsForDays(List<ListingResponse> listings, int durationDays) {
        if (listings == null || listings.isEmpty()) {
            return List.of();
        }
        List<ListingResponse> selected = new ArrayList<>();
        Set<Long> seenIds = new LinkedHashSet<>();
        Set<String> seenCategories = new LinkedHashSet<>();
        for (ListingResponse listing : listings) {
            if (listing.getId() == null || seenIds.contains(listing.getId())) continue;
            String category = firstNonBlank(listing.getCategory(), "");
            if (seenCategories.add(category) || selected.size() >= seenCategories.size()) {
                selected.add(listing);
                seenIds.add(listing.getId());
            }
            if (selected.size() >= durationDays) break;
        }
        for (ListingResponse listing : listings) {
            if (selected.size() >= durationDays) break;
            if (listing.getId() != null && seenIds.add(listing.getId())) {
                selected.add(listing);
            }
        }
        return selected;
    }

    private String dynamicDayLabel(ListingResponse listing, TravelContext context, int index, int durationDays) {
        if (listing != null) {
            String category = normalize(listing.getCategory());
            if (category.contains("restaurant")) return "Local food";
            if (category.contains("tour")) return "Guided highlights";
            if (category.contains("experience")) return "Hands-on culture";
            if (category.contains("hotel")) return index == 0 ? "Arrival & stay" : "Stay base";
            if (category.contains("vehicle")) return "Easy transport";
        }
        if (context.interests().contains("beach")) return "Beach time";
        if (context.interests().contains("food") || context.interests().contains("seafood")) return "Food stops";
        if (index == durationDays - 1) return "Departure";
        return "Local highlights";
    }

    private String dynamicDayTitle(String destination, ListingResponse listing, String label, int index, int durationDays) {
        if (listing != null) {
            return label + ": " + listing.getTitle();
        }
        if (index == 0) return "Arrive in " + destination;
        if (index == durationDays - 1) return "Wrap up " + destination;
        return label + " in " + destination;
    }

    private String dynamicDayDescription(String destination, ListingResponse listing, TravelContext context) {
        if (listing != null) {
            return "A budget-aware stop anchored by " + listing.getTitle() + ".";
        }
        if (context.budgetAmount() != null) {
            return "Keep this day flexible with free or low-cost stops around " + destination + ".";
        }
        return "A flexible day shaped around your interests in " + destination + ".";
    }

    private String eveningSuggestion(TravelContext context, ListingResponse listing) {
        if (listing != null && normalize(listing.getCategory()).contains("restaurant")) {
            return "Keep dinner close to the recommended food stop.";
        }
        if (context.interests().contains("food") || context.interests().contains("seafood")) {
            return "Try an affordable local food area and keep transport short.";
        }
        return "Choose a relaxed evening nearby to avoid extra transport costs.";
    }

    private List<String> contextAwareFollowUps(TravelContext context, BudgetAllocation allocation, boolean feasible) {
        if (allocation.present() && !feasible) {
            return List.of("Reduce to 1 day", "Exclude accommodation", "Show free activities");
        }
        List<String> suggestions = new ArrayList<>();
        suggestions.add("Make it cheaper");
        suggestions.add("Add free attractions");
        suggestions.add(context.interests().contains("food") || context.interests().contains("seafood") ? "Add more food stops" : "More food stops");
        suggestions.add("Use public transport");
        return suggestions;
    }

    private List<AiRequest.ConversationMessage> toProviderHistory(List<AssistantMessage> history) {
        if (history == null) {
            return List.of();
        }
        return history.stream()
                .limit(12)
                .map(m -> new AiRequest.ConversationMessage(m.getRole(), m.getContent()))
                .collect(Collectors.toList());
    }

    private String formatConversationHistory(List<AssistantMessage> history) {
        if (history == null || history.isEmpty()) {
            return "No prior history.";
        }
        return history.stream()
                .skip(Math.max(0, history.size() - 12))
                .map(msg -> msg.getRole().toUpperCase(Locale.ROOT) + ": " + truncate(safeText(msg.getContent()), 500))
                .collect(Collectors.joining("\n"));
    }

    private String recentUserText(List<AssistantMessage> history) {
        if (history == null || history.isEmpty()) {
            return "";
        }
        return history.stream()
                .filter(m -> "user".equalsIgnoreCase(m.getRole()))
                .skip(Math.max(0, history.size() - 12))
                .map(AssistantMessage::getContent)
                .filter(s -> s != null && !s.isBlank())
                .collect(Collectors.joining(" "));
    }

    private String detectDestination(String text) {
        String normalized = normalize(text);
        Map<String, String> destinations = new LinkedHashMap<>();
        destinations.put("da nang", "Da Nang");
        destinations.put("danang", "Da Nang");
        destinations.put("hoi an", "Hoi An");
        destinations.put("hoian", "Hoi An");
        destinations.put("ha noi", "Ha Noi");
        destinations.put("hanoi", "Ha Noi");
        destinations.put("ho chi minh", "Ho Chi Minh City");
        destinations.put("saigon", "Ho Chi Minh City");
        destinations.put("nha trang", "Nha Trang");
        destinations.put("da lat", "Da Lat");
        destinations.put("dalat", "Da Lat");
        destinations.put("hue", "Hue");
        destinations.put("phu quoc", "Phu Quoc");
        for (Map.Entry<String, String> entry : destinations.entrySet()) {
            if (normalized.contains(entry.getKey())) {
                return entry.getValue();
            }
        }

        List<Pattern> patterns = List.of(
                Pattern.compile("\\b(?:to|in|for|around|visiting|visit|going to|traveling to)\\s+([a-zA-Z\\s]+?)(?:\\s+for|\\s+with|\\s+next|\\s+this|\\s+under|[,.!?]|$)", Pattern.CASE_INSENSITIVE),
                Pattern.compile("\\b([a-zA-Z\\s]+?)\\s+(?:getaway|trip|itinerary|hotels?)\\b", Pattern.CASE_INSENSITIVE)
        );
        for (Pattern pattern : patterns) {
            Matcher matcher = pattern.matcher(text);
            if (matcher.find()) {
                String candidate = matcher.group(1).trim();
                if (candidate.length() >= 2 && candidate.length() <= 40) {
                    return capitalizeWords(candidate);
                }
            }
        }
        return null;
    }

    private Integer detectDurationDays(String text) {
        Matcher matcher = DURATION_PATTERN.matcher(safeText(text));
        if (matcher.find()) {
            return Math.max(1, Math.min(14, Integer.parseInt(matcher.group(1))));
        }
        if (normalize(text).contains("weekend")) {
            return 2;
        }
        return null;
    }

    private Integer detectTravelerCount(String text) {
        String normalized = normalize(text);
        if (normalized.contains("wife") || normalized.contains("couple")) {
            return 2;
        }
        Matcher matcher = TRAVELER_PATTERN.matcher(safeText(text));
        if (matcher.find()) {
            return Math.max(1, Math.min(20, Integer.parseInt(matcher.group(1))));
        }
        return null;
    }

    private ParsedBudget detectBudget(String text, Integer travelers) {
        String raw = safeText(text);
        if (raw.isBlank()) {
            return null;
        }
        String normalized = normalize(raw)
                .replace("dong", "vnd")
                .replace("trieu", "million")
                .replace("triệu", "million");
        String currency = containsAny(normalized, "usd", "dollar") || raw.contains("$") ? "USD" : "VND";
        String scope = containsAny(normalized, "moi nguoi", "per person", "each", "/ nguoi", "/ person", "per traveler") ? "PER_PERSON" : "TOTAL";

        Matcher range = Pattern.compile("(\\d+(?:[\\.,]\\d+)?)\\s*(?:-|to|den|toi)\\s*(\\d+(?:[\\.,]\\d+)?)\\s*(k|m|tr|mil|million|vnd|usd)?").matcher(normalized);
        if (range.find()) {
            BigDecimal min = parseBudgetNumber(range.group(1), range.group(3), currency);
            BigDecimal max = parseBudgetNumber(range.group(2), range.group(3), currency);
            if (min != null && max != null) {
                return new ParsedBudget(max, currency, scope, min, max);
            }
        }

        Matcher matcher = Pattern.compile("(?:\\$\\s*)?(\\d+(?:[\\.,]\\d+)*)(?:\\s*)(k|m|tr|mil|million|vnd|usd)?").matcher(normalized);
        ParsedBudget best = null;
        while (matcher.find()) {
            BigDecimal value = parseBudgetNumber(matcher.group(1), matcher.group(2), currency);
            if (value == null) continue;
            if (value.compareTo(BigDecimal.valueOf(10_000)) < 0 && "VND".equals(currency) && matcher.group(2) == null) {
                continue;
            }
            best = new ParsedBudget(value, currency, scope, null, null);
        }
        return best;
    }

    private BigDecimal parseBudgetNumber(String number, String unit, String currency) {
        if (number == null || number.isBlank()) {
            return null;
        }
        try {
            String cleaned = number.trim();
            boolean decimalWithUnit = unit != null && cleaned.matches("\\d+[\\.,]\\d{1,2}");
            BigDecimal value = new BigDecimal(decimalWithUnit ? cleaned.replace(",", ".") : cleaned.replace(",", "").replace(".", ""));
            String safeUnit = unit == null ? "" : unit.toLowerCase(Locale.ROOT);
            if (List.of("m", "tr", "mil", "million").contains(safeUnit)) {
                return value.multiply(BigDecimal.valueOf(1_000_000)).setScale(0, RoundingMode.HALF_UP);
            }
            if ("k".equals(safeUnit)) {
                return value.multiply(BigDecimal.valueOf(1_000)).setScale(0, RoundingMode.HALF_UP);
            }
            if ("USD".equals(currency) && value.compareTo(BigDecimal.valueOf(10_000)) < 0) {
                return value;
            }
            return value;
        } catch (Exception ignored) {
            return null;
        }
    }

    private String detectBudgetLevel(String text) {
        String normalized = normalize(text);
        if (containsAny(normalized, "cheap", "budget", "not too expensive", "lower budget", "make it cheaper")) {
            return "budget";
        }
        if (containsAny(normalized, "medium budget", "mid range", "moderate")) {
            return "medium";
        }
        if (containsAny(normalized, "luxury", "premium", "high end")) {
            return "luxury";
        }
        return null;
    }

    private List<String> detectInterests(String text) {
        String normalized = normalize(text);
        List<String> interests = new ArrayList<>();
        addIf(interests, "beach", containsAny(normalized, "beach", "sea", "ocean", "coast"));
        addIf(interests, "seafood", containsAny(normalized, "seafood", "fish", "food", "hai san"));
        addIf(interests, "food", containsAny(normalized, "food", "restaurant", "nha hang", "eat", "coffee", "cafe", "an gi", "brunch"));
        addIf(interests, "sightseeing", containsAny(normalized, "sightseeing", "places", "what to do", "things to do"));
        addIf(interests, "culture", containsAny(normalized, "culture", "old town", "museum", "history"));
        addIf(interests, "relaxing", containsAny(normalized, "relax", "relaxing", "chill", "slow"));
        addIf(interests, "nightlife", containsAny(normalized, "nightlife", "bar", "club"));
        addIf(interests, "family", containsAny(normalized, "family", "kids", "children"));
        return interests;
    }

    private String detectAccommodation(String text) {
        String normalized = normalize(text);
        if (containsAny(normalized, "hotel", "resort", "homestay", "near the beach")) {
            return containsAny(normalized, "near the beach", "beach") ? "near beach" : "hotel";
        }
        return null;
    }

    private String detectTransport(String text) {
        String normalized = normalize(text);
        if (containsAny(normalized, "car", "driver", "rental")) return "car";
        if (containsAny(normalized, "walk", "walking")) return "walking";
        return null;
    }

    private String detectTripStyle(String text) {
        String normalized = normalize(text);
        if (containsAny(normalized, "wife", "romantic", "couple")) return "romantic";
        if (containsAny(normalized, "family", "kids")) return "family-friendly";
        if (containsAny(normalized, "relax", "chill", "slow")) return "relaxing";
        if (containsAny(normalized, "adventure", "active")) return "adventure";
        return null;
    }

    private String detectTravelDates(String text) {
        String normalized = normalize(text);
        if (normalized.contains("next week")) return "next week";
        if (normalized.contains("this weekend") || normalized.contains("weekend")) return "this weekend";
        Matcher matcher = Pattern.compile("(\\d{4}-\\d{2}-\\d{2})").matcher(text);
        if (matcher.find()) return matcher.group(1);
        if (normalized.contains("today")) return LocalDate.now().toString();
        return null;
    }

    private List<String> categoriesForIntent(AssistantIntent intent, TravelContext context) {
        if (intent == AssistantIntent.MARKETPLACE_SEARCH && "hotel".equals(context.accommodationPreference())) return List.of("HOTEL");
        if (context.interests().contains("food") || context.interests().contains("seafood")) return List.of("RESTAURANT", "HOTEL", "TOUR", "EXPERIENCE");
        if (context.accommodationPreference() != null) return List.of("HOTEL", "RESTAURANT", "TOUR", "EXPERIENCE");
        if (intent == AssistantIntent.TRIP_PLANNING || intent == AssistantIntent.ITINERARY_ADJUSTMENT) {
            return List.of("HOTEL", "RESTAURANT", "TOUR", "EXPERIENCE");
        }
        return List.of();
    }

    private Map<Long, ListingResponse> listingsById(List<ListingResponse> listings) {
        return listings.stream()
                .filter(l -> l.getId() != null)
                .collect(Collectors.toMap(ListingResponse::getId, l -> l, (a, b) -> a, LinkedHashMap::new));
    }

    private List<String> readStringArray(JsonNode node) {
        List<String> values = new ArrayList<>();
        if (node != null && node.isArray()) {
            for (JsonNode item : node) {
                if (!item.asText("").isBlank()) {
                    values.add(item.asText());
                }
            }
        }
        return values;
    }

    private List<Long> readLongArray(JsonNode node) {
        List<Long> values = new ArrayList<>();
        if (node != null && node.isArray()) {
            for (JsonNode item : node) {
                if (item.canConvertToLong()) {
                    values.add(item.asLong());
                }
            }
        }
        return values;
    }

    private boolean hasArrayValues(JsonNode node) {
        return node != null && node.isArray() && node.size() > 0;
    }

    private List<Long> mergeListingIds(JsonNode primaryArray, JsonNode secondaryArray, JsonNode singleValue) {
        Set<Long> ids = new LinkedHashSet<>();
        ids.addAll(readLongArray(primaryArray));
        ids.addAll(readLongArray(secondaryArray));
        if (singleValue != null && singleValue.canConvertToLong() && singleValue.asLong() > 0) {
            ids.add(singleValue.asLong());
        }
        return new ArrayList<>(ids);
    }

    private List<String> missingPlanningCategories(List<ListingResponse> listings, int durationDays) {
        Set<String> present = listings == null ? Set.of() : listings.stream()
                .filter(listing -> "ACTIVE".equalsIgnoreCase(listing.getStatus()))
                .map(listing -> firstNonBlank(listing.getCategory(), ""))
                .map(String::toUpperCase)
                .collect(Collectors.toSet());
        List<String> missing = new ArrayList<>();
        if (durationDays > 1 && present.stream().noneMatch(category -> category.contains("HOTEL") || category.contains("STAY") || category.contains("HOMESTAY"))) {
            missing.add("HOTEL");
        }
        if (present.stream().noneMatch(category -> category.contains("RESTAURANT"))) {
            missing.add("RESTAURANT");
        }
        if (present.stream().noneMatch(category -> category.contains("TOUR") || category.contains("EXPERIENCE"))) {
            missing.add("TOUR_OR_EXPERIENCE");
        }
        return missing;
    }

    private String groundedItinerarySummary(
            String destination,
            List<AssistantResponse.ListingRecommendation> recommendations,
            List<String> missingCategories
    ) {
        String safeDestination = firstNonBlank(destination, "your destination");
        if (recommendations == null || recommendations.isEmpty()) {
            return "A database-only outline for " + safeDestination + " with no verified marketplace services attached yet.";
        }
        String missing = missingCategories == null || missingCategories.isEmpty()
                ? ""
                : " Some categories are not currently available: " + String.join(", ", missingCategories) + ".";
        return "A database-grounded plan for " + safeDestination + " using active marketplace services." + missing;
    }

    private List<String> defaultFollowUps(AssistantIntent intent) {
        if (intent == AssistantIntent.MARKETPLACE_SEARCH) {
            return List.of("Find cheaper hotels", "Show beach stays", "Build an itinerary with these");
        }
        if (intent == AssistantIntent.RECOMMENDATION_REQUEST) {
            return List.of("Add these food stops to my trip", "Find seafood spots", "Make a food-focused itinerary");
        }
        return List.of("Make it cheaper", "Add more food stops", "I prefer a hotel near the beach");
    }

    private List<String> generateSuggestedActions(String aiText, AssistantRequest request, TravelContext context) {
        if (context.destination() != null) {
            return List.of("Recommend hotels in " + context.destination(), "Build a 3-day itinerary", "Find food and sightseeing ideas");
        }
        String lowerText = safeText(aiText).toLowerCase(Locale.ROOT);
        if (lowerText.contains("book") || lowerText.contains("available")) {
            return List.of("Show me some alternatives.");
        }
        return List.of("Can you recommend some hotels?", "What are the top things to do there?");
    }

    private AssistantResponse clarificationResponse(IntentResult intentResult, String message) {
        List<String> suggestions = List.of("Da Nang", "Hoi An", "Ha Noi");
        return AssistantResponse.builder()
                .type(AssistantResponse.AssistantResponseType.CLARIFICATION.name())
                .intent(intentResult.intent().name())
                .purpose(intentResult.purpose().name())
                .confidence(intentResult.confidence())
                .contextUsed(false)
                .message(message)
                .reply(message)
                .recommendations(List.of())
                .suggestions(suggestions)
                .suggestedActions(suggestions)
                .extractedContext(withResponseMode(intentResult.context(), "text", intentResult.intent()))
                .mockedAi(false)
                .build();
    }

    private boolean shouldAskForDestination(String message, AssistantIntent intent) {
        String normalized = normalize(message);
        boolean generalDestinationRequest = containsAny(normalized, "noi de di du lich", "place to travel", "somewhere to travel", "di dau");
        return !generalDestinationRequest && (intent == AssistantIntent.MARKETPLACE_SEARCH || intent == AssistantIntent.RECOMMENDATION_REQUEST);
    }

    private Map<String, Object> withResponseMode(TravelContext context, String mode, AssistantIntent intent) {
        Map<String, Object> map = new LinkedHashMap<>(context.toMap());
        map.put("responseMode", mode);
        map.put("lastIntent", intent.name().toLowerCase(Locale.ROOT));
        return map;
    }

    private String budgetText(TravelContext context) {
        if (context.budgetAmount() != null) return formatPrice(context.budgetAmount(), firstNonBlank(context.currency(), "VND"));
        if (context.budgetLevel() != null) return context.budgetLevel() + " budget";
        return null;
    }

    private LocalDate resolveStartDate(TravelContext context) {
        String value = context.travelDates();
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = normalize(value);
        try {
            return LocalDate.parse(value.trim());
        } catch (Exception ignored) {
            // fall through to natural labels
        }
        LocalDate today = LocalDate.now();
        if (normalized.contains("today")) return today;
        if (normalized.contains("next week")) return today.plusWeeks(1);
        if (normalized.contains("weekend")) {
            int daysUntilSaturday = (6 - today.getDayOfWeek().getValue() + 7) % 7;
            return today.plusDays(daysUntilSaturday == 0 ? 7 : daysUntilSaturday);
        }
        if (normalized.contains("next month")) return today.plusMonths(1).withDayOfMonth(1);
        return null;
    }

    private TravelContext withDestination(TravelContext context, String destination) {
        return new TravelContext(
                destination,
                context.previousDestination(),
                context.listingName(),
                context.durationDays(),
                context.travelDates(),
                context.travelerCount(),
                context.budgetLevel(),
                context.budgetAmount(),
                context.budgetPerPerson(),
                context.currency(),
                context.budgetScope(),
                context.interests(),
                context.accommodationPreference(),
                context.transportPreference(),
                context.tripStyle(),
                context.previouslyRecommendedListings(),
                context.previousResponseMode(),
                context.wantsItinerary()
        );
    }

    private boolean isFollowUp(String current) {
        return containsAny(current, "make it", "cheaper", "more food", "add", "replace", "near the beach", "prefer", "instead", "lower budget", "family friendly", "romantic", "re hon", "them mon an", "gan bien", "doi lai");
    }

    private boolean isAssistantIdentityQuestion(String current) {
        return containsAny(current, "ban la ai", "ban ten gi", "who are you", "what are you", "your name");
    }

    private boolean isAssistantCapabilitiesQuestion(String current) {
        return containsAny(current, "ban co the lam gi", "ban lam duoc gi", "ban giup gi", "can you do", "what can you do", "help me with");
    }

    private boolean isDatabaseCapabilityQuestion(String current) {
        return containsAny(current, "database", "co so du lieu", "du lieu database", "doc du lieu", "read database", "access database", "query database")
                && containsAny(current, "ban co the", "can you", "co doc", "doc duoc", "read", "access");
    }

    private boolean isGreetingOnly(String current) {
        String compact = current.replaceAll("[\\p{Punct}\\s]+", " ").trim();
        return compact.matches("^(hi|hello|hey|xin chao|chao|chao ban|chao buoi sang|chao buoi toi|alo|ban oi|good morning|good evening)$");
    }

    private String detectListingName(String text) {
        String value = safeText(text);
        String normalized = normalize(value);
        if (value.length() < 5 || value.length() > 90) {
            return null;
        }
        if (containsAny(normalized,
                "xin chao", "chao", "hello", "ban la ai", "ban co the", "goi y", "tim", "find", "search",
                "recommend", "suggest", "hotel", "khach san", "nha hang o", "restaurant in", "plan", "itinerary",
                "lap ke hoach", "lich trinh", "du lich", "chuyen di", "co gi", "bao nhieu", "duoi", "under", "below", "re hon", "cheaper",
                "budget", "ngan sach", "million", "trieu", "ngay", "day", "days", "dem", "night", "nights", "database", "du lieu", "co so du lieu", "?")) {
            return null;
        }
        String[] words = normalized.split("\\s+");
        if (words.length < 2 || words.length > 7) {
            return null;
        }
        return value;
    }

    private MessagePurpose detectPurpose(String current) {
        if (isGreetingOnly(current)) return MessagePurpose.GREETING;
        if (isFollowUp(current)) return MessagePurpose.FOLLOW_UP;
        if (containsAny(current, "recommend", "suggest", "find", "search", "plan", "build", "goi y", "tim", "lap ke hoach")) return MessagePurpose.COMMAND;
        if (current.contains("?") || containsAny(current, "what", "where", "how", "co", "khong", "gi", "nao")) return MessagePurpose.QUESTION;
        if (containsAny(current, "thanks", "thank you", "cam on")) return MessagePurpose.FEEDBACK;
        return MessagePurpose.UNKNOWN;
    }

    private boolean containsAny(String text, String... needles) {
        if (text == null) return false;
        for (String needle : needles) {
            if (text.contains(needle)) return true;
        }
        return false;
    }

    private void addIf(List<String> values, String value, boolean condition) {
        if (condition && !values.contains(value)) {
            values.add(value);
        }
    }

    private String normalize(String text) {
        String lower = safeText(text).toLowerCase(Locale.ROOT);
        String decomposed = Normalizer.normalize(lower, Normalizer.Form.NFD);
        return decomposed.replaceAll("\\p{M}", "").replace('đ', 'd');
    }

    private String safeText(String value) {
        return value != null ? value.trim() : "";
    }

    private String firstNonBlank(String... values) {
        if (values == null) return null;
        for (String value : values) {
            if (value != null && !value.isBlank()) return value.trim();
        }
        return null;
    }

    @SafeVarargs
    private <T> T firstNonNull(T... values) {
        if (values == null) return null;
        for (T value : values) {
            if (value != null) return value;
        }
        return null;
    }

    private String truncate(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) return value;
        return value.substring(0, maxLength) + "...";
    }

    private String capitalizeWords(String value) {
        String[] words = value.toLowerCase(Locale.ROOT).split("\\s+");
        List<String> capitalized = new ArrayList<>();
        for (String word : words) {
            if (!word.isBlank()) {
                capitalized.add(word.substring(0, 1).toUpperCase(Locale.ROOT) + word.substring(1));
            }
        }
        return String.join(" ", capitalized);
    }

    private String asString(Object value) {
        return value instanceof String s && !s.isBlank() ? s : null;
    }

    private Integer asInteger(Object value) {
        if (value instanceof Number number) return number.intValue();
        if (value instanceof String s && !s.isBlank()) {
            try {
                return Integer.parseInt(s);
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private BigDecimal asBigDecimal(Object value) {
        if (value instanceof BigDecimal bd) return bd;
        if (value instanceof Number number) return BigDecimal.valueOf(number.doubleValue());
        if (value instanceof String s && !s.isBlank()) {
            try {
                return new BigDecimal(s);
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private List<String> asStringList(Object value) {
        if (value instanceof List<?> list) {
            return list.stream().filter(String.class::isInstance).map(String.class::cast).toList();
        }
        return List.of();
    }

    private List<Long> asLongList(Object value) {
        if (value instanceof List<?> list) {
            return list.stream()
                    .map(item -> item instanceof Number n ? n.longValue() : null)
                    .filter(v -> v != null)
                    .toList();
        }
        return List.of();
    }

    private record RecommendationPayload(
            String message,
            String destination,
            String summary,
            List<AssistantResponse.ListingRecommendation> recommendations,
            List<String> followUpSuggestions
    ) {}
}
