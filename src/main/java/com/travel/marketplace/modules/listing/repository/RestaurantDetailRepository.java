package com.travel.marketplace.modules.listing.repository;

import com.travel.marketplace.modules.listing.entity.RestaurantDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RestaurantDetailRepository extends JpaRepository<RestaurantDetail, Long> {
    Optional<RestaurantDetail> findByListingId(Long listingId);
}
