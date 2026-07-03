package com.travel.marketplace.modules.user.repository;

import com.travel.marketplace.modules.provider.enums.VerificationStatus;
import com.travel.marketplace.modules.user.entity.ProviderProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

/**
 * Repository for ProviderProfile.
 * Soft-delete is applied automatically via @SQLRestriction on the entity.
 * Use softDelete() query for deletion — never call deleteById().
 */
@Repository
public interface ProviderProfileRepository extends JpaRepository<ProviderProfile, Long> {

    Optional<ProviderProfile> findByUserId(Long userId);

    boolean existsByUserId(Long userId);

    Page<ProviderProfile> findAllByVerificationStatus(VerificationStatus status, Pageable pageable);

    /** Soft-delete: sets deleted_at to now without removing the record. */
    @Modifying
    @Query("UPDATE ProviderProfile p SET p.deletedAt = :now WHERE p.id = :id")
    void softDeleteById(@Param("id") Long id, @Param("now") Instant now);
}
