package com.travel.marketplace.modules.booking.repository;

import com.travel.marketplace.modules.booking.entity.CartItemExtra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CartItemExtraRepository extends JpaRepository<CartItemExtra, Long> {
    List<CartItemExtra> findAllByCartItemId(Long cartItemId);
    void deleteAllByCartItemId(Long cartItemId);
}
