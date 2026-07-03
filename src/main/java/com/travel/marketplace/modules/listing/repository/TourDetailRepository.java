package com.travel.marketplace.modules.listing.repository;

import com.travel.marketplace.modules.listing.entity.TourDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TourDetailRepository extends JpaRepository<TourDetail, Long> {
    Optional<TourDetail> findByListingId(Long listingId);
}
