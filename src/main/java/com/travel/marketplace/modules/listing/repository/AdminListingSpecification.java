package com.travel.marketplace.modules.listing.repository;

import com.travel.marketplace.modules.listing.dto.AdminListingSearchRequest;
import com.travel.marketplace.modules.listing.entity.Listing;
import com.travel.marketplace.modules.listing.enums.ListingCategory;
import com.travel.marketplace.modules.listing.enums.ListingStatus;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public final class AdminListingSpecification {

    private AdminListingSpecification() {
    }

    public static Specification<Listing> filterBy(AdminListingSearchRequest request) {
        return (root, query, cb) -> {
            if (query != null && query.getResultType() != Long.class && query.getResultType() != long.class) {
                root.fetch("provider", JoinType.LEFT);
            }

            List<Predicate> predicates = new ArrayList<>();

            if (request.keyword() != null && !request.keyword().isBlank()) {
                String keyword = "%" + request.keyword().trim().toLowerCase() + "%";
                Predicate idMatch = cb.conjunction();
                try {
                    idMatch = cb.equal(root.get("id"), Long.parseLong(request.keyword().trim()));
                } catch (NumberFormatException ignored) {
                    // Keyword is not an id; keep searching text fields.
                }
                predicates.add(cb.or(
                        idMatch,
                        cb.like(cb.lower(root.get("title")), keyword),
                        cb.like(cb.lower(root.get("slug")), keyword),
                        cb.like(cb.lower(root.get("description")), keyword),
                        cb.like(cb.lower(root.get("city")), keyword),
                        cb.like(cb.lower(root.join("provider", JoinType.LEFT).get("businessName")), keyword)
                ));
            }

            if (request.category() != null && !request.category().isBlank()) {
                try {
                    predicates.add(cb.equal(root.get("category"), ListingCategory.valueOf(request.category().toUpperCase())));
                } catch (IllegalArgumentException ignored) {
                    predicates.add(cb.disjunction());
                }
            }

            if (request.status() != null && !request.status().isBlank()) {
                try {
                    predicates.add(cb.equal(root.get("status"), ListingStatus.valueOf(request.status().toUpperCase())));
                } catch (IllegalArgumentException ignored) {
                    predicates.add(cb.disjunction());
                }
            }

            if (request.location() != null && !request.location().isBlank()) {
                String location = "%" + request.location().trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("city")), location),
                        cb.like(cb.lower(root.get("country")), location),
                        cb.like(cb.lower(root.get("address")), location)
                ));
            }

            if (request.providerId() != null) {
                predicates.add(cb.equal(root.get("provider").get("id"), request.providerId()));
            }

            if (request.createdFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), request.createdFrom()));
            }
            if (request.createdTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), request.createdTo()));
            }
            if (request.updatedFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("updatedAt"), request.updatedFrom()));
            }
            if (request.updatedTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("updatedAt"), request.updatedTo()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
