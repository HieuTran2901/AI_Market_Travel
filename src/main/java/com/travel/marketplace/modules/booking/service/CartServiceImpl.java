package com.travel.marketplace.modules.booking.service;

import com.travel.marketplace.exception.BadRequestException;
import com.travel.marketplace.exception.ResourceNotFoundException;
import com.travel.marketplace.modules.booking.dto.*;
import com.travel.marketplace.modules.booking.entity.Cart;
import com.travel.marketplace.modules.booking.entity.CartItem;
import com.travel.marketplace.modules.booking.enums.CartStatus;
import com.travel.marketplace.modules.booking.mapper.BookingMapper;
import com.travel.marketplace.modules.booking.repository.CartItemRepository;
import com.travel.marketplace.modules.booking.repository.CartRepository;
import com.travel.marketplace.modules.inventory.entity.Inventory;
import com.travel.marketplace.modules.inventory.repository.InventoryRepository;
import com.travel.marketplace.modules.listing.entity.Listing;
import com.travel.marketplace.modules.listing.enums.ListingStatus;
import com.travel.marketplace.modules.listing.repository.ListingRepository;
import com.travel.marketplace.modules.pricing.service.PricingService;
import com.travel.marketplace.modules.user.entity.User;
import com.travel.marketplace.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ListingRepository listingRepository;
    private final InventoryRepository inventoryRepository;
    private final UserRepository userRepository;
    private final PricingService pricingService;
    private final BookingMapper bookingMapper;

    private Cart getOrCreateCartEntity(Long userId) {
        return cartRepository.findByUserIdAndStatus(userId, CartStatus.ACTIVE)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
                    Cart cart = Cart.builder()
                            .user(user)
                            .status(CartStatus.ACTIVE)
                            .build();
                    return cartRepository.save(cart);
                });
    }

    private CartResponse buildCartResponse(Cart cart) {
        List<CartItemResponse> itemResponses = new ArrayList<>();
        BigDecimal totalSubtotal = BigDecimal.ZERO;
        BigDecimal totalServiceFee = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;
        BigDecimal totalDiscount = BigDecimal.ZERO;
        BigDecimal totalFinal = BigDecimal.ZERO;

        for (CartItem item : cart.getItems()) {
            BigDecimal basePrice = item.getListing().getBasePrice();
            if (item.getInventory() != null) {
                basePrice = basePrice.multiply(item.getInventory().getPriceMultiplier());
            }

            PriceBreakdownDto breakdown = pricingService.calculatePrice(
                    basePrice,
                    item.getQuantity(),
                    item.getStartDate(),
                    item.getEndDate()
            );

            totalSubtotal = totalSubtotal.add(breakdown.getSubtotal());
            totalServiceFee = totalServiceFee.add(breakdown.getServiceFee());
            totalTax = totalTax.add(breakdown.getTax());
            totalDiscount = totalDiscount.add(breakdown.getDiscount());
            totalFinal = totalFinal.add(breakdown.getFinalTotal());

            itemResponses.add(bookingMapper.toCartItemResponse(item, breakdown));
        }

        PriceBreakdownDto totalBreakdown = PriceBreakdownDto.builder()
                .basePrice(totalSubtotal)
                .subtotal(totalSubtotal)
                .serviceFee(totalServiceFee)
                .tax(totalTax)
                .discount(totalDiscount)
                .finalTotal(totalFinal)
                .build();

        return CartResponse.builder()
                .id(cart.getId())
                .userId(cart.getUser().getId())
                .status(cart.getStatus().name())
                .items(itemResponses)
                .totalBreakdown(totalBreakdown)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public CartResponse getActiveCart(Long userId) {
        Cart cart = getOrCreateCartEntity(userId);
        return buildCartResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse addItemToCart(Long userId, CartItemRequest request) {
        Cart cart = getOrCreateCartEntity(userId);

        Listing listing = listingRepository.findById(request.getListingId())
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found with id: " + request.getListingId()));

        if (listing.getStatus() != ListingStatus.ACTIVE) {
            throw new BadRequestException("Listing is not available for booking.");
        }

        if (request.getQuantity() == null || request.getQuantity() < 1) {
            throw new BadRequestException("Quantity must be at least 1.");
        }

        if (request.getStartDate() != null && request.getEndDate() != null
                && request.getEndDate().isBefore(request.getStartDate())) {
            throw new BadRequestException("End date must be on or after the start date.");
        }

        Inventory inventory = null;
        if (request.getInventoryId() != null) {
            inventory = inventoryRepository.findById(request.getInventoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Inventory not found with id: " + request.getInventoryId()));
            if (!inventory.getListing().getId().equals(listing.getId())) {
                throw new BadRequestException("Inventory does not belong to the selected listing.");
            }
        }

        CartItem cartItem = CartItem.builder()
                .cart(cart)
                .listing(listing)
                .inventory(inventory)
                .quantity(request.getQuantity() != null ? request.getQuantity() : 1)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .timeSlot(request.getTimeSlot())
                .build();

        cartItemRepository.save(cartItem);
        cart.getItems().add(cartItem);

        return buildCartResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse removeItemFromCart(Long userId, Long itemId) {
        Cart cart = getOrCreateCartEntity(userId);
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("CartItem not found with id: " + itemId));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new BadRequestException("Item does not belong to the user's cart.");
        }

        cartItemRepository.delete(item);
        cart.getItems().remove(item);

        return buildCartResponse(cart);
    }

    @Override
    @Transactional
    public void clearCart(Long userId) {
        Cart cart = getOrCreateCartEntity(userId);
        cartItemRepository.deleteAllByCartId(cart.getId());
        cart.getItems().clear();
    }
}
