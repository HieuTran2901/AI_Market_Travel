package com.travel.marketplace.modules.listing.repository;

import com.travel.marketplace.modules.listing.entity.ListingExtraService;
import com.travel.marketplace.modules.listing.enums.ExtraServiceCategory;
import com.travel.marketplace.modules.listing.enums.ListingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface ListingExtraServiceRepository extends JpaRepository<ListingExtraService, Long> {

    @Query("""
            select e
            from ListingExtraService e
            where e.listing.id = :listingId
              and e.listing.status = :status
              and e.active = true
              and (:category is null or e.category = :category)
            order by e.sortOrder asc, e.id asc
            """)
    List<ListingExtraService> findVisibleByListing(
            @Param("listingId") Long listingId,
            @Param("status") ListingStatus status,
            @Param("category") ExtraServiceCategory category
    );

    @Query("""
            select e
            from ListingExtraService e
            where e.id in :ids
              and e.listing.id = :listingId
              and e.listing.status = :status
              and e.active = true
            """)
    List<ListingExtraService> findActiveByIdsForListing(
            @Param("ids") Collection<Long> ids,
            @Param("listingId") Long listingId,
            @Param("status") ListingStatus status
    );
}
