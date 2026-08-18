package com.travel.marketplace.modules.auth.service;

import com.travel.marketplace.exception.BadRequestException;
import com.travel.marketplace.exception.ErrorCode;
import com.travel.marketplace.modules.auth.dto.OtpGenerationResult;
import com.travel.marketplace.modules.auth.dto.SendOtpRequest;
import com.travel.marketplace.modules.auth.dto.VerifyOtpRequest;
import com.travel.marketplace.modules.auth.entity.OtpVerification;
import com.travel.marketplace.modules.auth.enums.OtpPurpose;
import com.travel.marketplace.modules.auth.repository.OtpVerificationRepository;
import com.travel.marketplace.modules.notification.dto.SendNotificationRequest;
import com.travel.marketplace.modules.notification.enums.NotificationType;
import com.travel.marketplace.modules.notification.service.NotificationPublisher;
import com.travel.marketplace.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpService {

    public static final int OTP_LENGTH = 6;

    @Value("${app.otp.expiration-seconds:60}")
    private long expirationSeconds = 60L;

    @Value("${app.otp.resend-cooldown-seconds:60}")
    private long resendCooldownSeconds = 60L;

    @Value("${app.otp.max-verification-attempts:5}")
    private int maxVerificationAttempts = 5;

    private final OtpVerificationRepository otpVerificationRepository;
    private final UserRepository userRepository;
    private final NotificationPublisher notificationPublisher;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();
    private Clock clock = Clock.systemUTC();

    void setClock(Clock clock) {
        this.clock = clock;
    }

    void setExpirationSeconds(long expirationSeconds) {
        this.expirationSeconds = expirationSeconds;
    }

    void setResendCooldownSeconds(long resendCooldownSeconds) {
        this.resendCooldownSeconds = resendCooldownSeconds;
    }

    void setMaxVerificationAttempts(int maxVerificationAttempts) {
        this.maxVerificationAttempts = maxVerificationAttempts;
    }

    /**
     * Orchestrates OTP sending: validates request/purpose, checks existing user accounts,
     * enforces server-side resend cooldown, invalidates prior active OTPs, generates and persists
     * hashed OTP, and dispatches the raw OTP via NotificationPublisher.
     *
     * @param request SendOtpRequest containing email and purpose
     */
    @Transactional
    public void sendOtp(SendOtpRequest request) {
        if (request == null) {
            throw new BadRequestException("Request body is required");
        }
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new BadRequestException("Email is required for OTP generation");
        }
        if (request.getPurpose() == null) {
            throw new BadRequestException("OTP purpose is required");
        }

        if (request.getPurpose() != OtpPurpose.REGISTER) {
            throw new BadRequestException("Only REGISTER purpose is supported at this time");
        }

        String normalizedEmail = normalizeEmail(request.getEmail());

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BadRequestException("Email is already registered", ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        Instant now = clock.instant();

        // 1. Server-side resend throttling check
        Optional<OtpVerification> latestOtp = otpVerificationRepository
                .findTopByEmailAndPurposeOrderByCreatedAtDesc(normalizedEmail, request.getPurpose());
        if (latestOtp.isPresent()) {
            Instant createdAt = latestOtp.get().getCreatedAt();
            if (createdAt != null) {
                Instant cooldownUntil = createdAt.plusSeconds(resendCooldownSeconds);
                if (now.isBefore(cooldownUntil)) {
                    throw new BadRequestException("Please wait before requesting another OTP.");
                }
            }
        }

        OtpGenerationResult generationResult = generateOtp(normalizedEmail, request.getPurpose());

        String emailContent = buildOtpEmailHtml(generationResult.getRawOtp());

        SendNotificationRequest notificationRequest = SendNotificationRequest.builder()
                .recipientEmail(normalizedEmail)
                .type(NotificationType.OTP_VERIFICATION)
                .title("Your AI Travel Marketplace verification code")
                .message(emailContent)
                .isHtml(true)
                .build();

        notificationPublisher.publish(notificationRequest);
        log.info("Dispatched OTP verification email for domain: {} [Purpose: {}]", 
                 extractDomain(normalizedEmail), request.getPurpose());
    }

    /**
     * Verifies user-provided OTP code against the latest persisted record for email + purpose.
     * Validates expiration, attempt count limits, consumed/verified state, and BCrypt hash match.
     * Increments attempt count on failure and invalidates record if max attempts exceeded.
     * Marks record as verified and consumed upon success.
     *
     * @param request VerifyOtpRequest containing email, purpose, and 6-digit code
     */
    @Transactional
    public void verifyOtp(VerifyOtpRequest request) {
        if (request == null) {
            throw new BadRequestException("Request body is required");
        }
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new BadRequestException("Email is required for OTP verification");
        }
        if (request.getPurpose() == null) {
            throw new BadRequestException("OTP purpose is required");
        }
        if (request.getPurpose() != OtpPurpose.REGISTER) {
            throw new BadRequestException("Only REGISTER purpose is supported at this time");
        }
        if (request.getCode() == null || !request.getCode().matches("^\\d{6}$")) {
            throw new BadRequestException("OTP code must be exactly 6 digits");
        }

        String normalizedEmail = normalizeEmail(request.getEmail());

        OtpVerification verification = otpVerificationRepository
                .findTopByEmailAndPurposeOrderByCreatedAtDesc(normalizedEmail, request.getPurpose())
                .orElseThrow(() -> new BadRequestException("Invalid or expired OTP"));

        Instant now = clock.instant();

        // 1. Check consumed/verified state
        if (verification.getConsumedAt() != null || verification.getVerifiedAt() != null) {
            throw new BadRequestException("Invalid or expired OTP");
        }

        // 2. Check expiration: now >= expiresAt -> expired
        if (!now.isBefore(verification.getExpiresAt())) {
            throw new BadRequestException("Invalid or expired OTP");
        }

        // 3. Check current attempt count against maximum
        int currentAttempts = verification.getAttemptCount() != null ? verification.getAttemptCount() : 0;
        if (currentAttempts >= maxVerificationAttempts) {
            throw new BadRequestException("Too many verification attempts. Please request a new OTP.");
        }

        // 4. Check BCrypt hash match
        if (!passwordEncoder.matches(request.getCode(), verification.getOtpHash())) {
            int newAttemptCount = currentAttempts + 1;
            verification.setAttemptCount(newAttemptCount);
            if (newAttemptCount >= maxVerificationAttempts) {
                verification.setConsumedAt(now);
                otpVerificationRepository.save(verification);
                throw new BadRequestException("Too many verification attempts. Please request a new OTP.");
            }
            otpVerificationRepository.save(verification);
            throw new BadRequestException("Invalid or expired OTP");
        }

        // 5. Update success state (replay protection)
        verification.setVerifiedAt(now);
        verification.setConsumedAt(now);

        otpVerificationRepository.save(verification);

        log.info("Successfully verified OTP for domain: {} [Purpose: {}]", 
                 extractDomain(normalizedEmail), request.getPurpose());
    }

    /**
     * Generates a secure 6-digit numeric OTP, hashes it using BCrypt,
     * invalidates any previous active unconsumed OTPs for the same email and purpose,
     * and persists the OtpVerification entity.
     *
     * @param rawEmail The recipient email address
     * @param purpose  The purpose of the OTP (e.g. REGISTER)
     * @return OtpGenerationResult containing the persisted entity and the raw OTP
     */
    @Transactional
    public OtpGenerationResult generateOtp(String rawEmail, OtpPurpose purpose) {
        if (rawEmail == null || rawEmail.isBlank()) {
            throw new BadRequestException("Email is required for OTP generation");
        }
        if (purpose == null) {
            throw new BadRequestException("OTP purpose is required");
        }

        String normalizedEmail = normalizeEmail(rawEmail);
        Instant now = clock.instant();

        // Invalidate previous unconsumed active OTPs for the same email and purpose
        List<OtpVerification> activeOtps = otpVerificationRepository
                .findByEmailAndPurposeAndConsumedAtIsNull(normalizedEmail, purpose);
        if (activeOtps != null && !activeOtps.isEmpty()) {
            for (OtpVerification activeOtp : activeOtps) {
                if (activeOtp.getVerifiedAt() == null) {
                    activeOtp.setConsumedAt(now);
                }
            }
            otpVerificationRepository.saveAll(activeOtps);
        }

        String rawOtp = generateSecureNumericCode(OTP_LENGTH);
        String otpHash = passwordEncoder.encode(rawOtp);

        Instant expiresAt = now.plusSeconds(expirationSeconds);

        OtpVerification verification = OtpVerification.builder()
                .email(normalizedEmail)
                .otpHash(otpHash)
                .purpose(purpose)
                .expiresAt(expiresAt)
                .verifiedAt(null)
                .consumedAt(null)
                .attemptCount(0)
                .createdAt(now)
                .build();

        OtpVerification saved = otpVerificationRepository.save(verification);

        log.info("Generated OTP for domain: {} [Purpose: {}]", extractDomain(normalizedEmail), purpose);

        return OtpGenerationResult.builder()
                .verification(saved)
                .rawOtp(rawOtp)
                .build();
    }

    private String buildOtpEmailHtml(String rawOtp) {
        return """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2 style="color: #0f172a; margin-top: 0; margin-bottom: 16px;">AI Travel Marketplace</h2>
                    <p style="color: #334155; font-size: 15px; line-height: 1.5;">Your verification code is:</p>
                    <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 16px 24px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0f172a; text-align: center; border-radius: 6px; margin: 24px 0;">
                        %s
                    </div>
                    <p style="color: #64748b; font-size: 13px; margin-bottom: 4px;">This code expires in 60 seconds.</p>
                    <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                        If you did not request this verification code, you can safely ignore this email.
                    </p>
                </div>
                """.formatted(rawOtp);
    }

    private String generateSecureNumericCode(int length) {
        int bound = (int) Math.pow(10, length);
        int code = secureRandom.nextInt(bound);
        return String.format("%0" + length + "d", code);
    }

    public String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private String extractDomain(String email) {
        if (email == null || !email.contains("@")) {
            return "unknown";
        }
        return email.substring(email.indexOf("@"));
    }
}
