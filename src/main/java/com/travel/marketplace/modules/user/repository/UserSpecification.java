package com.travel.marketplace.modules.user.repository;

import com.travel.marketplace.modules.provider.enums.VerificationStatus;
import com.travel.marketplace.modules.user.dto.AdminUserSearchRequest;
import com.travel.marketplace.modules.user.entity.ProviderProfile;
import com.travel.marketplace.modules.user.entity.Role;
import com.travel.marketplace.modules.user.entity.User;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public final class UserSpecification {

    private UserSpecification() {
    }

    public static Specification<User> filterBy(AdminUserSearchRequest request) {
        return (root, query, cb) -> {
            if (query != null) {
                query.distinct(true);
            }

            List<Predicate> predicates = new ArrayList<>();
            Join<User, Role> roles = root.join("roles", JoinType.LEFT);
            Join<User, ProviderProfile> providerProfile = root.join("providerProfile", JoinType.LEFT);

            if (request.keyword() != null && !request.keyword().trim().isEmpty()) {
                String keyword = "%" + request.keyword().trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("fullName")), keyword),
                        cb.like(cb.lower(root.get("email")), keyword),
                        cb.like(cb.lower(root.get("phoneNumber")), keyword)
                ));
            }

            if (request.role() != null && !request.role().isBlank()) {
                String role = request.role().trim().toUpperCase();
                switch (role) {
                    case "CUSTOMER" -> predicates.add(cb.equal(roles.get("name"), "ROLE_CUSTOMER"));
                    case "ADMIN" -> predicates.add(cb.equal(roles.get("name"), "ROLE_ADMIN"));
                    case "PROVIDER" -> predicates.add(cb.or(
                            cb.like(roles.get("name"), "ROLE_PROVIDER_%"),
                            cb.isNotNull(providerProfile.get("id"))
                    ));
                    default -> predicates.add(cb.disjunction());
                }
            }

            if (request.status() != null && !request.status().isBlank()) {
                String status = request.status().trim().toUpperCase();
                switch (status) {
                    case "ACTIVE" -> predicates.add(cb.and(
                            cb.isTrue(root.get("isActive")),
                            cb.isNull(root.get("bannedAt")),
                            cb.or(
                                    cb.isNull(providerProfile.get("id")),
                                    cb.notEqual(providerProfile.get("verificationStatus"), VerificationStatus.SUSPENDED)
                            )
                    ));
                    case "INACTIVE" -> predicates.add(cb.and(cb.isFalse(root.get("isActive")), cb.isNull(root.get("bannedAt"))));
                    case "SUSPENDED" -> predicates.add(cb.and(
                            cb.isNull(root.get("bannedAt")),
                            cb.equal(providerProfile.get("verificationStatus"), VerificationStatus.SUSPENDED)
                    ));
                    case "BANNED" -> predicates.add(cb.isNotNull(root.get("bannedAt")));
                    default -> predicates.add(cb.disjunction());
                }
            }

            if (request.verified() != null) {
                Predicate verified = cb.or(
                        cb.equal(providerProfile.get("verificationStatus"), VerificationStatus.APPROVED),
                        cb.equal(roles.get("name"), "ROLE_ADMIN")
                );
                predicates.add(Boolean.TRUE.equals(request.verified()) ? verified : cb.not(verified));
            }

            if (request.joinedFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), request.joinedFrom()));
            }

            if (request.joinedTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), request.joinedTo()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
