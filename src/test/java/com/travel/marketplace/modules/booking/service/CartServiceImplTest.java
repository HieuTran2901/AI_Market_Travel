package com.travel.marketplace.modules.booking.service;

import com.travel.marketplace.modules.booking.dto.CartExtraItemRequest;
import com.travel.marketplace.modules.booking.dto.CartExtrasRequest;
import com.travel.marketplace.modules.booking.dto.CartResponse;
import com.travel.marketplace.modules.booking.dto.PriceBreakdownDto;
import com.travel.marketplace.modules.booking.entity.Cart;
import com.travel.marketplace.modules.booking.entity.CartItem;
import com.travel.marketplace.modules.booking.entity.CartItemExtra;
import com.travel.marketplace.modules.booking.enums.CartStatus;
import com.travel.marketplace.modules.booking.mapper.BookingMapper;
import com.travel.marketplace.modules.booking.repository.CartItemExtraRepository;
import com.travel.marketplace.modules.booking.repository.CartItemRepository;
import com.travel.marketplace.modules.booking.repository.CartRepository;
import com.travel.marketplace.modules.inventory.repository.InventoryRepository;
import com.travel.marketplace.modules.listing.entity.Listing;
import com.travel.marketplace.modules.listing.entity.ListingExtraService;
import com.travel.marketplace.modules.listing.enums.ExtraServiceCategory;
import com.travel.marketplace.modules.listing.enums.ExtraServicePricingUnit;
import com.travel.marketplace.modules.listing.enums.ListingCategory;
import com.travel.marketplace.modules.listing.enums.ListingStatus;
import com.travel.marketplace.modules.listing.repository.ListingExtraServiceRepository;
import com.travel.marketplace.modules.listing.repository.ListingRepository;
import com.travel.marketplace.modules.pricing.service.PricingService;
import com.travel.marketplace.modules.provider.enums.BusinessType;
import com.travel.marketplace.modules.user.entity.ProviderProfile;
import com.travel.marketplace.modules.user.entity.User;
import com.travel.marketplace.modules.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CartServiceImplTest {

    @Mock private CartRepository cartRepository;
    @Mock private CartItemRepository cartItemRepository;
    @Mock private CartItemExtraRepository cartItemExtraRepository;
    @Mock private ListingRepository listingRepository;
    @Mock private ListingExtraServiceRepository listingExtraServiceRepository;
    @Mock private InventoryRepository inventoryRepository;
    @Mock private UserRepository userRepository;
    @Mock private PricingService pricingService;

    @Test
    void mergeCartItemExtrasKeepsExistingExtrasAndAddsSubmittedQuantities() {
        User user = User.builder().id(10L).email("user@example.com").fullName("User").password("secret").build();
        ProviderProfile provider = ProviderProfile.builder()
                .id(20L)
                .user(user)
                .businessName("Provider")
                .businessType(BusinessType.HOTEL)
                .address("Address")
                .build();
        Listing listing = Listing.builder()
                .id(30L)
                .provider(provider)
                .category(ListingCategory.HOTEL)
                .title("Hotel")
                .slug("hotel")
                .address("Address")
                .city("Da Lat")
                .country("Vietnam")
                .basePrice(new BigDecimal("1000000"))
                .currency("VND")
                .status(ListingStatus.ACTIVE)
                .reviewCount(0)
                .build();
        Cart cart = Cart.builder().id(40L).user(user).status(CartStatus.ACTIVE).items(new ArrayList<>()).build();
        CartItem item = CartItem.builder()
                .id(50L)
                .cart(cart)
                .listing(listing)
                .quantity(1)
                .extras(new ArrayList<>())
                .build();
        cart.getItems().add(item);

        ListingExtraService breakfast = extra(60L, listing, "Breakfast", "150000", ExtraServicePricingUnit.GUEST);
        ListingExtraService checkout = extra(61L, listing, "Late check-out", "200000", ExtraServicePricingUnit.ROOM);
        CartItemExtra existingBreakfast = CartItemExtra.builder()
                .id(70L)
                .cartItem(item)
                .extraService(breakfast)
                .serviceNameSnapshot("Breakfast")
                .unitPriceSnapshot(new BigDecimal("150000"))
                .currency("VND")
                .pricingUnit(ExtraServicePricingUnit.GUEST)
                .quantity(1)
                .lineTotal(new BigDecimal("150000"))
                .build();
        item.getExtras().add(existingBreakfast);

        CartExtraItemRequest addBreakfast = new CartExtraItemRequest();
        addBreakfast.setExtraServiceId(60L);
        addBreakfast.setQuantity(2);
        CartExtraItemRequest addCheckout = new CartExtraItemRequest();
        addCheckout.setExtraServiceId(61L);
        addCheckout.setQuantity(1);
        CartExtrasRequest request = new CartExtrasRequest();
        request.setListingId(30L);
        request.setItems(List.of(addBreakfast, addCheckout));

        when(cartRepository.findByUserIdAndStatus(10L, CartStatus.ACTIVE)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findById(50L)).thenReturn(Optional.of(item));
        when(listingExtraServiceRepository.findActiveByIdsForListing(
                org.mockito.ArgumentMatchers.anyCollection(),
                org.mockito.ArgumentMatchers.eq(30L),
                org.mockito.ArgumentMatchers.eq(ListingStatus.ACTIVE)
        )).thenReturn(List.of(breakfast, checkout));
        when(cartItemExtraRepository.save(any(CartItemExtra.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(pricingService.calculatePrice(any(), any(), any(), any())).thenReturn(PriceBreakdownDto.builder()
                .basePrice(new BigDecimal("1000000"))
                .subtotal(new BigDecimal("1000000"))
                .serviceFee(BigDecimal.ZERO)
                .tax(BigDecimal.ZERO)
                .discount(BigDecimal.ZERO)
                .finalTotal(new BigDecimal("1000000"))
                .build());

        CartResponse response = service().mergeCartItemExtras(10L, 50L, request);

        assertThat(item.getExtras()).hasSize(2);
        assertThat(existingBreakfast.getQuantity()).isEqualTo(3);
        assertThat(response.getItems().getFirst().getSelectedExtras())
                .extracting("extraServiceId")
                .containsExactlyInAnyOrder(60L, 61L);
        assertThat(response.getItems().getFirst().getPriceBreakdown().getExtrasAmount())
                .isEqualByComparingTo("650000");
        assertThat(response.getItems().getFirst().getPriceBreakdown().getFinalTotal())
                .isEqualByComparingTo("1650000");
    }

    private CartServiceImpl service() {
        return new CartServiceImpl(
                cartRepository,
                cartItemRepository,
                cartItemExtraRepository,
                listingRepository,
                listingExtraServiceRepository,
                inventoryRepository,
                userRepository,
                pricingService,
                new BookingMapper()
        );
    }

    private ListingExtraService extra(Long id, Listing listing, String name, String price, ExtraServicePricingUnit unit) {
        return ListingExtraService.builder()
                .id(id)
                .listing(listing)
                .name(name)
                .description(name)
                .category(ExtraServiceCategory.COMFORT)
                .price(new BigDecimal(price))
                .currency("VND")
                .pricingUnit(unit)
                .active(true)
                .maxQuantityPerBooking(10)
                .sortOrder(1)
                .build();
    }
}
