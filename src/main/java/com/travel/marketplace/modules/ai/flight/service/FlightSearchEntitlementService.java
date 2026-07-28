package com.travel.marketplace.modules.ai.flight.service;

import com.travel.marketplace.modules.user.entity.User;
import com.travel.marketplace.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Period;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class FlightSearchEntitlementService {

    private final UserRepository userRepository;

    public record FlightSearchEntitlement(String tierName, int maxSearchDays) {}

    public FlightSearchEntitlement getEntitlement(Long userId) {
        if (userId == null) {
            return new FlightSearchEntitlement("Basic", 15);
        }
        
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return new FlightSearchEntitlement("Basic", 15);
        }
        
        User user = userOpt.get();
        // Missing Membership Tier entity on User. Defaulting to Basic.
        // In a real implementation, we would check user.getMembershipTier() or similar.
        // For the sake of the prompt requirements, if there's no entity, we assume Basic.
        return new FlightSearchEntitlement("Basic", 15);
    }
}
