package com.travel.marketplace.modules.payment.repository;

import com.travel.marketplace.modules.payment.entity.Settlement;
import com.travel.marketplace.modules.payment.enums.SettlementStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface SettlementRepository extends JpaRepository<Settlement, Long> {
    List<Settlement> findByProviderId(Long providerId);

    @Query("select coalesce(sum(s.platformFee), 0) from Settlement s where s.status = :status")
    BigDecimal sumPlatformFeeByStatus(SettlementStatus status);

    @Query("""
            select s.currency
            from Settlement s
            where s.status = :status
            group by s.currency
            order by count(s.id) desc
            """)
    List<String> findCurrenciesByStatus(SettlementStatus status);
}
