package com.travel.marketplace.modules.trip.repository;

import com.travel.marketplace.modules.trip.entity.TripActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface TripActivityRepository extends JpaRepository<TripActivity, Long> {

    @Query("""
            SELECT a
            FROM TripActivity a
            LEFT JOIN FETCH a.listing
            WHERE a.day.id IN :dayIds
            ORDER BY a.day.dayNumber ASC, a.displayOrder ASC
            """)
    List<TripActivity> findAllByTripDayIds(@Param("dayIds") Collection<Long> dayIds);
}
