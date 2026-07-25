package com.travel.marketplace.modules.ai.planner.service;

import com.travel.marketplace.exception.BusinessException;
import com.travel.marketplace.exception.ErrorCode;
import com.travel.marketplace.modules.ai.config.TripPlannerProperties;
import com.travel.marketplace.modules.ai.planner.dto.ItineraryDay;
import com.travel.marketplace.modules.ai.planner.dto.TripPlanRequest;
import com.travel.marketplace.modules.ai.planner.dto.TripPlanResponse;
import com.travel.marketplace.modules.ai.prompt.PromptTemplateRegistry;
import com.travel.marketplace.modules.ai.provider.AiProvider;
import com.travel.marketplace.modules.ai.provider.AiRequest;
import com.travel.marketplace.modules.ai.provider.AiResponse;
import com.travel.marketplace.modules.ai.shared.DestinationNormalizer;
import com.travel.marketplace.modules.listing.dto.ListingResponse;
import com.travel.marketplace.modules.listing.dto.ListingSearchRequest;
import com.travel.marketplace.modules.listing.service.ListingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class TripPlannerServiceImpl implements TripPlannerService {

    private final AiProvider aiProvider;
    private final ListingService listingService;
    private final PromptTemplateRegistry promptRegistry;
    private final AiJsonResponseParser jsonResponseParser;
    private final TripPlannerProperties tripPlannerProperties;
    private final Environment environment;

    private static final Pattern HH_MM = Pattern.compile("^([01]\\d|2[0-3]):[0-5]\\d$");
    private static final Set<String> ALLOWED_ACTIVITY_TYPES = Set.of(
            "HOTEL", "RESTAURANT", "TOUR", "EXPERIENCE", "FREE_TIME", "TRANSPORT"
    );

    @Override
    public TripPlanResponse planTrip(TripPlanRequest request) {
        // 1. Fetch relevant listings to ground the AI in reality
        List<ListingResponse> candidates = fetchMarketplaceListings(request);
        String listingContext = buildListingContext(candidates);
        String normalizedDestination = DestinationNormalizer.canonicalize(request.getDestination());

        // 2. Build the prompt
        Map<String, Object> vars = new HashMap<>();
        vars.put("naturalLanguageQuery", request.getNaturalLanguageQuery() != null ? request.getNaturalLanguageQuery() : "Plan a trip");
        vars.put("destination", normalizedDestination);
        vars.put("durationDays", request.getDurationDays() != null ? request.getDurationDays().toString() : "3");
        vars.put("budget", request.getTotalBudget() != null ? request.getTotalBudget().toPlainString() : "Flexible");
        vars.put("groupSize", request.getGroupSize() != null ? request.getGroupSize().toString() : "2");
        vars.put("listingContext", listingContext);
        vars.put("maxActivitiesPerDay", tripPlannerProperties.getMaxActivitiesPerDay());
        vars.put("maxDescriptionWords", tripPlannerProperties.getMaxDescriptionWords());

        String prompt = promptRegistry.render("trip_plan", vars);
        String systemContext = buildStructuredSystemContext();
        int maxOutputTokens = tripPlannerProperties.calculateMaxOutputTokens(request.getDurationDays());
        String requestId = UUID.randomUUID().toString();

        String primaryModel = tripPlannerProperties.getStructuredModel();
        AiResponse aiResponse = generateStructuredItinerary(prompt, systemContext, maxOutputTokens, 0, primaryModel);
        logTripAiDiagnostics(requestId, aiResponse, maxOutputTokens, 0);

        try {
            assertNotTruncated(aiResponse);
            return parseAiResponse(aiResponse, request, candidates);
        } catch (AiOutputTruncatedException ex) {
            return retryAfterTruncation(request, candidates, prompt, systemContext, requestId, ex);
        } catch (BusinessException ex) {
            if (ex.getErrorCode() != ErrorCode.AI_INVALID_STRUCTURED_RESPONSE) {
                throw ex;
            }
            log.warn(
                    "Trip planner JSON parse/validation failed provider={} model={} responseLength={} retryAttempt=1 reason={}",
                    aiProvider.providerName(),
                    aiResponse.getModel(),
                    aiResponse.getText() != null ? aiResponse.getText().length() : 0,
                    sanitizeLogValue(ex.getMessage())
            );
            AiResponse repaired = generateStructuredItinerary(
                    buildRepairPrompt(prompt, aiResponse.getText(), ex.getMessage()),
                    systemContext,
                    maxOutputTokens,
                    1,
                    primaryModel
            );
            logTripAiDiagnostics(requestId, repaired, maxOutputTokens, 1);
            assertNotTruncated(repaired);
            return parseAiResponse(repaired, request, candidates);
        }
    }

    private TripPlanResponse retryAfterTruncation(
            TripPlanRequest request,
            List<ListingResponse> candidates,
            String prompt,
            String systemContext,
            String requestId,
            AiOutputTruncatedException cause
    ) {
        if (!tripPlannerProperties.isTruncationRetryEnabled()) {
            throw cause;
        }
        int retryMaxOutputTokens = tripPlannerProperties.calculateRetryMaxOutputTokens(request.getDurationDays());
        String fallbackModel = tripPlannerProperties.getFallbackStructuredModel();
        log.warn(
                "Trip planner AI output truncated provider={} finishReason={} maxOutputTokens={} retryMaxOutputTokens={} fallbackModel={} requestId={}",
                aiProvider.providerName(),
                cause.getDiagnosticReason(),
                tripPlannerProperties.calculateMaxOutputTokens(request.getDurationDays()),
                retryMaxOutputTokens,
                fallbackModel,
                requestId
        );
        AiResponse retryResponse = generateStructuredItinerary(
                buildTruncationRetryPrompt(prompt),
                systemContext,
                retryMaxOutputTokens,
                1,
                fallbackModel
        );
        logTripAiDiagnostics(requestId, retryResponse, retryMaxOutputTokens, 1);
        assertNotTruncated(retryResponse);
        return parseAiResponse(retryResponse, request, candidates);
    }

    private AiResponse generateStructuredItinerary(
            String prompt,
            String systemContext,
            int maxTokens,
            int attempt,
            String model
    ) {
        return aiProvider.complete(AiRequest.builder()
                .prompt(prompt)
                .systemContext(systemContext)
                .modelOverride(model)
                .maxTokens(maxTokens)
                .temperature(attempt == 0 ? 0.35 : 0.2)
                .jsonResponse(true)
                .jsonSchemaName("trip_plan")
                .jsonSchema(tripPlannerProperties.isStructuredJsonSchemaEnabled() ? buildTripPlanJsonSchema() : null)
                .reasoningEffort(tripPlannerProperties.getReasoningEffort())
                .excludeReasoning(tripPlannerProperties.isExcludeReasoning())
                .build());
    }

    private void assertNotTruncated(AiResponse aiResponse) {
        String finishReason = aiResponse != null ? aiResponse.getFinishReason() : null;
        if (isTruncatedFinishReason(finishReason)) {
            throw new AiOutputTruncatedException("Provider finish reason indicated truncation: " + finishReason);
        }
        String text = aiResponse != null ? aiResponse.getText() : null;
        if (text != null && !text.isBlank() && looksTruncated(text)) {
            throw new AiOutputTruncatedException("AI response contained truncated JSON.");
        }
        if (containsReasoningBeforeJson(text)) {
            throw new AiOutputTruncatedException("AI response contained reasoning before JSON.");
        }
    }

    private boolean containsReasoningBeforeJson(String content) {
        if (content == null || content.isBlank()) {
            return false;
        }
        String trimmed = content.stripLeading();
        if (trimmed.isEmpty() || trimmed.charAt(0) == '{' || trimmed.startsWith("```")) {
            return false;
        }
        String prefix = trimmed.substring(0, Math.min(160, trimmed.length())).toLowerCase(Locale.ROOT);
        return prefix.startsWith("we need")
                || prefix.startsWith("i need")
                || prefix.startsWith("let's")
                || prefix.startsWith("we have")
                || prefix.startsWith("need to")
                || prefix.contains("output a json object")
                || prefix.contains("return a json object");
    }

    private boolean isTruncatedFinishReason(String finishReason) {
        if (finishReason == null) {
            return false;
        }
        String normalized = finishReason.trim().toLowerCase(Locale.ROOT);
        return normalized.equals("length")
                || normalized.equals("max_tokens")
                || normalized.equals("max_output_tokens")
                || normalized.equals("max_tokens_reached")
                || normalized.equals("max_tokens_exceeded")
                || normalized.equals("max_output")
                || normalized.equals("max_tokens_stop")
                || normalized.equals("max_tokens_limit")
                || normalized.equals("token_limit")
                || normalized.equals("max_tokens");
    }

    private boolean looksTruncated(String content) {
        String json = content.trim();
        if (json.endsWith(",") || json.endsWith(":") || json.endsWith("{") || json.endsWith("[")) {
            return true;
        }

        int start = json.indexOf('{');
        if (start < 0) {
            return false;
        }
        boolean inString = false;
        boolean escaping = false;
        int depth = 0;
        for (int i = start; i < json.length(); i++) {
            char ch = json.charAt(i);
            if (escaping) {
                escaping = false;
                continue;
            }
            if (ch == '\\' && inString) {
                escaping = true;
                continue;
            }
            if (ch == '"') {
                inString = !inString;
                continue;
            }
            if (inString) {
                continue;
            }
            if (ch == '{') {
                depth++;
            } else if (ch == '}') {
                depth--;
                if (depth == 0) {
                    return false;
                }
            }
        }
        return depth > 0 || inString;
    }

    private void logTripAiDiagnostics(String requestId, AiResponse response, int maxOutputTokens, int attempt) {
        String content = response != null ? response.getText() : "";
        int responseLength = content != null ? content.length() : 0;
        int completionTokens = response != null && response.getUsage() != null
                ? response.getUsage().getCompletionTokens()
                : 0;
        int promptTokens = response != null && response.getUsage() != null
                ? response.getUsage().getPromptTokens()
                : 0;
        int reasoningLength = response != null && response.getReasoning() != null
                ? response.getReasoning().length()
                : 0;
        String firstChar = firstNonWhitespaceCharacter(content);
        boolean balancedJson = content != null && !looksTruncated(content);
        log.info(
                "Trip planner AI response provider={} model={} finishReason={} maxOutputTokens={} promptTokens={} outputTokens={} responseLength={} reasoningLength={} firstChar={} balancedJson={} attempt={} requestId={}",
                aiProvider.providerName(),
                response != null ? response.getModel() : "unknown",
                response != null ? response.getFinishReason() : "unknown",
                maxOutputTokens,
                promptTokens,
                completionTokens,
                responseLength,
                reasoningLength,
                firstChar,
                balancedJson,
                attempt,
                requestId
        );
        if (environment != null && environment.acceptsProfiles(Profiles.of("local", "dev"))) {
            log.debug(
                    "Trip AI response diagnostic requestId={} length={} finishReason={} reasoningLength={} firstChar={} prefix={} suffix={}",
                    requestId,
                    responseLength,
                    response != null ? response.getFinishReason() : "unknown",
                    reasoningLength,
                    firstChar,
                    sanitizeDiagnosticSnippet(prefix(content, 500)),
                    sanitizeDiagnosticSnippet(suffix(content, 500))
            );
        }
    }

    private String firstNonWhitespaceCharacter(String value) {
        if (value == null) {
            return "none";
        }
        for (int i = 0; i < value.length(); i++) {
            if (!Character.isWhitespace(value.charAt(i))) {
                return Character.toString(value.charAt(i));
            }
        }
        return "none";
    }

    private Map<String, Object> buildTripPlanJsonSchema() {
        Map<String, Object> activity = objectSchema(false);
        activity.put("properties", mapOf(
                "time", mapOf("type", "string", "pattern", "^([01]\\\\d|2[0-3]):[0-5]\\\\d$"),
                "listingId", mapOf("type", List.of("integer", "null")),
                "listingName", mapOf("type", "string", "minLength", 1),
                "type", mapOf("type", "string", "enum", ALLOWED_ACTIVITY_TYPES.stream().sorted().toList()),
                "description", mapOf("type", "string", "minLength", 1, "maxLength", tripPlannerProperties.getMaxDescriptionWords() * 9),
                "estimatedCost", mapOf("type", "number", "minimum", 0)
        ));
        activity.put("required", List.of("time", "listingId", "listingName", "type", "description", "estimatedCost"));

        Map<String, Object> day = objectSchema(false);
        day.put("properties", mapOf(
                "dayNumber", mapOf("type", "integer", "minimum", 1),
                "theme", mapOf("type", "string", "minLength", 1, "maxLength", 72),
                "activities", mapOf(
                        "type", "array",
                        "maxItems", tripPlannerProperties.getMaxActivitiesPerDay(),
                        "items", activity
                )
        ));
        day.put("required", List.of("dayNumber", "theme", "activities"));

        Map<String, Object> root = objectSchema(false);
        root.put("properties", mapOf(
                "days", mapOf("type", "array", "minItems", 1, "items", day),
                "totalEstimatedBudget", mapOf("type", "number", "minimum", 0),
                "aiSummary", mapOf("type", "string", "minLength", 1, "maxLength", 480),
                "highlights", mapOf(
                        "type", "array",
                        "maxItems", 5,
                        "items", mapOf("type", "string", "minLength", 1, "maxLength", 90)
                )
        ));
        root.put("required", List.of("days", "totalEstimatedBudget", "aiSummary", "highlights"));
        return root;
    }

    private Map<String, Object> objectSchema(boolean additionalProperties) {
        return new LinkedHashMap<>(mapOf(
                "type", "object",
                "additionalProperties", additionalProperties
        ));
    }

    private Map<String, Object> mapOf(Object... keyValues) {
        Map<String, Object> map = new LinkedHashMap<>();
        for (int i = 0; i < keyValues.length; i += 2) {
            map.put((String) keyValues[i], keyValues[i + 1]);
        }
        return map;
    }

    private List<ListingResponse> fetchMarketplaceListings(TripPlanRequest request) {
        if (listingService == null) {
            return List.of();
        }
        String rawDestination = request.getDestination();
        String normalizedDestination = DestinationNormalizer.canonicalize(rawDestination);
        ListingSearchRequest searchRequest = new ListingSearchRequest();
        searchRequest.setCity(normalizedDestination);
        searchRequest.setStatus("ACTIVE");
        
        try {
            Page<ListingResponse> page = listingService.searchListings(searchRequest, PageRequest.of(0, Math.max(1, tripPlannerProperties.getMaxListingContextItems())));
            List<ListingResponse> ranked = rankListingsForPlan(new ArrayList<>(page.getContent()), request);
            log.info(
                    "Trip planner marketplace retrieval rawDestination={} normalizedDestination={} queriedCity={} requestedCategories={} budget={} activeStatusFilter=ACTIVE availabilityFilter=none candidateCountBeforeRanking={} candidateCountAfterRanking={} candidateIds={}",
                    sanitizeLogValue(rawDestination),
                    sanitizeLogValue(normalizedDestination),
                    sanitizeLogValue(searchRequest.getCity()),
                    request.getFocusCategories(),
                    request.getTotalBudget(),
                    page.getContent().size(),
                    ranked.size(),
                    ranked.stream().map(ListingResponse::getId).toList()
            );
            return ranked;
        } catch (Exception e) {
            log.warn("Failed to fetch listings for trip planner", e);
            return List.of();
        }
    }

    private List<ListingResponse> rankListingsForPlan(List<ListingResponse> listings, TripPlanRequest request) {
        return listings.stream()
                .sorted(Comparator
                        .comparingInt((ListingResponse listing) -> categoryFitScore(listing, request)).reversed()
                        .thenComparing(listing -> listing.getAverageRating() != null ? listing.getAverageRating() : BigDecimal.ZERO, Comparator.reverseOrder())
                        .thenComparing(listing -> listing.getReviewCount() != null ? listing.getReviewCount() : 0, Comparator.reverseOrder()))
                .limit(tripPlannerProperties.getMaxListingContextItems())
                .toList();
    }

    private int categoryFitScore(ListingResponse listing, TripPlanRequest request) {
        if (listing == null || listing.getCategory() == null || request.getFocusCategories() == null) {
            return 0;
        }
        String category = listing.getCategory().toLowerCase(Locale.ROOT);
        int score = 0;
        for (String focus : request.getFocusCategories()) {
            String normalized = focus == null ? "" : focus.toLowerCase(Locale.ROOT);
            if (normalized.contains("food") && "restaurant".equals(category)) score += 30;
            if (normalized.contains("beach") && ("tour".equals(category) || "experience".equals(category) || "hotel".equals(category))) score += 20;
            if (normalized.contains("history") && ("tour".equals(category) || "experience".equals(category))) score += 20;
            if (normalized.contains("nature") && ("tour".equals(category) || "experience".equals(category))) score += 20;
            if (normalized.contains(category)) score += 25;
        }
        return score;
    }

    private String buildListingContext(List<ListingResponse> listings) {
        if (listings.isEmpty()) {
            return "No active marketplace listings are available for this destination. Use generic activities only with listingId null.";
        }
        
        StringBuilder sb = new StringBuilder();
        sb.append("{\n");
        for (ListingResponse l : listings.stream().limit(tripPlannerProperties.getMaxListingContextItems()).toList()) {
            sb.append("  - listingId: ").append(l.getId())
              .append(", name: ").append(l.getTitle())
              .append(", category: ").append(l.getCategory())
              .append(", price: ").append(l.getBasePrice()).append(" ").append(l.getCurrency())
              .append(", rating: ").append(l.getAverageRating() != null ? l.getAverageRating() : "none")
              .append(", tags: ").append(l.getDetails() != null ? l.getDetails().keySet() : List.of())
              .append(", latitude: ").append(l.getLatitude())
              .append(", longitude: ").append(l.getLongitude())
              .append(", duration: ").append(durationText(l))
              .append(", imageUrl: ").append(firstImageUrl(l))
              .append("\n");
        }
        sb.append("}\n");
        return sb.toString();
    }

    TripPlanResponse parseAiResponse(AiResponse aiResponse, TripPlanRequest request, List<ListingResponse> candidates) {
        RawTripPlan raw = jsonResponseParser.parseObject(aiResponse.getText(), RawTripPlan.class);
        TripPlanResponse response = normalizeAndValidate(raw, request, aiResponse, candidates);
        log.info(
                "Trip planner structured response accepted provider={} model={} days={} activities={} responseLength={}",
                aiProvider.providerName(),
                aiResponse.getModel(),
                response.getItinerary().size(),
                response.getItinerary().stream().mapToInt(day -> day.getActivities().size()).sum(),
                aiResponse.getText() != null ? aiResponse.getText().length() : 0
        );
        return response;
    }

    private TripPlanResponse normalizeAndValidate(RawTripPlan raw, TripPlanRequest request, AiResponse aiResponse, List<ListingResponse> candidates) {
        if (raw == null || raw.days() == null || raw.days().isEmpty()) {
            throw invalidStructured("Itinerary days are required.");
        }
        int requestedDays = request.getDurationDays() != null && request.getDurationDays() > 0
                ? request.getDurationDays()
                : raw.days().size();
        if (raw.days().size() != requestedDays) {
            throw invalidStructured("Itinerary day count did not match the requested duration.");
        }

        Set<Integer> seenDays = new HashSet<>();
        List<ItineraryDay> itinerary = new ArrayList<>();
        BigDecimal calculatedTotal = BigDecimal.ZERO;
        String destinationKey = DestinationNormalizer.key(request.getDestination());
        Map<Long, ListingResponse> candidatesById = candidates == null
                ? Map.of()
                : candidates.stream()
                .filter(listing -> listing.getId() != null)
                .collect(java.util.stream.Collectors.toMap(ListingResponse::getId, listing -> listing, (first, ignored) -> first));
        Set<Long> selectedIds = new LinkedHashSet<>();
        for (RawDay rawDay : raw.days()) {
            if (rawDay == null || rawDay.dayNumber() == null || rawDay.dayNumber() < 1) {
                throw invalidStructured("Every day must have a positive dayNumber.");
            }
            if (!seenDays.add(rawDay.dayNumber())) {
                throw invalidStructured("Duplicate dayNumber in itinerary.");
            }
            if (isBlank(rawDay.theme())) {
                throw invalidStructured("Every day must have a theme.");
            }
            if (wordCount(rawDay.theme()) > 8) {
                throw invalidStructured("Day theme is too long.");
            }
            if (rawDay.activities() == null) {
                throw invalidStructured("Every day must include an activities array.");
            }
            if (rawDay.activities().size() > tripPlannerProperties.getMaxActivitiesPerDay()) {
                throw invalidStructured("Too many activities in one itinerary day.");
            }

            List<ItineraryDay.Activity> activities = new ArrayList<>();
            Set<String> dayTimes = new HashSet<>();
            BigDecimal dayCost = BigDecimal.ZERO;
            Map<String, Integer> categoryCounts = new HashMap<>();
            List<String> dayHighlights = new ArrayList<>();
            String coverImage = null;
            for (RawActivity rawActivity : rawDay.activities()) {
                if (rawActivity == null) {
                    throw invalidStructured("Activity cannot be null.");
                }
                String time = requireTime(rawActivity.time());
                if (!dayTimes.add(time)) {
                    throw invalidStructured("Activities cannot reuse the same time within one day.");
                }
                if (isBlank(rawActivity.listingName())) {
                    throw invalidStructured("Activity listingName is required.");
                }
                if (isBlank(rawActivity.description())) {
                    throw invalidStructured("Activity description is required.");
                }
                if (wordCount(rawActivity.description()) > tripPlannerProperties.getMaxDescriptionWords()) {
                    throw invalidStructured("Activity description is too long.");
                }
                String type = isBlank(rawActivity.type()) ? "FREE_TIME" : rawActivity.type().trim().toUpperCase(Locale.ROOT);
                if (!ALLOWED_ACTIVITY_TYPES.contains(type)) {
                    throw invalidStructured("Activity type is not supported.");
                }
                ListingResponse trustedListing = null;
                if (rawActivity.listingId() != null) {
                    trustedListing = candidatesById.get(rawActivity.listingId());
                    if (trustedListing == null) {
                        throw invalidStructured("AI selected an unknown or inactive marketplace listing.");
                    }
                    if (!destinationKey.isBlank() && !DestinationNormalizer.key(trustedListing.getCity()).equals(destinationKey)) {
                        throw invalidStructured("AI selected a listing outside the requested destination.");
                    }
                    selectedIds.add(trustedListing.getId());
                    type = mapListingCategoryToActivityType(trustedListing.getCategory(), type);
                }
                BigDecimal cost = trustedListing != null && trustedListing.getBasePrice() != null
                        ? trustedListing.getBasePrice()
                        : rawActivity.estimatedCost() != null ? rawActivity.estimatedCost() : BigDecimal.ZERO;
                if (cost.signum() < 0) {
                    throw invalidStructured("Activity estimatedCost cannot be negative.");
                }
                calculatedTotal = calculatedTotal.add(cost);
                dayCost = dayCost.add(cost);
                categoryCounts.merge(type, 1, Integer::sum);
                if (dayHighlights.size() < 3) {
                    dayHighlights.add(trustedListing != null ? trustedListing.getTitle() : rawActivity.listingName().trim());
                }
                if (coverImage == null && trustedListing != null) {
                    coverImage = firstImageUrl(trustedListing);
                }

                activities.add(ItineraryDay.Activity.builder()
                        .time(time)
                        .listingId(trustedListing != null ? trustedListing.getId() : rawActivity.listingId())
                        .listingName(trustedListing != null ? trustedListing.getTitle() : rawActivity.listingName().trim())
                        .type(type)
                        .description(rawActivity.description().trim())
                        .estimatedCost(cost)
                        .imageUrl(trustedListing != null ? firstImageUrl(trustedListing) : null)
                        .rating(trustedListing != null ? trustedListing.getAverageRating() : null)
                        .reviewCount(trustedListing != null ? trustedListing.getReviewCount() : null)
                        .latitude(trustedListing != null ? trustedListing.getLatitude() : null)
                        .longitude(trustedListing != null ? trustedListing.getLongitude() : null)
                        .providerName(trustedListing != null ? trustedListing.getProviderName() : null)
                        .slug(trustedListing != null ? trustedListing.getSlug() : null)
                        .city(trustedListing != null ? trustedListing.getCity() : null)
                        .address(trustedListing != null ? trustedListing.getAddress() : null)
                        .build());
            }

            itinerary.add(ItineraryDay.builder()
                    .dayNumber(rawDay.dayNumber())
                    .theme(rawDay.theme().trim())
                    .summary(activities.isEmpty() ? rawDay.theme().trim() : activities.getFirst().getDescription())
                    .activityCount(activities.size())
                    .estimatedDayCost(dayCost)
                    .primaryCategory(primaryCategory(categoryCounts))
                    .coverImageUrl(coverImage)
                    .highlights(dayHighlights)
                    .activities(activities)
                    .build());
        }

        itinerary.sort(Comparator.comparingInt(ItineraryDay::getDayNumber));
        for (int i = 0; i < itinerary.size(); i++) {
            if (itinerary.get(i).getDayNumber() != i + 1) {
                throw invalidStructured("Itinerary day numbers must start at 1 and be sequential.");
            }
        }
        if (isBlank(raw.aiSummary())) {
            throw invalidStructured("aiSummary is required.");
        }
        if (wordCount(raw.aiSummary()) > 60) {
            throw invalidStructured("aiSummary is too long.");
        }
        if (raw.totalEstimatedBudget() != null && raw.totalEstimatedBudget().signum() < 0) {
            throw invalidStructured("totalEstimatedBudget cannot be negative.");
        }

        List<String> highlights = raw.highlights() != null
                ? raw.highlights().stream().filter(value -> !isBlank(value)).map(String::trim).limit(5).toList()
                : List.of();
        if (highlights.isEmpty()) {
            highlights = List.of(
                    "Discover the best of " + request.getDestination(),
                    "Handpicked activities based on your preferences"
            );
        }

        return TripPlanResponse.builder()
                .destination(DestinationNormalizer.canonicalize(request.getDestination()))
                .durationDays(requestedDays)
                .itinerary(itinerary)
                .totalEstimatedBudget(calculatedTotal)
                .aiSummary(raw.aiSummary().trim())
                .highlights(highlights)
                .mockedAi(aiResponse.isMocked())
                .providerName(aiProvider.providerName())
                .marketplaceRecommendations(buildMarketplaceRecommendations(candidates, selectedIds))
                .build();
    }

    private List<ListingResponse> buildMarketplaceRecommendations(List<ListingResponse> candidates, Set<Long> selectedIds) {
        if (candidates == null || candidates.isEmpty()) {
            return List.of();
        }
        return candidates.stream()
                .filter(listing -> listing.getId() != null && !selectedIds.contains(listing.getId()))
                .limit(8)
                .toList();
    }

    private String primaryCategory(Map<String, Integer> categoryCounts) {
        return categoryCounts.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("FREE_TIME");
    }

    private String mapListingCategoryToActivityType(String listingCategory, String fallbackType) {
        if (listingCategory == null) {
            return fallbackType;
        }
        return switch (listingCategory.toUpperCase(Locale.ROOT)) {
            case "VEHICLE" -> "TRANSPORT";
            case "HOTEL", "RESTAURANT", "TOUR", "EXPERIENCE" -> listingCategory.toUpperCase(Locale.ROOT);
            default -> fallbackType;
        };
    }

    private String firstImageUrl(ListingResponse listing) {
        if (listing == null) {
            return null;
        }
        if (!isBlank(listing.getCoverImageUrl())) {
            return listing.getCoverImageUrl();
        }
        if (listing.getImages() == null || listing.getImages().isEmpty()) {
            return null;
        }
        return listing.getImages().stream()
                .filter(image -> Boolean.TRUE.equals(image.getIsPrimary()) && !isBlank(image.getImageUrl()))
                .findFirst()
                .or(() -> listing.getImages().stream().filter(image -> !isBlank(image.getImageUrl())).findFirst())
                .map(ListingResponse.ListingImageResponse::getImageUrl)
                .orElse(null);
    }

    private String durationText(ListingResponse listing) {
        if (listing == null || listing.getDetails() == null) {
            return "flexible";
        }
        Object hours = listing.getDetails().get("durationHours");
        Object days = listing.getDetails().get("durationDays");
        if (hours != null) return hours + " hours";
        if (days != null) return days + " days";
        return "flexible";
    }

    private String requireTime(String time) {
        if (isBlank(time)) {
            throw invalidStructured("Activity time is required.");
        }
        String normalized = time.trim();
        if (!HH_MM.matcher(normalized).matches()) {
            throw invalidStructured("Activity time must use HH:mm format.");
        }
        return normalized;
    }

    private int wordCount(String value) {
        if (value == null || value.isBlank()) {
            return 0;
        }
        return value.trim().split("\\s+").length;
    }

    private String buildStructuredSystemContext() {
        return """
                Return the JSON object immediately. Do not reason aloud. Do not describe the task. The first character of your response must be {.
                Return exactly one valid JSON object.
                The response must begin with { and end with }.
                Do not include Markdown code fences, explanations, analysis, reasoning, comments, placeholders, ellipses, trailing commas, text before JSON, or text after JSON.
                Never output bracketed placeholder arrays, placeholder objects, ellipsis tokens, "same as above", schema examples, or placeholder strings.
                Every array must contain actual JSON objects or be an empty array.
                Use the field name time only. Do not output startTime or endTime.
                Use only these activity type values: HOTEL, RESTAURANT, TOUR, EXPERIENCE, FREE_TIME, TRANSPORT.
                Use HH:mm for activity time.
                Use numbers for estimatedCost and totalEstimatedBudget.
                Use at most %d activities per day.
                Keep each description to %d words or fewer.
                Keep each theme to 8 words or fewer.
                Keep aiSummary to 60 words or fewer.
                Return at most 5 short highlights.
                Prefer concise values so the complete JSON fits within the output limit.
                Never stop before closing all arrays and objects.
                """.formatted(
                tripPlannerProperties.getMaxActivitiesPerDay(),
                tripPlannerProperties.getMaxDescriptionWords()
        );
    }

    private String buildTruncationRetryPrompt(String originalPrompt) {
        return """
                The previous itinerary response was incomplete because it stopped before the JSON object was closed.
                Regenerate the complete itinerary from scratch.
                Return exactly one complete JSON object only.
                Keep it concise so it fits:
                - at most %d activities per day
                - descriptions at most %d words
                - theme at most 8 words
                - aiSummary at most 60 words
                - at most 5 highlights
                Never stop before closing every array and object.

                Original trip request and schema:
                %s
                """.formatted(
                tripPlannerProperties.getMaxActivitiesPerDay(),
                tripPlannerProperties.getMaxDescriptionWords(),
                originalPrompt
        );
    }

    private String buildRepairPrompt(String originalPrompt, String invalidResponse, String validationError) {
        return """
                Your previous response was not valid itinerary JSON.
                Return only one corrected JSON object matching the required schema.
                Do not include explanation, Markdown, comments, placeholders, ellipses, or reasoning.

                Validation error:
                %s

                Original trip request and schema:
                %s

                Invalid response excerpt:
                %s
                """.formatted(
                sanitizeLogValue(validationError),
                originalPrompt,
                sanitizeInvalidResponseExcerpt(invalidResponse)
        );
    }

    private String sanitizeInvalidResponseExcerpt(String value) {
        return abbreviate(value, 1800)
                .replace("[...]", "[invalid placeholder array]")
                .replace("{...}", "{invalid placeholder object}")
                .replace("...", "[invalid ellipsis token]");
    }

    private String prefix(String value, int maxLength) {
        if (value == null || value.isBlank()) {
            return "";
        }
        return value.substring(0, Math.min(maxLength, value.length()));
    }

    private String suffix(String value, int maxLength) {
        if (value == null || value.isBlank()) {
            return "";
        }
        return value.substring(Math.max(0, value.length() - maxLength));
    }

    private String sanitizeDiagnosticSnippet(String value) {
        return abbreviate(value, 500);
    }

    private String abbreviate(String value, int maxLength) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String sanitized = value.replaceAll("[\\r\\n\\t]", " ").trim();
        return sanitized.length() > maxLength ? sanitized.substring(0, maxLength) : sanitized;
    }

    private String sanitizeLogValue(String value) {
        return abbreviate(value, 240);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private BusinessException invalidStructured(String message) {
        return new BusinessException(
                ErrorCode.AI_INVALID_STRUCTURED_RESPONSE,
                message,
                HttpStatus.BAD_GATEWAY
        );
    }

    public record RawTripPlan(List<RawDay> days, BigDecimal totalEstimatedBudget, String aiSummary, List<String> highlights) {}
    public record RawDay(Integer dayNumber, String theme, List<RawActivity> activities) {}
    public record RawActivity(
            String time,
            Long listingId,
            String listingName,
            String type,
            String description,
            BigDecimal estimatedCost
    ) {}
}
