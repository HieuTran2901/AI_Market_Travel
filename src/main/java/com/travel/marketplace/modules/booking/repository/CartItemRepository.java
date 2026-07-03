package com.travel.marketplace.modules.booking.repository;

import com.travel.marketplace.modules.booking.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findAllByCartId(Long cartId);
    void deleteAllByCartId(Long cartId);
}
