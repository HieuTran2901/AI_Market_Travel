package com.travel.marketplace.modules.booking.repository;

import com.travel.marketplace.modules.booking.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderNumber(String orderNumber);
    Page<Order> findAllByUserId(Long userId, Pageable pageable);

    @Modifying
    @Query("UPDATE Order o SET o.deletedAt = :now WHERE o.id = :id")
    void softDeleteById(@Param("id") Long id, @Param("now") Instant now);
}
