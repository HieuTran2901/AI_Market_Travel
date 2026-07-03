package com.travel.marketplace.modules.listing.repository;

import com.travel.marketplace.modules.listing.entity.ExperienceDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ExperienceDetailRepository extends JpaRepository<ExperienceDetail, Long> {
    Optional<ExperienceDetail> findByListingId(Long listingId);
}
