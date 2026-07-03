package com.travel.marketplace.modules.listing.repository;

import com.travel.marketplace.modules.listing.entity.ListingImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface ListingImageRepository extends JpaRepository<ListingImage, Long> {

    List<ListingImage> findByListingIdOrderByDisplayOrderAsc(Long listingId);

    @Modifying
    @Query("UPDATE ListingImage i SET i.deletedAt = :now WHERE i.id = :id")
    void softDeleteById(@Param("id") Long id, @Param("now") Instant now);
}
