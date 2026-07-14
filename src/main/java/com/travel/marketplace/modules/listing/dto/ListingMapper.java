package com.travel.marketplace.modules.listing.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.travel.marketplace.modules.listing.entity.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class ListingMapper {

    private static final Logger log = LoggerFactory.getLogger(ListingMapper.class);
    private final ObjectMapper objectMapper;

    public ListingMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public ListingResponse toResponse(Listing listing, List<ListingImage> images, Object detailEntity) {
        if (listing == null) {
            return null;
        }

        ListingResponse.ListingResponseBuilder builder = ListingResponse.builder()
                .id(listing.getId())
                .providerId(listing.getProvider() != null ? listing.getProvider().getId() : null)
                .providerName(listing.getProvider() != null ? listing.getProvider().getBusinessName() : null)
                .category(listing.getCategory() != null ? listing.getCategory().name() : null)
                .title(listing.getTitle())
                .slug(listing.getSlug())
                .shortDesc(listing.getShortDesc())
                .description(listing.getDescription())
                .address(listing.getAddress())
                .city(listing.getCity())
                .country(listing.getCountry())
                .latitude(listing.getLatitude())
                .longitude(listing.getLongitude())
                .coverImageUrl(listing.getCoverImageUrl())
                .basePrice(listing.getBasePrice())
                .currency(listing.getCurrency())
                .status(listing.getStatus() != null ? listing.getStatus().name() : null)
                .rejectionReason(listing.getRejectionReason())
                .viewCount(listing.getViewCount())
                .averageRating(listing.getAverageRating())
                .reviewCount(listing.getReviewCount())
                .createdAt(listing.getCreatedAt())
                .updatedAt(listing.getUpdatedAt());

        if (images != null && !images.isEmpty()) {
            List<ListingResponse.ListingImageResponse> imageResponses = images.stream()
                    .filter(img -> !img.isDeleted())
                    .map(img -> ListingResponse.ListingImageResponse.builder()
                            .id(img.getId())
                            .imageUrl(img.getImageUrl())
                            .altText(img.getAltText())
                            .displayOrder(img.getDisplayOrder())
                            .isPrimary(img.getIsPrimary())
                            .build())
                    .collect(Collectors.toList());
            builder.images(imageResponses);
        } else {
            builder.images(Collections.emptyList());
        }

        Map<String, Object> mergedDetails = new LinkedHashMap<>();

        if (detailEntity != null) {
            try {
                // Convert detail entity to Map using Jackson
                @SuppressWarnings("unchecked")
                Map<String, Object> detailsMap = objectMapper.convertValue(detailEntity, Map.class);
                // Remove some internal fields
                detailsMap.remove("id");
                detailsMap.remove("listing");
                mergedDetails.putAll(detailsMap);
            } catch (Exception e) {
                log.error("Failed to map detail entity to map", e);
            }
        }

        if (listing.getDetailsExtra() != null && !listing.getDetailsExtra().isEmpty()) {
            mergedDetails.putAll(listing.getDetailsExtra());
        }

        builder.details(mergedDetails);

        return builder.build();
    }
}
