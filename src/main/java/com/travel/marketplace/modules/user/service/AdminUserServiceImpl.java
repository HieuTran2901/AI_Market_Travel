package com.travel.marketplace.modules.user.service;

import com.travel.marketplace.modules.booking.repository.BookingRepository;
import com.travel.marketplace.exception.BusinessException;
import com.travel.marketplace.exception.ErrorCode;
import com.travel.marketplace.modules.provider.enums.VerificationStatus;
import com.travel.marketplace.modules.user.dto.AdminUserResponse;
import com.travel.marketplace.modules.user.dto.AdminUserSearchRequest;
import com.travel.marketplace.modules.user.dto.AdminUserStatisticsResponse;
import com.travel.marketplace.modules.user.dto.BanUserRequest;
import com.travel.marketplace.modules.user.entity.Role;
import com.travel.marketplace.modules.user.entity.User;
import com.travel.marketplace.modules.user.repository.UserRepository;
import com.travel.marketplace.modules.user.repository.UserSpecification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AdminUserServiceImpl implements AdminUserService {

    private static final Set<String> SORT_ALLOWLIST = Set.of("id", "fullName", "email", "createdAt", "updatedAt");

    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;

    public AdminUserServiceImpl(UserRepository userRepository, BookingRepository bookingRepository) {
        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AdminUserResponse> getUsers(AdminUserSearchRequest request, int page, int size, String sort) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), resolveSort(sort));
        Page<User> users = userRepository.findAll(UserSpecification.filterBy(request), pageable);
        List<Long> userIds = users.getContent().stream().map(User::getId).toList();
        Map<Long, Long> bookingCounts = loadBookingCounts(userIds);
        return users.map(user -> toResponse(user, bookingCounts.getOrDefault(user.getId(), 0L)));
    }

    @Override
    @Transactional(readOnly = true)
    public AdminUserStatisticsResponse getStatistics() {
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByIsActiveTrue();
        long newUsers = userRepository.countByCreatedAtGreaterThanEqual(Instant.now().minus(30, ChronoUnit.DAYS));
        long verifiedUsers = userRepository.countVerifiedUsers();
        long bannedUsers = userRepository.countByBannedAtIsNotNull();
        long customers = userRepository.countByRoleName("ROLE_CUSTOMER");
        long admins = userRepository.countByRoleName("ROLE_ADMIN");
        long providers = userRepository.countProviders();

        return new AdminUserStatisticsResponse(
                totalUsers,
                activeUsers,
                newUsers,
                verifiedUsers,
                bannedUsers,
                customers,
                providers,
                admins
        );
    }

    @Override
    @Transactional
    public AdminUserResponse banUser(Long userId, Long adminUserId, BanUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND, "User not found"));

        if (user.getId().equals(adminUserId)) {
            throw new BusinessException(ErrorCode.CANNOT_BAN_SELF, "You cannot ban your own account.");
        }
        if (user.getBannedAt() != null) {
            throw new BusinessException(ErrorCode.USER_ALREADY_BANNED, "This user is already banned.");
        }
        if (isBlank(request.reasonCode()) || isBlank(request.reason())) {
            throw new BusinessException(ErrorCode.BAN_REASON_REQUIRED, "Please provide a ban reason.");
        }
        if (hasRole(user, "ROLE_ADMIN") && userRepository.countActiveAdmins() <= 1) {
            throw new BusinessException(ErrorCode.CANNOT_BAN_LAST_ADMIN, "You cannot ban the last active admin account.");
        }

        user.setPreviousStatus(resolveStatus(user));
        user.setActive(false);
        user.setBannedAt(Instant.now());
        user.setBannedBy(adminUserId);
        user.setBanReasonCode(request.reasonCode().trim());
        user.setBanReason(request.reason().trim());

        User saved = userRepository.save(user);
        return toResponse(saved, 0L);
    }

    @Override
    @Transactional
    public AdminUserResponse unbanUser(Long userId, Long adminUserId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND, "User not found"));

        if (user.getBannedAt() == null) {
            throw new BusinessException(ErrorCode.USER_NOT_BANNED, "This user is not banned.");
        }

        boolean restoreActive = user.getPreviousStatus() == null || !"INACTIVE".equalsIgnoreCase(user.getPreviousStatus());
        user.setActive(restoreActive);
        user.setBannedAt(null);
        user.setBannedBy(null);
        user.setBanReasonCode(null);
        user.setBanReason(null);
        user.setPreviousStatus(null);

        User saved = userRepository.save(user);
        return toResponse(saved, 0L);
    }

    private Map<Long, Long> loadBookingCounts(List<Long> userIds) {
        if (userIds.isEmpty()) {
            return Map.of();
        }

        return bookingRepository.countBookingsByUserIds(userIds).stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> (Long) row[1],
                        Long::sum
                ));
    }

    private AdminUserResponse toResponse(User user, long bookingCount) {
        List<String> roles = user.getRoles().stream()
                .map(Role::getName)
                .sorted()
                .toList();

        return new AdminUserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getAvatarUrl(),
                roles,
                resolvePrimaryRole(user),
                resolveStatus(user),
                user.getBannedAt() != null,
                user.getBannedAt(),
                user.getBanReasonCode(),
                user.getBanReason(),
                isVerified(user),
                user.getCreatedAt(),
                user.getUpdatedAt(),
                bookingCount
        );
    }

    private Sort resolveSort(String sort) {
        String property = "createdAt";
        Sort.Direction direction = Sort.Direction.DESC;

        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",", 2);
            if (parts.length > 0 && SORT_ALLOWLIST.contains(parts[0])) {
                property = parts[0];
            }
            if (parts.length > 1 && "asc".equalsIgnoreCase(parts[1])) {
                direction = Sort.Direction.ASC;
            }
        }

        return Sort.by(direction, property);
    }

    private String resolvePrimaryRole(User user) {
        if (hasRole(user, "ROLE_ADMIN")) {
            return "ADMIN";
        }
        if (isProvider(user)) {
            return "PROVIDER";
        }
        return "CUSTOMER";
    }

    private String resolveStatus(User user) {
        if (user.getBannedAt() != null) {
            return "BANNED";
        }
        if (!user.isActive()) {
            return "INACTIVE";
        }
        if (user.getProviderProfile() != null
                && VerificationStatus.SUSPENDED.equals(user.getProviderProfile().getVerificationStatus())) {
            return "SUSPENDED";
        }
        return "ACTIVE";
    }

    private boolean isVerified(User user) {
        return hasRole(user, "ROLE_ADMIN")
                || (user.getProviderProfile() != null
                && VerificationStatus.APPROVED.equals(user.getProviderProfile().getVerificationStatus()));
    }

    private static boolean isProvider(User user) {
        return user.getProviderProfile() != null
                || user.getRoles().stream().map(Role::getName).anyMatch(role -> role.startsWith("ROLE_PROVIDER_"));
    }

    private boolean hasRole(User user, String roleName) {
        return user.getRoles().stream().map(Role::getName).anyMatch(roleName::equals);
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
