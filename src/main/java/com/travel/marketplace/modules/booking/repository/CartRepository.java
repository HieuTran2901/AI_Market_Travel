package com.travel.marketplace.modules.booking.repository;

import com.travel.marketplace.modules.booking.entity.Cart;
import com.travel.marketplace.modules.booking.enums.CartStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {
    Optional<Cart> findByUserIdAndStatus(Long userId, CartStatus status);

    @Modifying
    @Query("UPDATE Cart c SET c.deletedAt = :now WHERE c.id = :id")
    void softDeleteById(@Param("id") Long id, @Param("now") Instant now);
}
