package com.travel.marketplace.modules.ai.recommendation.service;

import com.travel.marketplace.modules.ai.prompt.PromptTemplateRegistry;
import com.travel.marketplace.modules.ai.provider.AiProvider;
import com.travel.marketplace.modules.ai.provider.AiRequest;
import com.travel.marketplace.modules.ai.provider.AiResponse;
import com.travel.marketplace.modules.ai.recommendation.dto.RecommendationRequest;
import com.travel.marketplace.modules.ai.recommendation.dto.RecommendationResponse;
import com.travel.marketplace.modules.listing.dto.ListingResponse;
import com.travel.marketplace.modules.listing.dto.ListingSearchRequest;
import com.travel.marketplace.modules.listing.service.ListingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecommendationServiceImpl implements RecommendationService {

    private final AiProvider aiProvider;
    private final ListingService listingService;
    private final PromptTemplateRegistry promptRegistry;

    @Override
    public RecommendationResponse getRecommendations(RecommendationRequest request) {
        // 1. Fetch candidate listings from the marketplace
        List<ListingResponse> candidates = fetchCandidates(request);

        if (candidates.isEmpty()) {
            return RecommendationResponse.builder()
                    .recommendations(List.of())
                    .aiSummary("No listings found matching your criteria for " + request.getDestination())
                    .destination(request.getDestination())
                    .build();
        }

        // 2. Apply weighted scoring (no AI needed for this step)
        List<ScoredListing> scoredListings = scoreListings(candidates, request);

        // 3. Take top 8 to send to AI for reasoning annotation
        List<ScoredListing> topCandidates = scoredListings.stream()
                .sorted(Comparator.comparingInt(ScoredListing::score).reversed())
                .limit(8)
                .collect(Collectors.toList());

        // 4. Build prompt with marketplace context
        String listingContext = buildListingContext(topCandidates);
        Map<String, Object> vars = new HashMap<>();
        vars.put("destination", request.getDestination());
        vars.put("budget", request.getBudgetPerPerson() != null ? request.getBudgetPerPerson().toPlainString() : "flexible");
        vars.put("startDate", request.getStartDate() != null ? request.getStartDate().toString() : "flexible");
        vars.put("endDate", request.getEndDate() != null ? request.getEndDate().toString() : "flexible");
        vars.put("groupSize", request.getGroupSize() != null ? request.getGroupSize().toString() : "1");
        vars.put("interests", request.getInterests() != null ? String.join(", ", request.getInterests()) : "general travel");
        vars.put("listingContext", listingContext);

        String prompt = promptRegistry.render("recommendation", vars);
        AiResponse aiResponse = aiProvider.complete(AiRequest.builder()
                .prompt(prompt)
                .maxTokens(1024)
                .temperature(0.5)
                .build());

        // 5. Build ranked recommendations
        List<RecommendationResponse.RankedRecommendation> ranked = buildRankedResults(topCandidates, aiResponse.getText());

        return RecommendationResponse.builder()
                .recommendations(ranked)
                .aiSummary("Showing top " + ranked.size() + " recommendations for " + request.getDestination() + " powered by " + aiProvider.providerName())
                .destination(request.getDestination())
                .mockedAi(aiResponse.isMocked())
                .build();
    }

    private List<ListingResponse> fetchCandidates(RecommendationRequest request) {
        ListingSearchRequest searchRequest = new ListingSearchRequest();
        searchRequest.setCity(request.getDestination());
        searchRequest.setStatus("ACTIVE");
        if (request.getBudgetPerPerson() != null) {
            searchRequest.setMaxPrice(request.getBudgetPerPerson().multiply(BigDecimal.valueOf(1.2)));
        }

        try {
            Page<ListingResponse> page = listingService.searchListings(searchRequest, PageRequest.of(0, 30));
            return new ArrayList<>(page.getContent());
        } catch (Exception e) {
            log.warn("Failed to fetch listings for recommendation", e);
            return List.of();
        }
    }

    private List<ScoredListing> scoreListings(List<ListingResponse> listings, RecommendationRequest request) {
        return listings.stream().map(listing -> {
            int score = 50; // baseline

            // Rating factor (max 40 points)
            if (listing.getAverageRating() != null) {
                score += (int) (listing.getAverageRating().doubleValue() / 5.0 * 40);
            }

            // Price fit factor (max 30 points)
            if (request.getBudgetPerPerson() != null && listing.getBasePrice() != null) {
                double priceRatio = listing.getBasePrice().doubleValue() / request.getBudgetPerPerson().doubleValue();
                if (priceRatio <= 0.6) score += 30;
                else if (priceRatio <= 0.8) score += 20;
                else if (priceRatio <= 1.0) score += 10;
                else score -= 15;
            }

            // Review count factor (popularity boost, max 10 points)
            if (listing.getReviewCount() != null && listing.getReviewCount() > 0) {
                score += Math.min(10, listing.getReviewCount() / 5);
            }

            return new ScoredListing(Math.min(100, Math.max(0, score)), listing);
        }).collect(Collectors.toList());
    }

    private String buildListingContext(List<ScoredListing> scoredListings) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < scoredListings.size(); i++) {
            ListingResponse l = scoredListings.get(i).listing();
            sb.append(i + 1).append(". ID: ").append(l.getId())
              .append(" | ").append(l.getTitle())
              .append(" | Category: ").append(l.getCategory())
              .append(" | Price: ").append(l.getBasePrice()).append(" ").append(l.getCurrency())
              .append(" | Rating: ").append(l.getAverageRating() != null ? l.getAverageRating() : "N/A")
              .append(" | Reviews: ").append(l.getReviewCount())
              .append("\n");
        }
        return sb.toString();
    }

    private List<RecommendationResponse.RankedRecommendation> buildRankedResults(
            List<ScoredListing> candidates, String aiText) {
        List<RecommendationResponse.RankedRecommendation> result = new ArrayList<>();
        // For each candidate, extract a reasoning sentence from AI text or use default
        for (int i = 0; i < candidates.size(); i++) {
            ScoredListing sl = candidates.get(i);
            String reasoning = extractReasoning(sl.listing().getTitle(), aiText, i);
            result.add(RecommendationResponse.RankedRecommendation.builder()
                    .rank(i + 1)
                    .score(sl.score())
                    .reasoning(reasoning)
                    .listing(sl.listing())
                    .build());
        }
        return result;
    }

    private String extractReasoning(String listingTitle, String aiText, int fallbackIndex) {
        if (aiText == null || aiText.isBlank()) {
            return "Highly recommended based on your travel preferences.";
        }
        // Try to find a sentence mentioning the listing title
        String[] sentences = aiText.split("(?<=[.!?])\\s+");
        for (String sentence : sentences) {
            if (sentence.contains(listingTitle)) return sentence.trim();
        }
        // Fall back to numbered point from AI text
        if (sentences.length > fallbackIndex) return sentences[fallbackIndex].trim();
        return "Recommended based on ratings, price fit, and availability.";
    }

    private record ScoredListing(int score, ListingResponse listing) {}
}
