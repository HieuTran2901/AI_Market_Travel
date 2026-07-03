package com.travel.marketplace.modules.booking.service;

import com.travel.marketplace.exception.BadRequestException;
import com.travel.marketplace.exception.ResourceNotFoundException;
import com.travel.marketplace.modules.booking.dto.*;
import com.travel.marketplace.modules.booking.entity.*;
import com.travel.marketplace.modules.booking.enums.BookingStatus;
import com.travel.marketplace.modules.booking.enums.OrderStatus;
import com.travel.marketplace.modules.booking.mapper.BookingMapper;
import com.travel.marketplace.modules.booking.repository.*;
import com.travel.marketplace.modules.pricing.service.PricingService;
import com.travel.marketplace.modules.inventory.service.InventoryService;
import com.travel.marketplace.modules.listing.enums.ListingStatus;
import com.travel.marketplace.modules.user.entity.User;
import com.travel.marketplace.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final BookingRepository bookingRepository;
    private final BookingGuestRepository bookingGuestRepository;
    private final BookingPriceBreakdownRepository bookingPriceBreakdownRepository;
    private final BookingHistoryRepository bookingHistoryRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final PricingService pricingService;
    private final InventoryService inventoryService;
    private final ReservationLockManager reservationLockManager;
    private final BookingMapper bookingMapper;

    @Override
    @Transactional
    public OrderResponse createOrder(Long userId, CheckoutRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new BadRequestException("No items provided for checkout.");
        }

        // 1. Create order entity
        String orderNumber = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Order order = Order.builder()
                .user(user)
                .orderNumber(orderNumber)
                .status(OrderStatus.PENDING)
                .subtotal(BigDecimal.ZERO)
                .serviceFee(BigDecimal.ZERO)
                .tax(BigDecimal.ZERO)
                .discount(BigDecimal.ZERO)
                .finalTotal(BigDecimal.ZERO)
                .bookings(new ArrayList<>())
                .build();

        order = orderRepository.save(order);

        BigDecimal totalSubtotal = BigDecimal.ZERO;
        BigDecimal totalServiceFee = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;
        BigDecimal totalDiscount = BigDecimal.ZERO;
        BigDecimal totalFinal = BigDecimal.ZERO;

        List<CartItem> cartItemsToRemove = new ArrayList<>();

        for (CheckoutRequest.ItemCheckoutDetail detail : request.getItems()) {
            CartItem cartItem = cartItemRepository.findById(detail.getCartItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cart item not found: " + detail.getCartItemId()));

            if (!cartItem.getCart().getUser().getId().equals(userId)) {
                throw new BadRequestException("Cart item does not belong to the current user.");
            }

            if (cartItem.getListing().getStatus() != ListingStatus.ACTIVE) {
                throw new BadRequestException("Listing " + cartItem.getListing().getTitle() + " is not available for booking.");
            }

            // Verify availability before locking
            Long invId = cartItem.getInventory() != null ? cartItem.getInventory().getId() : null;
            boolean available = inventoryService.checkAvailability(
                    cartItem.getListing().getId(),
                    invId,
                    cartItem.getStartDate(),
                    cartItem.getEndDate(),
                    cartItem.getQuantity()
            );

            if (!available) {
                throw new BadRequestException("Item " + cartItem.getListing().getTitle() + " is no longer available.");
            }

            // Calculate price breakdown
            BigDecimal unitBasePrice = cartItem.getListing().getBasePrice();
            if (cartItem.getInventory() != null) {
                unitBasePrice = unitBasePrice.multiply(cartItem.getInventory().getPriceMultiplier());
            }

            PriceBreakdownDto pricing = pricingService.calculatePrice(
                    unitBasePrice,
                    cartItem.getQuantity(),
                    cartItem.getStartDate(),
                    cartItem.getEndDate()
            );

            // Generate Booking
            String bookingNumber = "BKG-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            Booking booking = Booking.builder()
                    .order(order)
                    .listing(cartItem.getListing())
                    .inventory(cartItem.getInventory())
                    .bookingNumber(bookingNumber)
                    .status(BookingStatus.PENDING)
                    .startDate(cartItem.getStartDate())
                    .endDate(cartItem.getEndDate())
                    .timeSlot(cartItem.getTimeSlot())
                    .quantity(cartItem.getQuantity())
                    .basePrice(pricing.getBasePrice())
                    .subtotal(pricing.getSubtotal())
                    .serviceFee(pricing.getServiceFee())
                    .tax(pricing.getTax())
                    .discount(pricing.getDiscount())
                    .finalTotal(pricing.getFinalTotal())
                    .guests(new ArrayList<>())
                    .build();

            booking = bookingRepository.save(booking);

            // Save guests
            if (detail.getGuests() != null) {
                for (GuestInfoRequest guestReq : detail.getGuests()) {
                    BookingGuest guest = BookingGuest.builder()
                            .booking(booking)
                            .name(guestReq.getName())
                            .email(guestReq.getEmail())
                            .phone(guestReq.getPhone())
                            .passport(guestReq.getPassport())
                            .dateOfBirth(guestReq.getDateOfBirth())
                            .nationality(guestReq.getNationality())
                            .build();
                    bookingGuestRepository.save(guest);
                    booking.getGuests().add(guest);
                }
            }

            // Save price breakdowns
            savePriceBreakdown(booking, "Base Price", pricing.getSubtotal());
            savePriceBreakdown(booking, "Service Fee", pricing.getServiceFee());
            savePriceBreakdown(booking, "VAT / Tax", pricing.getTax());
            if (pricing.getDiscount().compareTo(BigDecimal.ZERO) > 0) {
                savePriceBreakdown(booking, "Discount", pricing.getDiscount().negate());
            }

            // Apply reservation lock (TTL 15 minutes)
            reservationLockManager.lock(booking, 15);

            order.getBookings().add(booking);

            totalSubtotal = totalSubtotal.add(pricing.getSubtotal());
            totalServiceFee = totalServiceFee.add(pricing.getServiceFee());
            totalTax = totalTax.add(pricing.getTax());
            totalDiscount = totalDiscount.add(pricing.getDiscount());
            totalFinal = totalFinal.add(pricing.getFinalTotal());

            cartItemsToRemove.add(cartItem);
        }

        // Update order totals
        order.setSubtotal(totalSubtotal);
        order.setServiceFee(totalServiceFee);
        order.setTax(totalTax);
        order.setDiscount(totalDiscount);
        order.setFinalTotal(totalFinal);
        order = orderRepository.save(order);

        // Remove from cart
        cartItemRepository.deleteAll(cartItemsToRemove);

        return bookingMapper.toOrderResponse(order);
    }

    private void savePriceBreakdown(Booking booking, String itemName, BigDecimal amount) {
        BookingPriceBreakdown pb = BookingPriceBreakdown.builder()
                .booking(booking)
                .itemName(itemName)
                .amount(amount)
                .build();
        bookingPriceBreakdownRepository.save(pb);
        booking.getBreakdowns().add(pb);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));
        return bookingMapper.toOrderResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderByNumber(String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderNumber));
        return bookingMapper.toOrderResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse confirmOrderPayment(String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderNumber));

        if (order.getStatus() == OrderStatus.CONFIRMED) {
            return bookingMapper.toOrderResponse(order);
        }

        order.setStatus(OrderStatus.CONFIRMED);
        orderRepository.save(order);

        for (Booking booking : order.getBookings()) {
            if (booking.getStatus() == BookingStatus.RESERVED) {
                booking.setStatus(BookingStatus.CONFIRMED);
                booking.setExpiresAt(null); // Clear TTL lock
                bookingRepository.save(booking);

                // Confirm inventory slots in availability calendar
                inventoryService.confirmInventory(
                        booking.getListing().getId(),
                        booking.getInventory() != null ? booking.getInventory().getId() : null,
                        booking.getStartDate(),
                        booking.getEndDate(),
                        booking.getQuantity()
                );

                // History
                bookingHistoryRepository.save(BookingHistory.builder()
                        .booking(booking)
                        .fromStatus(BookingStatus.RESERVED.name())
                        .toStatus(BookingStatus.CONFIRMED.name())
                        .notes("Payment confirmed. Reservation finalized.")
                        .build());
            }
        }

        return bookingMapper.toOrderResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getUserOrders(Long userId, Pageable pageable) {
        return orderRepository.findAllByUserId(userId, pageable)
                .map(bookingMapper::toOrderResponse);
    }
}
