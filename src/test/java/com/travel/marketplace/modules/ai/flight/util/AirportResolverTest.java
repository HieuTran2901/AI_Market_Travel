package com.travel.marketplace.modules.ai.flight.util;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class AirportResolverTest {
    
    @Test
    public void testResolution() {
        AirportResolver resolver = new AirportResolver();
        
        String[] cases = {
            "Ho Chi Minh", "Quảng Trị",
            "TP HCM", "Huế",
            "Sài Gòn", "Đà Nẵng",
            "Hồ Chí Minh", "Hà Nội",
            "Da Nang", "Hue",
            "Hanoi", "Da Nang"
        };
        
        for (String c : cases) {
            AirportResolver.ResolveResult r = resolver.resolve(c);
            System.out.println(c + " -> " + (r != null ? r.airportCode() + " (nearest: " + r.isNearest() + ")" : "null"));
        }
    }
}
