package com.travel.marketplace.modules.auth.repository;

import com.travel.marketplace.modules.auth.entity.OtpVerification;
import com.travel.marketplace.modules.auth.enums.OtpPurpose;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {

    Optional<OtpVerification> findTopByEmailAndPurposeOrderByCreatedAtDesc(String email, OtpPurpose purpose);

    List<OtpVerification> findByEmailAndPurpose(String email, OtpPurpose purpose);

    List<OtpVerification> findByEmailAndPurposeAndConsumedAtIsNull(String email, OtpPurpose purpose);
}
