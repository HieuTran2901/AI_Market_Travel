package com.travel.marketplace.modules.ai.shared;

import java.text.Normalizer;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

public final class DestinationNormalizer {

    private static final Pattern DIACRITICS = Pattern.compile("\\p{M}+");
    private static final Map<String, String> CANONICAL = Map.ofEntries(
            Map.entry("da nang", "Da Nang"),
            Map.entry("danang", "Da Nang"),
            Map.entry("da nang city", "Da Nang"),
            Map.entry("da nang vietnam", "Da Nang"),
            Map.entry("da nang viet nam", "Da Nang"),
            Map.entry("ha noi", "Ha Noi"),
            Map.entry("hanoi", "Ha Noi"),
            Map.entry("hanoi city", "Ha Noi"),
            Map.entry("ha noi vietnam", "Ha Noi"),
            Map.entry("ha noi viet nam", "Ha Noi"),
            Map.entry("hanoi vietnam", "Ha Noi"),
            Map.entry("ho chi minh", "Ho Chi Minh City"),
            Map.entry("ho chi minh city", "Ho Chi Minh City"),
            Map.entry("hcmc", "Ho Chi Minh City"),
            Map.entry("saigon", "Ho Chi Minh City"),
            Map.entry("da lat", "Da Lat"),
            Map.entry("dalat", "Da Lat"),
            Map.entry("phu quoc", "Phu Quoc"),
            Map.entry("phu quoc vietnam", "Phu Quoc"),
            Map.entry("hoi an", "Hoi An"),
            Map.entry("hoian", "Hoi An"),
            Map.entry("hoi an ancient town", "Hoi An"),
            Map.entry("hue", "Hue"),
            Map.entry("nha trang", "Nha Trang")
    );

    private DestinationNormalizer() {
    }

    public static String canonicalize(String destination) {
        String key = key(destination);
        if (key.isBlank()) {
            return destination;
        }
        return CANONICAL.getOrDefault(key, titleCase(key));
    }

    public static Set<String> aliases(String destination) {
        String canonical = canonicalize(destination);
        String key = key(canonical);
        Set<String> aliases = new LinkedHashSet<>();
        if (destination != null && !destination.isBlank()) {
            aliases.add(destination.trim());
        }
        if (canonical != null && !canonical.isBlank()) {
            aliases.add(canonical);
        }
        switch (key) {
            case "da nang" -> {
                aliases.add("Da Nang");
                aliases.add("\u0110\u00e0 N\u1eb5ng");
                aliases.add("Danang");
                aliases.add("Da Nang City");
                aliases.add("Da Nang, Vietnam");
            }
            case "ha noi" -> {
                aliases.add("Ha Noi");
                aliases.add("Hanoi");
                aliases.add("H\u00e0 N\u1ed9i");
                aliases.add("Hanoi City");
                aliases.add("Hanoi, Vietnam");
            }
            case "ho chi minh city" -> {
                aliases.add("Ho Chi Minh");
                aliases.add("Ho Chi Minh City");
                aliases.add("HCMC");
                aliases.add("Saigon");
            }
            case "da lat" -> {
                aliases.add("Da Lat");
                aliases.add("Dalat");
            }
            case "hoi an" -> {
                aliases.add("Hoi An");
                aliases.add("Hoi An Ancient Town");
            }
            default -> {
                // Keep the destination and canonical aliases already added above.
            }
        }
        return aliases;
    }

    public static String key(String value) {
        if (value == null) {
            return "";
        }
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replace('\u0110', 'D')
                .replace('\u0111', 'd');
        normalized = DIACRITICS.matcher(normalized).replaceAll("");
        return normalized.toLowerCase(Locale.ROOT)
                .replaceAll("\\b(vietnam|viet nam)\\b", "")
                .replaceAll("[^a-z0-9]+", " ")
                .trim()
                .replaceAll("\\s+", " ");
    }

    private static String titleCase(String value) {
        String[] words = value.split("\\s+");
        StringBuilder result = new StringBuilder();
        for (String word : words) {
            if (word.isBlank()) {
                continue;
            }
            if (!result.isEmpty()) {
                result.append(' ');
            }
            result.append(Character.toUpperCase(word.charAt(0)));
            if (word.length() > 1) {
                result.append(word.substring(1));
            }
        }
        return result.toString();
    }
}
