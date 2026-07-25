package com.travel.marketplace.modules.payment.catalog;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Optional;

public class AiCoinPackageCatalog {

    @Getter
    @AllArgsConstructor
    public enum PackageDef {
        STARTER("starter", "STARTER", 200, 20, new BigDecimal("29000")),
        EXPLORER("explorer", "EXPLORER", 500, 75, new BigDecimal("59000")),
        TRAVELER("traveler", "TRAVELER", 1000, 200, new BigDecimal("99000")),
        ADVENTURE("adventure", "ADVENTURE", 2500, 500, new BigDecimal("249000")),
        PRO("pro", "PRO", 5000, 1250, new BigDecimal("449000")),
        ELITE("elite", "ELITE", 10000, 3000, new BigDecimal("799000")),
        MEGA("mega", "MEGA", 20000, 6000, new BigDecimal("1399000")),
        ULTIMATE("ultimate", "ULTIMATE", 50000, 17500, new BigDecimal("2999000")),
        GALAXY("galaxy", "GALAXY", 100000, 40000, new BigDecimal("5999000")),
        DAILY_PASS("daily-pass", "DAILY_PASS", 3000, 0, new BigDecimal("90000"));

        private final String id;
        private final String code;
        private final int baseCoins;
        private final int bonusCoins;
        private final BigDecimal price;

        public int getTotalCoins() {
            return baseCoins + bonusCoins;
        }
    }

    public static Optional<PackageDef> getPackageById(String id) {
        return Arrays.stream(PackageDef.values())
                .filter(p -> p.getId().equals(id))
                .findFirst();
    }
}
