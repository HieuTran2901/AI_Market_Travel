package com.travel.marketplace.modules.listing.repository;

import com.travel.marketplace.modules.listing.entity.VehicleDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VehicleDetailRepository extends JpaRepository<VehicleDetail, Long> {
    Optional<VehicleDetail> findByListingId(Long listingId);
}
