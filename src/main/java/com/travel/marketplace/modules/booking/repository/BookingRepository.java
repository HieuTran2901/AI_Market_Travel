package com.travel.marketplace.modules.booking.repository;

import com.travel.marketplace.modules.booking.entity.Booking;
import com.travel.marketplace.modules.booking.enums.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    Optional<Booking> findByBookingNumber(String bookingNumber);
    Page<Booking> findAllByOrderUserId(Long userId, Pageable pageable);
    Page<Booking> findAllByListingProviderId(Long providerId, Pageable pageable);
    List<Booking> findAllByStatusAndExpiresAtBefore(BookingStatus status, Instant now);
    Optional<Booking> findByIdAndOrderUserIdAndListingId(Long id, Long userId, Long listingId);

    @Query("select b.order.user.id, count(b.id) from Booking b where b.order.user.id in :userIds group by b.order.user.id")
    List<Object[]> countBookingsByUserIds(@Param("userIds") List<Long> userIds);

    @Query("""
            select b.listing.provider.id, count(b.id)
            from Booking b
            where b.listing.provider.id in :providerIds
            group by b.listing.provider.id
            """)
    List<Object[]> countBookingsByProviderIds(@Param("providerIds") List<Long> providerIds);

    @Query("""
            select b.listing.id, count(b.id)
            from Booking b
            where b.listing.id in :listingIds
            group by b.listing.id
            """)
    List<Object[]> countBookingsByListingIds(@Param("listingIds") List<Long> listingIds);

    @Query(value = """
            select date(b.created_at) as day, count(b.id) as total
            from bookings b
            where b.deleted_at is null
              and b.created_at >= :from
              and b.created_at < :to
            group by date(b.created_at)
            order by day
            """, nativeQuery = true)
    List<Object[]> countBookingsCreatedByDay(@Param("from") Instant from, @Param("to") Instant to);

    long countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(Instant from, Instant to);

    @Query("""
            select b
            from Booking b
            join fetch b.order o
            join fetch o.user u
            join fetch b.listing l
            order by b.createdAt desc
            """)
    List<Booking> findRecentForAdmin(Pageable pageable);

    @Modifying
    @Query("UPDATE Booking b SET b.deletedAt = :now WHERE b.id = :id")
    void softDeleteById(@Param("id") Long id, @Param("now") Instant now);
}
