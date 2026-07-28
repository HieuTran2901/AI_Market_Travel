package com.travel.marketplace.modules.listing.repository;

import com.travel.marketplace.modules.listing.dto.ListingSearchRequest;
import com.travel.marketplace.modules.listing.entity.Listing;
import com.travel.marketplace.modules.listing.enums.ListingCategory;
import com.travel.marketplace.modules.listing.enums.ListingStatus;
import com.travel.marketplace.modules.ai.shared.DestinationNormalizer;
import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Expression;
import java.util.ArrayList;
import java.util.List;

public class ListingSpecification {

    public static Specification<Listing> filterBy(ListingSearchRequest request) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Always only return active listings (or match requested status)
            if (request.getStatus() != null && !request.getStatus().isEmpty()) {
                try {
                    ListingStatus status = ListingStatus.valueOf(request.getStatus().toUpperCase());
                    predicates.add(cb.equal(root.get("status"), status));
                } catch (IllegalArgumentException ignored) {}
            } else {
                predicates.add(cb.equal(root.get("status"), ListingStatus.ACTIVE));
            }

            if (request.getKeyword() != null && !request.getKeyword().trim().isEmpty()) {
                String likeKeyword = "%" + request.getKeyword().trim().toLowerCase() + "%";
                Predicate titleMatch = cb.like(cb.lower(root.get("title")), likeKeyword);
                Predicate descMatch = cb.like(cb.lower(root.get("description")), likeKeyword);
                Predicate cityMatch = cb.like(cb.lower(root.get("city")), likeKeyword);
                predicates.add(cb.or(titleMatch, descMatch, cityMatch));
            }

            if (request.getCategory() != null && !request.getCategory().isEmpty()) {
                try {
                    ListingCategory cat = ListingCategory.valueOf(request.getCategory().toUpperCase());
                    predicates.add(cb.equal(root.get("category"), cat));
                } catch (IllegalArgumentException ignored) {}
            }

            if (request.getCity() != null && !request.getCity().isEmpty()) {
                List<Predicate> cityPredicates = new ArrayList<>();
                for (String alias : DestinationNormalizer.aliases(request.getCity())) {
                    String normalizedAlias = alias.toLowerCase();
                    cityPredicates.add(cb.equal(cb.lower(root.get("city")), normalizedAlias));
                    cityPredicates.add(cb.like(cb.lower(root.get("city")), normalizedAlias + ",%"));
                    cityPredicates.add(cb.like(cb.lower(root.get("city")), normalizedAlias + " city%"));
                    cityPredicates.add(cb.like(cb.lower(root.get("address")), "%" + normalizedAlias + "%"));
                }
                predicates.add(cb.or(cityPredicates.toArray(new Predicate[0])));
            }

            if (request.getLatitude() != null && request.getLongitude() != null) {
                double radiusKm = request.getRadiusKm() != null
                        ? Math.max(1.0, request.getRadiusKm().doubleValue())
                        : 50.0;
                double radiusMeters = radiusKm * 1000.0;

                predicates.add(cb.isNotNull(root.get("latitude")));
                predicates.add(cb.isNotNull(root.get("longitude")));

                Expression<Object> listingPoint = cb.function(
                        "point",
                        Object.class,
                        root.get("longitude"),
                        root.get("latitude")
                );
                Expression<Object> searchPoint = cb.function(
                        "point",
                        Object.class,
                        cb.literal(request.getLongitude()),
                        cb.literal(request.getLatitude())
                );
                Expression<Double> distanceMeters = cb.function(
                        "ST_Distance_Sphere",
                        Double.class,
                        listingPoint,
                        searchPoint
                );

                predicates.add(cb.lessThanOrEqualTo(distanceMeters, radiusMeters));
            }

            if (request.getMinPrice() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("basePrice"), request.getMinPrice()));
            }

            if (request.getMaxPrice() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("basePrice"), request.getMaxPrice()));
            }

            // Note: sortBy is typically handled by Spring Data Pageable, not Specification directly.
            // But we keep it in request to let Controller parse and pass to Pageable.

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
