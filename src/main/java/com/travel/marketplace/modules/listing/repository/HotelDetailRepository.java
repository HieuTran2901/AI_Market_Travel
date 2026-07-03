package com.travel.marketplace.modules.listing.repository;

import com.travel.marketplace.modules.listing.entity.HotelDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HotelDetailRepository extends JpaRepository<HotelDetail, Long> {
    Optional<HotelDetail> findByListingId(Long listingId);
}
