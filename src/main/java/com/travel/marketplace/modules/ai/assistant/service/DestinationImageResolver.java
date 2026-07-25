package com.travel.marketplace.modules.ai.assistant.service;

import com.travel.marketplace.modules.ai.assistant.dto.AssistantResponse;
import com.travel.marketplace.modules.listing.dto.ListingResponse;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DestinationImageResolver {

    public String heroImage(String destination, List<AssistantResponse.ListingRecommendation> recommendations, List<ListingResponse> listings) {
        String image = recommendations == null
                ? null
                : recommendations.stream()
                .filter(recommendation -> sameDestination(destination, recommendation.getLocation()))
                .map(AssistantResponse.ListingRecommendation::getImageUrl)
                .filter(this::hasText)
                .findFirst()
                .orElse(null);

        if (hasText(image)) {
            return image;
        }

        image = listings == null
                ? null
                : listings.stream()
                .filter(listing -> sameDestination(destination, listing.getCity()))
                .map(this::resolveImageUrl)
                .filter(this::hasText)
                .findFirst()
                .orElse(null);

        if (hasText(image)) {
            return image;
        }

        image = recommendations == null
                ? null
                : recommendations.stream()
                .map(AssistantResponse.ListingRecommendation::getImageUrl)
                .filter(this::hasText)
                .findFirst()
                .orElse(null);

        if (hasText(image)) {
            return image;
        }

        return listings == null
                ? null
                : listings.stream()
                .map(this::resolveImageUrl)
                .filter(this::hasText)
                .findFirst()
                .orElse(null);
    }

    public String dayImage(List<ListingResponse> listings, int index) {
        if (listings == null || listings.isEmpty()) {
            return null;
        }
        for (int i = 0; i < listings.size(); i++) {
            String image = resolveImageUrl(listings.get((index + i) % listings.size()));
            if (hasText(image)) {
                return image;
            }
        }
        return null;
    }

    public String resolveImageUrl(ListingResponse listing) {
        if (listing == null) {
            return null;
        }
        if (hasText(listing.getCoverImageUrl())) {
            return listing.getCoverImageUrl();
        }
        if (listing.getImages() == null || listing.getImages().isEmpty()) {
            return null;
        }
        return listing.getImages().stream()
                .filter(image -> Boolean.TRUE.equals(image.getIsPrimary()))
                .map(ListingResponse.ListingImageResponse::getImageUrl)
                .filter(this::hasText)
                .findFirst()
                .orElseGet(() -> listing.getImages().stream()
                        .map(ListingResponse.ListingImageResponse::getImageUrl)
                        .filter(this::hasText)
                        .findFirst()
                        .orElse(null));
    }

    private boolean sameDestination(String destination, String candidate) {
        if (!hasText(destination) || !hasText(candidate)) {
            return false;
        }
        return normalize(candidate).contains(normalize(destination));
    }

    private String normalize(String value) {
        return value.toLowerCase().replaceAll("[^a-z0-9 ]", " ").replaceAll("\\s+", " ").trim();
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
