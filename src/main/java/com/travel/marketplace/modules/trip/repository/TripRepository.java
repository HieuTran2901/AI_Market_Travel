package com.travel.marketplace.modules.trip.repository;

import com.travel.marketplace.modules.trip.entity.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TripRepository extends JpaRepository<Trip, Long> {
    boolean existsBySlug(String slug);

    Optional<Trip> findByAiDraftIdAndUserId(String aiDraftId, Long userId);

    @Query("""
            SELECT DISTINCT t
            FROM Trip t
            LEFT JOIN FETCH t.days d
            WHERE t.slug = :slug
              AND t.user.id = :userId
            """)
    Optional<Trip> findDetailWithDaysBySlugAndUserId(@Param("slug") String slug, @Param("userId") Long userId);

    List<Trip> findAllByUserIdOrderByCreatedAtDesc(Long userId);
}
