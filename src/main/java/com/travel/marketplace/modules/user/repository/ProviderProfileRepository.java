package com.travel.marketplace.modules.user.repository;

import com.travel.marketplace.modules.provider.enums.VerificationStatus;
import com.travel.marketplace.modules.user.entity.ProviderProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Repository for ProviderProfile.
 * Soft-delete is applied automatically via @SQLRestriction on the entity.
 * Use softDelete() query for deletion — never call deleteById().
 */
@Repository
public interface ProviderProfileRepository extends JpaRepository<ProviderProfile, Long>, JpaSpecificationExecutor<ProviderProfile> {

    Optional<ProviderProfile> findByUserId(Long userId);

    boolean existsByUserId(Long userId);

    Page<ProviderProfile> findAllByVerificationStatus(VerificationStatus status, Pageable pageable);

    long countByVerificationStatus(VerificationStatus status);

    long countByCreatedAtGreaterThanEqual(Instant since);

    @Query("select p.businessType, count(p.id) from ProviderProfile p group by p.businessType")
    List<Object[]> countByBusinessType();

    /** Soft-delete: sets deleted_at to now without removing the record. */
    @Modifying
    @Query("UPDATE ProviderProfile p SET p.deletedAt = :now WHERE p.id = :id")
    void softDeleteById(@Param("id") Long id, @Param("now") Instant now);
}
