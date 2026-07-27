package com.travel.marketplace.modules.payment.service;

import com.travel.marketplace.modules.payment.dto.AiCoinCreditResult;
import com.travel.marketplace.modules.payment.entity.AiCoinTransaction;
import com.travel.marketplace.modules.payment.entity.UserAiCoinWallet;
import com.travel.marketplace.modules.payment.enums.AiCoinTransactionDirection;
import com.travel.marketplace.modules.payment.enums.AiCoinTransactionType;
import com.travel.marketplace.modules.payment.repository.AiCoinTransactionRepository;
import com.travel.marketplace.modules.payment.repository.UserAiCoinWalletRepository;
import com.travel.marketplace.modules.user.entity.User;
import com.travel.marketplace.modules.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiCoinWalletServiceTest {

    private final UserAiCoinWalletRepository walletRepository = mock(UserAiCoinWalletRepository.class);
    private final AiCoinTransactionRepository transactionRepository = mock(AiCoinTransactionRepository.class);
    private final UserRepository userRepository = mock(UserRepository.class);
    private final AiCoinWalletService service = new AiCoinWalletService(
            walletRepository,
            transactionRepository,
            userRepository
    );

    @Test
    void creditPurchaseWritesBaseAndBonusLedgerEntries() {
        User user = User.builder()
                .id(9L)
                .email("traveler@example.com")
                .password("secret")
                .fullName("Traveler")
                .aiCoinBalance(0)
                .build();
        UserAiCoinWallet wallet = UserAiCoinWallet.builder()
                .id(12L)
                .user(user)
                .balance(100L)
                .lifetimeEarned(100L)
                .build();

        when(transactionRepository.existsByIdempotencyKey("AI_COIN_PURCHASE:77:PURCHASE")).thenReturn(false);
        when(walletRepository.findByUserIdForUpdate(9L)).thenReturn(Optional.of(wallet));
        when(walletRepository.save(wallet)).thenReturn(wallet);

        AiCoinCreditResult result = service.creditPurchase(
                9L,
                77L,
                101L,
                500L,
                75L,
                "AI_COIN_PURCHASE:77"
        );

        ArgumentCaptor<AiCoinTransaction> transactionCaptor = ArgumentCaptor.forClass(AiCoinTransaction.class);
        verify(transactionRepository, times(2)).save(transactionCaptor.capture());
        List<AiCoinTransaction> transactions = transactionCaptor.getAllValues();

        assertThat(result.isDuplicate()).isFalse();
        assertThat(result.getCreditedAmount()).isEqualTo(575L);
        assertThat(result.getBalance()).isEqualTo(675L);
        assertThat(wallet.getBalance()).isEqualTo(675L);
        assertThat(wallet.getLifetimeEarned()).isEqualTo(675L);
        assertThat(user.getAiCoinBalance()).isEqualTo(675);
        assertThat(transactions).extracting(AiCoinTransaction::getType)
                .containsExactly(AiCoinTransactionType.PURCHASE, AiCoinTransactionType.BONUS);
        assertThat(transactions).extracting(AiCoinTransaction::getDirection)
                .containsOnly(AiCoinTransactionDirection.CREDIT);
        assertThat(transactions).extracting(AiCoinTransaction::getIdempotencyKey)
                .containsExactly("AI_COIN_PURCHASE:77:PURCHASE", "AI_COIN_PURCHASE:77:BONUS");
    }

    @Test
    void duplicateCreditDoesNotWriteLedgerAgain() {
        User user = User.builder()
                .id(9L)
                .email("traveler@example.com")
                .password("secret")
                .fullName("Traveler")
                .aiCoinBalance(575)
                .build();
        UserAiCoinWallet wallet = UserAiCoinWallet.builder()
                .id(12L)
                .user(user)
                .balance(575L)
                .lifetimeEarned(575L)
                .build();

        when(transactionRepository.existsByIdempotencyKey("AI_COIN_PURCHASE:77:PURCHASE")).thenReturn(true);
        when(walletRepository.findByUserIdForUpdate(9L)).thenReturn(Optional.of(wallet));

        AiCoinCreditResult result = service.creditPurchase(
                9L,
                77L,
                101L,
                500L,
                75L,
                "AI_COIN_PURCHASE:77"
        );

        assertThat(result.isDuplicate()).isTrue();
        assertThat(result.getCreditedAmount()).isZero();
        assertThat(result.getBalance()).isEqualTo(575L);
        verify(transactionRepository, never()).save(any());
        verify(walletRepository, never()).save(any());
    }
}
