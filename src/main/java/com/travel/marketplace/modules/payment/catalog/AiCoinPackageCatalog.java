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
        STARTER("pack_1", "STARTER", 200, 20, new BigDecimal("29000")),
        EXPLORER("pack_2", "EXPLORER", 500, 75, new BigDecimal("59000")),
        TRAVELER("pack_3", "TRAVELER", 1000, 200, new BigDecimal("99000")),
        ADVENTURE("pack_4", "ADVENTURE", 2500, 500, new BigDecimal("249000")),
        PRO("pack_5", "PRO", 5000, 1250, new BigDecimal("449000"));

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
