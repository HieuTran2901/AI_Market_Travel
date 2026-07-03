package com.travel.marketplace.modules.provider.service;

import com.travel.marketplace.exception.BadRequestException;
import com.travel.marketplace.exception.ErrorCode;
import com.travel.marketplace.exception.ResourceNotFoundException;
import com.travel.marketplace.modules.provider.dto.ProviderMapper;
import com.travel.marketplace.modules.provider.dto.ProviderProfileResponse;
import com.travel.marketplace.modules.provider.dto.ProviderRegisterRequest;
import com.travel.marketplace.modules.provider.dto.ProviderUpdateRequest;
import com.travel.marketplace.modules.provider.enums.BusinessType;
import com.travel.marketplace.modules.provider.enums.VerificationStatus;
import com.travel.marketplace.modules.user.entity.ProviderProfile;
import com.travel.marketplace.modules.user.entity.Role;
import com.travel.marketplace.modules.user.entity.User;
import com.travel.marketplace.modules.user.repository.ProviderProfileRepository;
import com.travel.marketplace.modules.user.repository.RoleRepository;
import com.travel.marketplace.modules.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class ProviderServiceImpl implements ProviderService {

    private static final Logger log = LoggerFactory.getLogger(ProviderServiceImpl.class);

    private final ProviderProfileRepository providerProfileRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final ProviderMapper providerMapper;

    public ProviderServiceImpl(
            ProviderProfileRepository providerProfileRepository,
            UserRepository userRepository,
            RoleRepository roleRepository,
            ProviderMapper providerMapper
    ) {
        this.providerProfileRepository = providerProfileRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.providerMapper = providerMapper;
    }

    @Override
    @Transactional
    public ProviderProfileResponse registerAsProvider(String userEmail, ProviderRegisterRequest request) {
        User user = getUserByEmail(userEmail);

        if (providerProfileRepository.existsByUserId(user.getId())) {
            throw new BadRequestException("You already have a provider profile registered");
        }

        BusinessType businessType = parseBusinessType(request.getBusinessType());

        // Assign provider role to the user
        Role providerRole = roleRepository.findByName(businessType.toRoleName())
                .orElseThrow(() -> new BadRequestException("Provider role not found: " + businessType));
        user.getRoles().add(providerRole);
        userRepository.save(user);

        ProviderProfile profile = ProviderProfile.builder()
                .user(user)
                .businessName(request.getBusinessName())
                .businessType(businessType)
                .description(request.getDescription())
                .address(request.getAddress())
                .city(request.getCity())
                .country(request.getCountry() != null ? request.getCountry() : "Vietnam")
                .phone(request.getPhone())
                .website(request.getWebsite())
                .taxCode(request.getTaxCode())
                .bankName(request.getBankName())
                .bankAccountNumber(request.getBankAccountNumber())
                .bankAccountName(request.getBankAccountName())
                .verificationStatus(VerificationStatus.PENDING)
                .build();

        ProviderProfile saved = providerProfileRepository.save(profile);
        log.info("Provider profile created for user: {} (type: {})", userEmail, businessType);
        return providerMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public ProviderProfileResponse getMyProfile(String userEmail) {
        User user = getUserByEmail(userEmail);
        ProviderProfile profile = getProfileByUserId(user.getId());
        return providerMapper.toResponse(profile);
    }

    @Override
    @Transactional
    public ProviderProfileResponse updateMyProfile(String userEmail, ProviderUpdateRequest request) {
        User user = getUserByEmail(userEmail);
        ProviderProfile profile = getProfileByUserId(user.getId());

        // Apply non-null updates (partial update pattern)
        if (request.getBusinessName() != null) profile.setBusinessName(request.getBusinessName());
        if (request.getDescription() != null)  profile.setDescription(request.getDescription());
        if (request.getAddress() != null)       profile.setAddress(request.getAddress());
        if (request.getCity() != null)          profile.setCity(request.getCity());
        if (request.getCountry() != null)       profile.setCountry(request.getCountry());
        if (request.getPhone() != null)         profile.setPhone(request.getPhone());
        if (request.getWebsite() != null)       profile.setWebsite(request.getWebsite());
        if (request.getTaxCode() != null)       profile.setTaxCode(request.getTaxCode());
        if (request.getBankName() != null)      profile.setBankName(request.getBankName());
        if (request.getBankAccountNumber() != null) profile.setBankAccountNumber(request.getBankAccountNumber());
        if (request.getBankAccountName() != null)   profile.setBankAccountName(request.getBankAccountName());

        ProviderProfile updated = providerProfileRepository.save(profile);
        log.info("Provider profile updated for user: {}", userEmail);
        return providerMapper.toResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public ProviderProfileResponse getPublicProfile(Long providerId) {
        ProviderProfile profile = providerProfileRepository.findById(providerId)
                .orElseThrow(() -> new ResourceNotFoundException("Provider not found with id: " + providerId));

        // Only expose public info for non-approved providers
        ProviderProfileResponse full = providerMapper.toResponse(profile);
        return ProviderProfileResponse.publicView(full);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProviderProfileResponse> getAllProviders(Pageable pageable) {
        return providerProfileRepository.findAll(pageable)
                .map(providerMapper::toResponse);
    }

    @Override
    @Transactional
    public ProviderProfileResponse approveProvider(Long providerId) {
        ProviderProfile profile = getProfileById(providerId);
        profile.setVerificationStatus(VerificationStatus.APPROVED);
        profile.setRejectionReason(null);
        ProviderProfile saved = providerProfileRepository.save(profile);
        log.info("Provider approved: id={}, business={}", providerId, profile.getBusinessName());
        return providerMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public ProviderProfileResponse rejectProvider(Long providerId, String reason) {
        if (reason == null || reason.isBlank()) {
            throw new BadRequestException("Rejection reason is required");
        }
        ProviderProfile profile = getProfileById(providerId);
        profile.setVerificationStatus(VerificationStatus.REJECTED);
        profile.setRejectionReason(reason);
        ProviderProfile saved = providerProfileRepository.save(profile);
        log.info("Provider rejected: id={}, reason={}", providerId, reason);
        return providerMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public ProviderProfileResponse suspendProvider(Long providerId, String reason) {
        ProviderProfile profile = getProfileById(providerId);
        profile.setVerificationStatus(VerificationStatus.SUSPENDED);
        if (reason != null && !reason.isBlank()) {
            profile.setRejectionReason(reason);
        }
        ProviderProfile saved = providerProfileRepository.save(profile);
        log.info("Provider suspended: id={}", providerId);
        return providerMapper.toResponse(saved);
    }

    // ── Private helpers ──────────────────────────────────────────

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private ProviderProfile getProfileByUserId(Long userId) {
        return providerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No provider profile found. Please register as a provider first."));
    }

    private ProviderProfile getProfileById(Long id) {
        return providerProfileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Provider not found with id: " + id));
    }

    private BusinessType parseBusinessType(String value) {
        try {
            return BusinessType.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid business type: " + value
                    + ". Must be one of: HOTEL, TOUR, RESTAURANT, VEHICLE, EXPERIENCE");
        }
    }
}
