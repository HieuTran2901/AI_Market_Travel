package com.travel.marketplace.modules.ai.flight.util;

import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;

@Component
public class AirportResolver {

    public record NearestAirport(String code, String name) {}

    public record ResolveResult(String airportCode, String nearestAirportName, String originalRequestedCity, boolean isNearest) {
        public static ResolveResult exact(String airportCode, String originalRequestedCity) {
            return new ResolveResult(airportCode, null, originalRequestedCity, false);
        }
        public static ResolveResult nearest(String airportCode, String nearestAirportName, String originalRequestedCity) {
            return new ResolveResult(airportCode, nearestAirportName, originalRequestedCity, true);
        }
    }

    private final Map<String, String> cityToAirportMap;
    private final Map<String, NearestAirport> cityToNearestAirportMap;

    public AirportResolver() {
        cityToAirportMap = new HashMap<>();
        cityToNearestAirportMap = new HashMap<>();
        
        // Exact airports and aliases
        cityToAirportMap.put("ho chi minh", "SGN");
        cityToAirportMap.put("hcmc", "SGN");
        cityToAirportMap.put("hcm", "SGN");
        cityToAirportMap.put("sai gon", "SGN");
        cityToAirportMap.put("ho chi minh city", "SGN");
        cityToAirportMap.put("tphcm", "SGN");
        cityToAirportMap.put("tp hcm", "SGN");
        cityToAirportMap.put("tp.hcm", "SGN");
        cityToAirportMap.put("tp. hcm", "SGN");
        cityToAirportMap.put("thanh pho ho chi minh", "SGN");

        cityToAirportMap.put("ha noi", "HAN");
        cityToAirportMap.put("hanoi", "HAN");
        cityToAirportMap.put("thu do ha noi", "HAN");
        cityToAirportMap.put("hn", "HAN");

        cityToAirportMap.put("da nang", "DAD");
        cityToAirportMap.put("danang", "DAD");
        cityToAirportMap.put("tp da nang", "DAD");

        cityToAirportMap.put("nha trang", "CXR");
        cityToAirportMap.put("cam ranh", "CXR");
        cityToAirportMap.put("phu quoc", "PQC");
        cityToAirportMap.put("da lat", "DLI");
        cityToAirportMap.put("dalat", "DLI");
        cityToAirportMap.put("hue", "HUI");
        cityToAirportMap.put("hai phong", "HPH");
        cityToAirportMap.put("can tho", "VCA");
        cityToAirportMap.put("quy nhon", "UIH");
        cityToAirportMap.put("vinh", "VII");
        cityToAirportMap.put("dong hoi", "VDH");
        cityToAirportMap.put("chu lai", "VCL");
        cityToAirportMap.put("tuy hoa", "TBB");
        cityToAirportMap.put("rach gia", "VKG");
        cityToAirportMap.put("ca mau", "CAH");
        cityToAirportMap.put("con dao", "VCS");
        cityToAirportMap.put("dien bien phu", "DIN");
        cityToAirportMap.put("dien bien", "DIN");
        
        // Added missing primary airports
        cityToAirportMap.put("pleiku", "PXU");
        cityToAirportMap.put("thanh hoa", "THD");
        cityToAirportMap.put("van don", "VDO");

        // Nearest airports for destinations without airports
        cityToNearestAirportMap.put("quang tri", new NearestAirport("HUI", "Huế"));
        cityToNearestAirportMap.put("kon tum", new NearestAirport("PXU", "Pleiku"));
        cityToNearestAirportMap.put("gia lai", new NearestAirport("PXU", "Pleiku"));
        cityToNearestAirportMap.put("quang ngai", new NearestAirport("VCL", "Chu Lai"));
        cityToNearestAirportMap.put("quang nam", new NearestAirport("VCL", "Chu Lai"));
        cityToNearestAirportMap.put("ninh binh", new NearestAirport("THD", "Thanh Hóa"));
        cityToNearestAirportMap.put("sapa", new NearestAirport("HAN", "Hà Nội"));
        cityToNearestAirportMap.put("lao cai", new NearestAirport("HAN", "Hà Nội"));
        cityToNearestAirportMap.put("ha long", new NearestAirport("VDO", "Vân Đồn"));
        cityToNearestAirportMap.put("quang ninh", new NearestAirport("VDO", "Vân Đồn"));
        cityToNearestAirportMap.put("vung tau", new NearestAirport("SGN", "TP. Hồ Chí Minh"));
        cityToNearestAirportMap.put("phan thiet", new NearestAirport("SGN", "TP. Hồ Chí Minh"));
        cityToNearestAirportMap.put("binh thuan", new NearestAirport("SGN", "TP. Hồ Chí Minh"));
        cityToNearestAirportMap.put("ninh thuan", new NearestAirport("CXR", "Cam Ranh"));
        cityToNearestAirportMap.put("phan rang", new NearestAirport("CXR", "Cam Ranh"));
    }

    public ResolveResult resolve(String location) {
        if (location == null || location.isBlank()) {
            return null;
        }

        String normalized = removeAccents(location).toLowerCase().trim();
        normalized = normalized.replaceAll("^(thanh pho|tp\\.?|tinh)\\s+", "").trim();
        
        // Exact match
        String exactCode = cityToAirportMap.get(normalized);
        if (exactCode != null) {
            return ResolveResult.exact(exactCode, location);
        }
        
        // Nearest match
        NearestAirport nearest = cityToNearestAirportMap.get(normalized);
        if (nearest != null) {
            return ResolveResult.nearest(nearest.code(), nearest.name(), location);
        }
        
        // If it's already an IATA code and not a known city
        if (location.trim().length() == 3 && location.matches("^[a-zA-Z]{3}$")) {
            return ResolveResult.exact(location.toUpperCase(), location);
        }
        
        return null;
    }

    private String removeAccents(String text) {
        if (text == null) return null;
        String nfdNormalizedString = Normalizer.normalize(text, Normalizer.Form.NFD);
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        return pattern.matcher(nfdNormalizedString).replaceAll("").replace('đ', 'd').replace('Đ', 'D');
    }
}
