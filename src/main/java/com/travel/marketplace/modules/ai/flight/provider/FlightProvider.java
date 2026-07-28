package com.travel.marketplace.modules.ai.flight.provider;

import com.travel.marketplace.modules.ai.flight.dto.FlightFlexibleSearchQuery;
import com.travel.marketplace.modules.ai.flight.dto.FlightSearchQuery;
import com.travel.marketplace.modules.ai.flight.dto.FlightDealSearchResult;
import com.travel.marketplace.modules.ai.flight.dto.FlightSearchResult;

public interface FlightProvider {
    FlightDealSearchResult searchDeals(FlightFlexibleSearchQuery query);
    FlightSearchResult searchFlights(FlightSearchQuery query);
    String getBookingOptions(String bookingToken);
}
