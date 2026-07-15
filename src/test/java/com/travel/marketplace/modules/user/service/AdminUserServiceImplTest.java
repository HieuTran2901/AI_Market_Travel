package com.travel.marketplace.modules.user.service;

import com.travel.marketplace.modules.booking.repository.BookingRepository;
import com.travel.marketplace.modules.provider.enums.VerificationStatus;
import com.travel.marketplace.exception.BusinessException;
import com.travel.marketplace.exception.ErrorCode;
import com.travel.marketplace.modules.user.dto.AdminUserResponse;
import com.travel.marketplace.modules.user.dto.AdminUserSearchRequest;
import com.travel.marketplace.modules.user.dto.AdminUserStatisticsResponse;
import com.travel.marketplace.modules.user.dto.BanUserRequest;
import com.travel.marketplace.modules.user.entity.ProviderProfile;
import com.travel.marketplace.modules.user.entity.Role;
import com.travel.marketplace.modules.user.entity.User;
import com.travel.marketplace.modules.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Test
    void getUsersReturnsSafeAdminDtoWithBookingCount() {
        AdminUserService service = new AdminUserServiceImpl(userRepository, bookingRepository);
        User user = User.builder()
                .id(7L)
                .email("linh@example.com")
                .fullName("Linh Nguyen")
                .phoneNumber("+84 900 123 456")
                .avatarUrl("/uploads/users/linh.png")
                .isActive(true)
                .roles(Set.of(Role.builder().name("ROLE_CUSTOMER").build()))
                .createdAt(Instant.parse("2026-01-01T00:00:00Z"))
                .updatedAt(Instant.parse("2026-01-02T00:00:00Z"))
                .build();

        Page<User> page = new PageImpl<>(List.of(user));
        when(userRepository.findAll(ArgumentMatchers.<Specification<User>>any(), any(Pageable.class))).thenReturn(page);
        when(bookingRepository.countBookingsByUserIds(List.of(7L))).thenReturn(List.<Object[]>of(new Object[]{7L, 3L}));

        Page<AdminUserResponse> result = service.getUsers(
                new AdminUserSearchRequest(null, null, null, null, null, null),
                0,
                10,
                "createdAt,desc"
        );

        AdminUserResponse response = result.getContent().getFirst();
        assertThat(response.id()).isEqualTo(7L);
        assertThat(response.email()).isEqualTo("linh@example.com");
        assertThat(response.phone()).isEqualTo("+84 900 123 456");
        assertThat(response.primaryRole()).isEqualTo("CUSTOMER");
        assertThat(response.status()).isEqualTo("ACTIVE");
        assertThat(response.bookingCount()).isEqualTo(3L);
    }

    @Test
    void getStatisticsUsesAggregateRepositoryCounts() {
        AdminUserService service = new AdminUserServiceImpl(userRepository, bookingRepository);
        when(userRepository.count()).thenReturn(12L);
        when(userRepository.countByIsActiveTrue()).thenReturn(10L);
        when(userRepository.countByCreatedAtGreaterThanEqual(any(Instant.class))).thenReturn(4L);
        when(userRepository.countVerifiedUsers()).thenReturn(8L);
        when(userRepository.countByBannedAtIsNotNull()).thenReturn(2L);
        when(userRepository.countByRoleName("ROLE_CUSTOMER")).thenReturn(9L);
        when(userRepository.countByRoleName("ROLE_ADMIN")).thenReturn(1L);
        when(userRepository.countProviders()).thenReturn(2L);

        AdminUserStatisticsResponse stats = service.getStatistics();

        assertThat(stats.totalUsers()).isEqualTo(12L);
        assertThat(stats.activeUsers()).isEqualTo(10L);
        assertThat(stats.newUsersLast30Days()).isEqualTo(4L);
        assertThat(stats.verifiedUsers()).isEqualTo(8L);
        assertThat(stats.bannedUsers()).isEqualTo(2L);
        assertThat(stats.customers()).isEqualTo(9L);
        assertThat(stats.providers()).isEqualTo(2L);
        assertThat(stats.admins()).isEqualTo(1L);
    }

    @Test
    void suspendedProviderMapsToSuspendedStatusAndVerifiedFalse() {
        AdminUserService service = new AdminUserServiceImpl(userRepository, bookingRepository);
        ProviderProfile profile = ProviderProfile.builder()
                .verificationStatus(VerificationStatus.SUSPENDED)
                .build();
        User user = User.builder()
                .id(9L)
                .email("provider@example.com")
                .fullName("Provider User")
                .isActive(true)
                .roles(Set.of(Role.builder().name("ROLE_PROVIDER_HOTEL").build()))
                .providerProfile(profile)
                .createdAt(Instant.parse("2026-01-01T00:00:00Z"))
                .updatedAt(Instant.parse("2026-01-02T00:00:00Z"))
                .build();

        when(userRepository.findAll(ArgumentMatchers.<Specification<User>>any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(user)));
        when(bookingRepository.countBookingsByUserIds(List.of(9L))).thenReturn(List.of());

        AdminUserResponse response = service.getUsers(
                new AdminUserSearchRequest(null, null, null, null, null, null),
                0,
                10,
                "createdAt,desc"
        ).getContent().getFirst();

        assertThat(response.primaryRole()).isEqualTo("PROVIDER");
        assertThat(response.status()).isEqualTo("SUSPENDED");
        assertThat(response.verified()).isFalse();
    }

    @Test
    void banUserPersistsBanMetadataAndReturnsBannedStatus() {
        AdminUserService service = new AdminUserServiceImpl(userRepository, bookingRepository);
        User user = User.builder()
                .id(11L)
                .email("customer@example.com")
                .fullName("Customer User")
                .isActive(true)
                .roles(Set.of(Role.builder().name("ROLE_CUSTOMER").build()))
                .createdAt(Instant.parse("2026-01-01T00:00:00Z"))
                .updatedAt(Instant.parse("2026-01-02T00:00:00Z"))
                .build();

        when(userRepository.findById(11L)).thenReturn(java.util.Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);

        AdminUserResponse response = service.banUser(
                11L,
                1L,
                new BanUserRequest("POLICY_VIOLATION", "Repeated policy violations", null)
        );

        assertThat(user.isActive()).isFalse();
        assertThat(user.getBannedAt()).isNotNull();
        assertThat(user.getBannedBy()).isEqualTo(1L);
        assertThat(user.getBanReasonCode()).isEqualTo("POLICY_VIOLATION");
        assertThat(response.status()).isEqualTo("BANNED");
        assertThat(response.banned()).isTrue();
    }

    @Test
    void banUserRejectsSelfBan() {
        AdminUserService service = new AdminUserServiceImpl(userRepository, bookingRepository);
        User user = User.builder().id(1L).email("admin@example.com").fullName("Admin").roles(Set.of()).build();
        when(userRepository.findById(1L)).thenReturn(java.util.Optional.of(user));

        assertThatThrownBy(() -> service.banUser(1L, 1L, new BanUserRequest("Security risk", "Compromised", null)))
                .isInstanceOf(BusinessException.class)
                .extracting(error -> ((BusinessException) error).getErrorCode())
                .isEqualTo(ErrorCode.CANNOT_BAN_SELF);
    }

    @Test
    void banUserRejectsLastActiveAdmin() {
        AdminUserService service = new AdminUserServiceImpl(userRepository, bookingRepository);
        User user = User.builder()
                .id(2L)
                .email("other-admin@example.com")
                .fullName("Other Admin")
                .isActive(true)
                .roles(Set.of(Role.builder().name("ROLE_ADMIN").build()))
                .build();
        when(userRepository.findById(2L)).thenReturn(java.util.Optional.of(user));
        when(userRepository.countActiveAdmins()).thenReturn(1L);

        assertThatThrownBy(() -> service.banUser(2L, 1L, new BanUserRequest("Security risk", "Compromised", null)))
                .isInstanceOf(BusinessException.class)
                .extracting(error -> ((BusinessException) error).getErrorCode())
                .isEqualTo(ErrorCode.CANNOT_BAN_LAST_ADMIN);
    }

    @Test
    void unbanUserRestoresAccess() {
        AdminUserService service = new AdminUserServiceImpl(userRepository, bookingRepository);
        User user = User.builder()
                .id(12L)
                .email("banned@example.com")
                .fullName("Banned User")
                .isActive(false)
                .roles(Set.of(Role.builder().name("ROLE_CUSTOMER").build()))
                .createdAt(Instant.parse("2026-01-01T00:00:00Z"))
                .updatedAt(Instant.parse("2026-01-02T00:00:00Z"))
                .bannedAt(Instant.parse("2026-02-01T00:00:00Z"))
                .banReasonCode("Spam or abuse")
                .banReason("Spam")
                .previousStatus("ACTIVE")
                .build();

        when(userRepository.findById(12L)).thenReturn(java.util.Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);

        AdminUserResponse response = service.unbanUser(12L, 1L);

        assertThat(user.isActive()).isTrue();
        assertThat(user.getBannedAt()).isNull();
        assertThat(response.status()).isEqualTo("ACTIVE");
        assertThat(response.banned()).isFalse();
    }
}
