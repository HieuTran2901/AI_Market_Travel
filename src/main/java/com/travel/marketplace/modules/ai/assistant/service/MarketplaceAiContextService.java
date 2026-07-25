package com.travel.marketplace.modules.ai.assistant.service;

import com.travel.marketplace.modules.listing.dto.ListingResponse;
import com.travel.marketplace.modules.listing.dto.ListingSearchRequest;
import com.travel.marketplace.modules.listing.service.ListingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MarketplaceAiContextService {

    private final ListingService listingService;

    public List<ListingResponse> search(MarketplaceQueryContext context) {
        if (context == null || context.limit() <= 0) {
            return List.of();
        }

        if (context.listingName() != null && !context.listingName().isBlank()) {
            return searchListingName(context);
        }

        List<ListingResponse> results = new ArrayList<>();
        List<String> categories = context.categories() == null ? List.of() : context.categories();
        if (categories.isEmpty()) {
            results.addAll(searchCategory(context, null, context.limit()));
        } else {
            int perCategory = Math.max(3, context.limit() / Math.max(1, categories.size()));
            for (String category : categories) {
                results.addAll(searchCategory(context, category, perCategory));
            }
        }

        return results.stream()
                .filter(listing -> listing.getId() != null)
                .filter(listing -> "ACTIVE".equalsIgnoreCase(listing.getStatus()))
                .collect(Collectors.toMap(ListingResponse::getId, listing -> listing, (a, b) -> a, LinkedHashMap::new))
                .values()
                .stream()
                .sorted(Comparator.comparing((ListingResponse l) -> l.getAverageRating() == null ? BigDecimal.ZERO : l.getAverageRating()).reversed())
                .limit(context.limit())
                .collect(Collectors.toList());
    }

    private List<ListingResponse> searchCategory(MarketplaceQueryContext context, String category, int limit) {
        ListingSearchRequest request = new ListingSearchRequest();
        request.setStatus("ACTIVE");
        request.setCategory(category);
        request.setCity(context.destination());
        request.setKeyword(context.destination() == null ? context.keyword() : null);
        request.setMinPrice(context.minPrice());
        request.setMaxPrice(context.maxPrice());

        try {
            return new ArrayList<>(listingService.searchListings(request, PageRequest.of(0, Math.max(1, limit))).getContent());
        } catch (Exception e) {
            log.warn("Failed to retrieve marketplace AI context", e);
            return List.of();
        }
    }

    private List<ListingResponse> searchListingName(MarketplaceQueryContext context) {
        ListingSearchRequest request = new ListingSearchRequest();
        request.setStatus("ACTIVE");
        request.setKeyword(context.listingName());

        try {
            String normalizedQuery = normalize(context.listingName());
            return new ArrayList<>(listingService.searchListings(request, PageRequest.of(0, Math.max(10, context.limit()))).getContent())
                    .stream()
                    .filter(listing -> listing.getId() != null)
                    .filter(listing -> "ACTIVE".equalsIgnoreCase(listing.getStatus()))
                    .sorted(Comparator.comparingInt(listing -> titleMatchRank(listing, normalizedQuery)))
                    .limit(context.limit())
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.warn("Failed to retrieve marketplace AI exact listing context", e);
            return List.of();
        }
    }

    private int titleMatchRank(ListingResponse listing, String normalizedQuery) {
        String title = normalize(listing.getTitle());
        String slug = normalize(listing.getSlug()).replace("-", " ");
        if (title.equals(normalizedQuery)) return 0;
        if (slug.equals(normalizedQuery)) return 1;
        if (title.contains(normalizedQuery)) return 2;
        return 3;
    }

    private String normalize(String value) {
        String lower = value == null ? "" : value.toLowerCase(Locale.ROOT).trim();
        return Normalizer.normalize(lower, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace('\u0111', 'd')
                .replaceAll("[^a-z0-9\\s-]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    public record MarketplaceQueryContext(
            String destination,
            List<String> categories,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            List<String> interests,
            Integer travelerCount,
            List<Long> listingIds,
            String listingName,
            String keyword,
            int limit
    ) {}
}
