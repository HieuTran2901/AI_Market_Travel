package com.travel.marketplace.modules.booking.controller;

import com.travel.marketplace.dto.ApiResponse;
import com.travel.marketplace.modules.booking.dto.CartItemRequest;
import com.travel.marketplace.modules.booking.dto.CartResponse;
import com.travel.marketplace.modules.booking.service.CartService;
import com.travel.marketplace.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/cart")
@RequiredArgsConstructor
@Tag(name = "Cart", description = "Shopping Cart Operations")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("isAuthenticated()")
public class CartController {

    private final CartService cartService;

    @GetMapping
    @Operation(summary = "Get current user's active cart")
    public ResponseEntity<ApiResponse<CartResponse>> getActiveCart(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        CartResponse response = cartService.getActiveCart(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/items")
    @Operation(summary = "Add an item to the shopping cart")
    public ResponseEntity<ApiResponse<CartResponse>> addItemToCart(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody CartItemRequest request) {
        CartResponse response = cartService.addItemToCart(userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Item added to cart successfully.", response));
    }

    @DeleteMapping("/items/{itemId}")
    @Operation(summary = "Remove an item from the shopping cart")
    public ResponseEntity<ApiResponse<CartResponse>> removeItemFromCart(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long itemId) {
        CartResponse response = cartService.removeItemFromCart(userPrincipal.getId(), itemId);
        return ResponseEntity.ok(ApiResponse.success("Item removed from cart successfully.", response));
    }

    @DeleteMapping
    @Operation(summary = "Clear all items from the shopping cart")
    public ResponseEntity<ApiResponse<Void>> clearCart(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        cartService.clearCart(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Cart cleared successfully.", null));
    }
}
