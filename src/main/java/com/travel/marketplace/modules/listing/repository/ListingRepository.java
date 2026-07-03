package com.travel.marketplace.modules.listing.repository;

import com.travel.marketplace.modules.listing.entity.Listing;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

/**
 * Repository for Listing entities.
 * Supports dynamic filtering via JpaSpecificationExecutor.
 */
@Repository
public interface ListingRepository extends JpaRepository<Listing, Long>, JpaSpecificationExecutor<Listing> {

    Optional<Listing> findBySlug(String slug);

    Page<Listing> findAllByProviderId(Long providerId, Pageable pageable);

    boolean existsBySlug(String slug);

    @Modifying
    @Query("UPDATE Listing l SET l.deletedAt = :now WHERE l.id = :id")
    void softDeleteById(@Param("id") Long id, @Param("now") Instant now);
}
