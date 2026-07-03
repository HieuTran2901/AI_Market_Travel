package com.travel.marketplace.modules.payment.service;

import com.travel.marketplace.exception.BusinessException;
import com.travel.marketplace.exception.ErrorCode;
import com.travel.marketplace.modules.payment.entity.Settlement;
import com.travel.marketplace.modules.payment.enums.SettlementStatus;
import com.travel.marketplace.modules.payment.repository.SettlementRepository;
import com.travel.marketplace.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SettlementServiceImpl implements SettlementService {

    private final SettlementRepository settlementRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public Settlement createSettlement(Long providerId, BigDecimal grossAmount, BigDecimal platformFee, BigDecimal taxAmount, Instant periodStart, Instant periodEnd) {
        BigDecimal providerAmount = grossAmount.subtract(platformFee).subtract(taxAmount);

        Settlement settlement = Settlement.builder()
                .provider(userRepository.getReferenceById(providerId))
                .grossAmount(grossAmount)
                .platformFee(platformFee)
                .taxAmount(taxAmount)
                .providerAmount(providerAmount)
                .amount(providerAmount) // Keep legacy amount field in sync
                .currency("USD")
                .status(SettlementStatus.PENDING)
                .periodStart(periodStart)
                .periodEnd(periodEnd)
                .build();

        return settlementRepository.save(settlement);
    }

    @Override
    @Transactional
    public Settlement processSettlement(Long settlementId) {
        Settlement settlement = getById(settlementId);
        settlement.setStatus(SettlementStatus.PROCESSING);
        return settlementRepository.save(settlement);
    }

    @Override
    @Transactional
    public Settlement completeSettlement(Long settlementId) {
        Settlement settlement = getById(settlementId);
        settlement.setStatus(SettlementStatus.COMPLETED);
        settlement = settlementRepository.save(settlement);
        
        // Future domain event: eventPublisher.publishEvent(new SettlementCompletedEvent(settlement.getId()));
        
        return settlement;
    }

    @Override
    @Transactional
    public Settlement failSettlement(Long settlementId) {
        Settlement settlement = getById(settlementId);
        settlement.setStatus(SettlementStatus.FAILED);
        return settlementRepository.save(settlement);
    }

    @Override
    @Transactional
    public Settlement cancelSettlement(Long settlementId) {
        Settlement settlement = getById(settlementId);
        settlement.setStatus(SettlementStatus.CANCELLED);
        return settlementRepository.save(settlement);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Settlement> getSettlementsByProvider(Long providerId) {
        return settlementRepository.findByProviderId(providerId);
    }

    private Settlement getById(Long id) {
        return settlementRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Settlement not found"));
    }
}
