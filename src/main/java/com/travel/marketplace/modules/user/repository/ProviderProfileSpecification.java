package com.travel.marketplace.modules.user.repository;

import com.travel.marketplace.modules.provider.dto.AdminProviderSearchRequest;
import com.travel.marketplace.modules.provider.enums.BusinessType;
import com.travel.marketplace.modules.provider.enums.VerificationStatus;
import com.travel.marketplace.modules.user.entity.ProviderProfile;
import com.travel.marketplace.modules.user.entity.User;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public final class ProviderProfileSpecification {

    private ProviderProfileSpecification() {
    }

    public static Specification<ProviderProfile> filterBy(AdminProviderSearchRequest request) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            Join<ProviderProfile, User> user = root.join("user", JoinType.LEFT);

            if (request.keyword() != null && !request.keyword().isBlank()) {
                String keyword = "%" + request.keyword().trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("businessName")), keyword),
                        cb.like(cb.lower(root.get("phone")), keyword),
                        cb.like(cb.lower(root.get("description")), keyword),
                        cb.like(cb.lower(user.get("fullName")), keyword),
                        cb.like(cb.lower(user.get("email")), keyword),
                        cb.like(cb.lower(user.get("phoneNumber")), keyword)
                ));
            }

            BusinessType category = parseBusinessType(request.category());
            if (category != null) {
                predicates.add(cb.equal(root.get("businessType"), category));
            }

            VerificationStatus status = parseVerificationStatus(request.status() != null ? request.status() : request.verification());
            if (status != null) {
                predicates.add(cb.equal(root.get("verificationStatus"), status));
            }

            if (request.joinedFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), request.joinedFrom()));
            }
            if (request.joinedTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), request.joinedTo()));
            }

            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    private static BusinessType parseBusinessType(String value) {
        if (value == null || value.isBlank() || "all".equalsIgnoreCase(value)) {
            return null;
        }
        try {
            return BusinessType.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }

    private static VerificationStatus parseVerificationStatus(String value) {
        if (value == null || value.isBlank() || "all".equalsIgnoreCase(value)) {
            return null;
        }
        String normalized = value.trim().toUpperCase();
        if ("ACTIVE".equals(normalized) || "VERIFIED".equals(normalized)) {
            normalized = "APPROVED";
        }
        if ("SUSPENDED".equals(normalized) || "PENDING".equals(normalized) || "REJECTED".equals(normalized) || "APPROVED".equals(normalized)) {
            return VerificationStatus.valueOf(normalized);
        }
        return null;
    }
}
