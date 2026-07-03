package com.travel.marketplace.modules.booking.service;

import com.travel.marketplace.modules.booking.dto.CheckoutRequest;
import com.travel.marketplace.modules.booking.dto.OrderResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface OrderService {
    OrderResponse createOrder(Long userId, CheckoutRequest request);
    OrderResponse getOrder(Long orderId);
    OrderResponse getOrderByNumber(String orderNumber);
    OrderResponse confirmOrderPayment(String orderNumber);
    Page<OrderResponse> getUserOrders(Long userId, Pageable pageable);
}
