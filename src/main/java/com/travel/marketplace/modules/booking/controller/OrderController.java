package com.travel.marketplace.modules.booking.controller;

import com.travel.marketplace.dto.ApiResponse;
import com.travel.marketplace.modules.booking.dto.CheckoutRequest;
import com.travel.marketplace.modules.booking.dto.OrderResponse;
import com.travel.marketplace.modules.booking.service.OrderService;
import com.travel.marketplace.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@Tag(name = "Orders", description = "Order & Checkout Operations")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("isAuthenticated()")
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @Operation(summary = "Checkout cart items and create pending order with locked reservations")
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody CheckoutRequest request) {
        OrderResponse response = orderService.createOrder(userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Order created with pending reservations.", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get order details by ID")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrder(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id) {
        OrderResponse response = orderService.getOrder(id);
        // Verify ownership
        if (!response.getUserId().equals(userPrincipal.getId())) {
            return ResponseEntity.status(403).body(ApiResponse.error("FORBIDDEN", "You do not own this order."));
        }
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/by-number/{orderNumber}")
    @Operation(summary = "Get order details by order number")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderByNumber(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String orderNumber) {
        OrderResponse response = orderService.getOrderByNumber(orderNumber);
        if (!response.getUserId().equals(userPrincipal.getId())) {
            return ResponseEntity.status(403).body(ApiResponse.error("FORBIDDEN", "You do not own this order."));
        }
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{orderNumber}/confirm")
    @Operation(summary = "Confirm payment and finalize bookings (simulation)")
    public ResponseEntity<ApiResponse<OrderResponse>> confirmPayment(
            @PathVariable String orderNumber) {
        OrderResponse response = orderService.confirmOrderPayment(orderNumber);
        return ResponseEntity.ok(ApiResponse.success("Payment confirmed and bookings finalized.", response));
    }

    @GetMapping("/my")
    @Operation(summary = "Get current user's orders list")
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> getMyOrders(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<OrderResponse> page = orderService.getUserOrders(userPrincipal.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }
}
