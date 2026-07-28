package com.travel.marketplace.modules.ai.flight.service;

import com.travel.marketplace.modules.ai.flight.dto.FlightDealCandidate;
import com.travel.marketplace.modules.ai.flight.dto.FlightOffer;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

@Service
public class FlightRankingService {

    public List<FlightDealCandidate> rankDeals(List<FlightDealCandidate> deals, BigDecimal budgetPerPerson) {
        if (deals == null) return List.of();
        
        deals.forEach(deal -> {
            double score = 0.0;
            
            // 30% budget proximity
            if (budgetPerPerson != null && budgetPerPerson.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal price = deal.getPrice() != null ? deal.getPrice() : BigDecimal.ZERO;
                if (price.compareTo(budgetPerPerson) <= 0) {
                    score += 30.0;
                } else {
                    double diff = price.subtract(budgetPerPerson).doubleValue() / budgetPerPerson.doubleValue();
                    score += Math.max(0, 30.0 - (diff * 100)); // penalize if over budget
                }
            } else {
                score += 30.0; // max score if no budget provided
            }

            // Dummy discount calculation (25%) since SerpApi might not always provide historical price
            score += 25.0; 

            // Other factors could go here, e.g., trip length relevance, direct flights
            score += 45.0; // base for other factors
            
            deal.setScore(score);
        });

        return deals.stream()
                .sorted(Comparator.comparingDouble(FlightDealCandidate::getScore).reversed())
                .toList();
    }

    public List<FlightOffer> rankFlights(List<FlightOffer> flights, BigDecimal budgetPerPerson) {
        if (flights == null) return List.of();
        
        flights.forEach(flight -> {
            double score = 0.0;
            
            // 35% budget proximity
            if (budgetPerPerson != null && budgetPerPerson.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal price = flight.getPrice() != null ? flight.getPrice() : BigDecimal.ZERO;
                if (price.compareTo(budgetPerPerson) <= 0) {
                    score += 35.0;
                } else {
                    double diff = price.subtract(budgetPerPerson).doubleValue() / budgetPerPerson.doubleValue();
                    score += Math.max(0, 35.0 - (diff * 100));
                }
            } else {
                score += 35.0;
            }

            // 20% departure time (favor morning/day flights slightly)
            score += 20.0;

            // 45% stops (direct flights get more points)
            String stops = flight.getStopsText();
            if (stops != null && stops.toLowerCase().contains("non-stop")) {
                score += 45.0;
            } else if (stops != null && stops.toLowerCase().contains("1 stop")) {
                score += 25.0;
            } else {
                score += 10.0;
            }
            
            flight.setScore(score);
        });

        return flights.stream()
                .sorted(Comparator.comparingDouble(FlightOffer::getScore).reversed())
                .toList();
    }
}
