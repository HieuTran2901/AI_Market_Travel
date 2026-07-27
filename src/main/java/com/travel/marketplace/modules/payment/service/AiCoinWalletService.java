package com.travel.marketplace.modules.payment.service;

import com.travel.marketplace.exception.BusinessException;
import com.travel.marketplace.exception.ErrorCode;
import com.travel.marketplace.modules.payment.dto.AiCoinCreditResult;
import com.travel.marketplace.modules.payment.dto.AiCoinTransactionResponse;
import com.travel.marketplace.modules.payment.dto.AiCoinWalletResponse;
import com.travel.marketplace.modules.payment.entity.AiCoinTransaction;
import com.travel.marketplace.modules.payment.entity.UserAiCoinWallet;
import com.travel.marketplace.modules.payment.enums.AiCoinTransactionDirection;
import com.travel.marketplace.modules.payment.enums.AiCoinTransactionType;
import com.travel.marketplace.modules.payment.repository.AiCoinTransactionRepository;
import com.travel.marketplace.modules.payment.repository.UserAiCoinWalletRepository;
import com.travel.marketplace.modules.user.entity.User;
import com.travel.marketplace.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiCoinWalletService {

    private static final String PURCHASE_SOURCE_TYPE = "AI_COIN_PURCHASE";

    private final UserAiCoinWalletRepository walletRepository;
    private final AiCoinTransactionRepository transactionRepository;
    private final UserRepository userRepository;

    @Transactional
    public AiCoinWalletResponse getBalance(Long userId) {
        UserAiCoinWallet wallet = getOrCreateWalletForUpdate(userId);
        return toWalletResponse(wallet);
    }

    @Transactional(readOnly = true)
    public Page<AiCoinTransactionResponse> getTransactions(Long userId, Pageable pageable) {
        return transactionRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::toTransactionResponse);
    }

    @Transactional
    public AiCoinCreditResult creditPurchase(
            Long userId,
            Long paymentId,
            Long purchaseId,
            long baseCoins,
            long bonusCoins,
            String idempotencyKey
    ) {
        if (userId == null || paymentId == null || purchaseId == null || idempotencyKey == null || idempotencyKey.isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "AI_COIN_CREDIT_INVALID");
        }
        if (baseCoins < 0 || bonusCoins < 0 || baseCoins + bonusCoins <= 0) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "AI_COIN_CREDIT_INVALID");
        }

        String purchaseLedgerKey = idempotencyKey + ":PURCHASE";
        if (transactionRepository.existsByIdempotencyKey(purchaseLedgerKey)) {
            UserAiCoinWallet wallet = getOrCreateWalletForUpdate(userId);
            return AiCoinCreditResult.builder()
                    .balance(wallet.getBalance())
                    .creditedAmount(0L)
                    .duplicate(true)
                    .build();
        }

        UserAiCoinWallet wallet = getOrCreateWalletForUpdate(userId);
        long balanceBefore = wallet.getBalance();

        try {
            if (baseCoins > 0) {
                credit(wallet, AiCoinTransactionType.PURCHASE, baseCoins, paymentId, purchaseId, purchaseLedgerKey,
                        "AI Coin package purchase");
            }
            if (bonusCoins > 0) {
                credit(wallet, AiCoinTransactionType.BONUS, bonusCoins, paymentId, purchaseId, idempotencyKey + ":BONUS",
                        "Package bonus coins");
            }
            wallet.setLifetimeEarned(wallet.getLifetimeEarned() + baseCoins + bonusCoins);
            wallet = walletRepository.save(wallet);

            // Keep the legacy user column synchronized while the new wallet table is the authoritative source.
            User user = wallet.getUser();
            long boundedBalance = Math.min(Integer.MAX_VALUE, wallet.getBalance());
            user.setAiCoinBalance((int) boundedBalance);
            userRepository.save(user);

            log.info(
                    "Credited AI Coins wallet: userId={} walletId={} paymentId={} purchaseId={} baseCoins={} bonusCoins={} balanceBefore={} balanceAfter={}",
                    userId,
                    wallet.getId(),
                    paymentId,
                    purchaseId,
                    baseCoins,
                    bonusCoins,
                    balanceBefore,
                    wallet.getBalance()
            );

            return AiCoinCreditResult.builder()
                    .balance(wallet.getBalance())
                    .creditedAmount(baseCoins + bonusCoins)
                    .duplicate(false)
                    .build();
        } catch (DataIntegrityViolationException exception) {
            UserAiCoinWallet currentWallet = getOrCreateWalletForUpdate(userId);
            log.info("Duplicate AI Coin credit ignored: userId={} paymentId={} purchaseId={}", userId, paymentId, purchaseId);
            return AiCoinCreditResult.builder()
                    .balance(currentWallet.getBalance())
                    .creditedAmount(0L)
                    .duplicate(true)
                    .build();
        }
    }

    private void credit(
            UserAiCoinWallet wallet,
            AiCoinTransactionType type,
            long amount,
            Long paymentId,
            Long purchaseId,
            String ledgerIdempotencyKey,
            String description
    ) {
        long before = wallet.getBalance();
        long after = before + amount;
        wallet.setBalance(after);

        transactionRepository.save(AiCoinTransaction.builder()
                .userId(wallet.getUser().getId())
                .walletId(wallet.getId())
                .type(type)
                .direction(AiCoinTransactionDirection.CREDIT)
                .amount(amount)
                .balanceBefore(before)
                .balanceAfter(after)
                .sourceType(PURCHASE_SOURCE_TYPE)
                .sourceId(purchaseId)
                .paymentId(paymentId)
                .purchaseId(purchaseId)
                .reference("PAY-" + paymentId)
                .description(description)
                .idempotencyKey(ledgerIdempotencyKey)
                .build());
    }

    private UserAiCoinWallet getOrCreateWalletForUpdate(Long userId) {
        return walletRepository.findByUserIdForUpdate(userId)
                .orElseGet(() -> createWallet(userId));
    }

    private UserAiCoinWallet createWallet(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "USER_NOT_FOUND"));
        long initialBalance = user.getAiCoinBalance() == null ? 0L : Math.max(0L, user.getAiCoinBalance().longValue());
        UserAiCoinWallet wallet = UserAiCoinWallet.builder()
                .user(user)
                .balance(initialBalance)
                .lifetimeEarned(initialBalance)
                .lifetimeSpent(0L)
                .build();
        return walletRepository.saveAndFlush(wallet);
    }

    private AiCoinWalletResponse toWalletResponse(UserAiCoinWallet wallet) {
        return AiCoinWalletResponse.builder()
                .balance(wallet.getBalance())
                .lifetimeEarned(wallet.getLifetimeEarned())
                .lifetimeSpent(wallet.getLifetimeSpent())
                .updatedAt(wallet.getUpdatedAt())
                .build();
    }

    private AiCoinTransactionResponse toTransactionResponse(AiCoinTransaction transaction) {
        return AiCoinTransactionResponse.builder()
                .id(transaction.getId())
                .type(transaction.getType())
                .direction(transaction.getDirection())
                .amount(transaction.getAmount())
                .balanceAfter(transaction.getBalanceAfter())
                .reference(transaction.getReference())
                .description(transaction.getDescription())
                .createdAt(transaction.getCreatedAt())
                .build();
    }
}
