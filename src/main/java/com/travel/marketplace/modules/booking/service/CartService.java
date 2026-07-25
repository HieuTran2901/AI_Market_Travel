package com.travel.marketplace.modules.booking.service;

import com.travel.marketplace.modules.booking.dto.CartItemRequest;
import com.travel.marketplace.modules.booking.dto.CartExtrasRequest;
import com.travel.marketplace.modules.booking.dto.CartResponse;

public interface CartService {
    CartResponse getActiveCart(Long userId);
    CartResponse addItemToCart(Long userId, CartItemRequest request);
    CartResponse mergeCartItemExtras(Long userId, Long itemId, CartExtrasRequest request);
    CartResponse removeItemFromCart(Long userId, Long itemId);
    void clearCart(Long userId);
}
