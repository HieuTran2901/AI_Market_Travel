package com.travel.marketplace.modules.ai.assistant.service;

import com.travel.marketplace.modules.listing.dto.ListingResponse;
import com.travel.marketplace.modules.listing.dto.ListingSearchRequest;
import com.travel.marketplace.modules.listing.service.ListingService;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentCaptor.forClass;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class MarketplaceAiContextServiceTest {

    @Test
    void fallsBackToCanonicalDestinationKeywordWhenExactCityQueryReturnsNoRows() {
        ListingService listingService = mock(ListingService.class);
        MarketplaceAiContextService service = new MarketplaceAiContextService(listingService);
        ListingResponse hanoiListing = ListingResponse.builder()
                .id(3L)
                .title("Old Quarter Boutique Stay Ha Noi")
                .slug("old-quarter-boutique-stay-ha-noi")
                .category("HOTEL")
                .city("Ha Noi")
                .country("Vietnam")
                .status("ACTIVE")
                .basePrice(BigDecimal.valueOf(1_250_000))
                .averageRating(BigDecimal.valueOf(4.7))
                .reviewCount(42)
                .build();

        when(listingService.searchListings(any(ListingSearchRequest.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()))
                .thenReturn(new PageImpl<>(List.of(hanoiListing)));

        List<ListingResponse> results = service.search(new MarketplaceAiContextService.MarketplaceQueryContext(
                "Hanoi City",
                List.of(),
                null,
                null,
                List.of(),
                null,
                List.of(),
                null,
                "Recommend some places in Hanoi",
                6
        ));

        assertThat(results).extracting(ListingResponse::getId).containsExactly(3L);
        ArgumentCaptor<ListingSearchRequest> captor = forClass(ListingSearchRequest.class);
        org.mockito.Mockito.verify(listingService, org.mockito.Mockito.times(2)).searchListings(captor.capture(), any(Pageable.class));
        assertThat(captor.getAllValues().get(0).getCity()).isEqualTo("Hanoi City");
        assertThat(captor.getAllValues().get(0).getKeyword()).isNull();
        assertThat(captor.getAllValues().get(1).getCity()).isNull();
        assertThat(captor.getAllValues().get(1).getKeyword()).isEqualTo("Ha Noi");
    }
}
