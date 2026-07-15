package com.travel.marketplace.modules.listing.repository;

import com.travel.marketplace.modules.listing.entity.Listing;
import com.travel.marketplace.modules.listing.enums.ListingStatus;
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
 * Repository for Listing entities.
 * Supports dynamic filtering via JpaSpecificationExecutor.
 */
@Repository
public interface ListingRepository extends JpaRepository<Listing, Long>, JpaSpecificationExecutor<Listing> {

    Optional<Listing> findBySlug(String slug);

    Page<Listing> findAllByProviderId(Long providerId, Pageable pageable);

    @Query("""
            select l.provider.id, count(l.id)
            from Listing l
            where l.provider.id in :providerIds
              and l.status = com.travel.marketplace.modules.listing.enums.ListingStatus.ACTIVE
            group by l.provider.id
            """)
    List<Object[]> countActiveListingsByProviderIds(@Param("providerIds") List<Long> providerIds);

    long countByStatus(ListingStatus status);

    long countByCreatedAtGreaterThanEqual(Instant since);

    @Query("select coalesce(sum(l.viewCount), 0) from Listing l")
    long sumViewCount();

    @Query("select l.category, count(l.id) from Listing l group by l.category")
    List<Object[]> countByCategory();

    @Query("""
            select l.provider.id,
                   l.provider.businessName,
                   l.provider.user.avatarUrl,
                   count(l.id),
                   avg(l.averageRating)
            from Listing l
            where l.status = com.travel.marketplace.modules.listing.enums.ListingStatus.ACTIVE
            group by l.provider.id, l.provider.businessName, l.provider.user.avatarUrl
            order by count(l.id) desc
            """)
    List<Object[]> topProvidersByActiveListingCount(Pageable pageable);

    Page<Listing> findAllByStatusIn(List<ListingStatus> statuses, Pageable pageable);

    boolean existsBySlug(String slug);

    @Modifying
    @Query("UPDATE Listing l SET l.deletedAt = :now WHERE l.id = :id")
    void softDeleteById(@Param("id") Long id, @Param("now") Instant now);
}
