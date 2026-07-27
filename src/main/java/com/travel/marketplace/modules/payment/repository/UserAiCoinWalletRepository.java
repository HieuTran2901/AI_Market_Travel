package com.travel.marketplace.modules.payment.repository;

import com.travel.marketplace.modules.payment.entity.UserAiCoinWallet;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserAiCoinWalletRepository extends JpaRepository<UserAiCoinWallet, Long> {

    Optional<UserAiCoinWallet> findByUserId(Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT wallet FROM UserAiCoinWallet wallet WHERE wallet.user.id = :userId")
    Optional<UserAiCoinWallet> findByUserIdForUpdate(@Param("userId") Long userId);
}
