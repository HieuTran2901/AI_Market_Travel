package com.travel.marketplace.modules.user.controller;

import com.travel.marketplace.dto.ApiResponse;
import com.travel.marketplace.modules.infrastructure.audit.annotation.Audit;
import com.travel.marketplace.modules.user.dto.AdminUserResponse;
import com.travel.marketplace.modules.user.dto.AdminUserSearchRequest;
import com.travel.marketplace.modules.user.dto.AdminUserStatisticsResponse;
import com.travel.marketplace.modules.user.dto.BanUserRequest;
import com.travel.marketplace.modules.user.service.AdminUserService;
import com.travel.marketplace.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.Instant;

@RestController
@RequestMapping("/api/v1/admin/users")
@Tag(name = "Admin - User Management", description = "Admin operations for marketplace users")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    @Operation(summary = "List marketplace users with filters and pagination")
    public ResponseEntity<ApiResponse<Page<AdminUserResponse>>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Boolean verified,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant joinedFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant joinedTo
    ) {
        AdminUserSearchRequest request = new AdminUserSearchRequest(keyword, role, status, verified, joinedFrom, joinedTo);
        Page<AdminUserResponse> users = adminUserService.getUsers(request, page, size, sort);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @GetMapping("/statistics")
    @Operation(summary = "Get marketplace user statistics")
    public ResponseEntity<ApiResponse<AdminUserStatisticsResponse>> getStatistics() {
        return ResponseEntity.ok(ApiResponse.success(adminUserService.getStatistics()));
    }

    @PatchMapping("/{userId}/ban")
    @Operation(summary = "Ban a marketplace user")
    @Audit(action = "BAN_USER", entityType = "USER")
    public ResponseEntity<ApiResponse<AdminUserResponse>> banUser(
            @PathVariable Long userId,
            @Valid @RequestBody BanUserRequest request,
            @AuthenticationPrincipal UserPrincipal admin
    ) {
        return ResponseEntity.ok(ApiResponse.success("User banned successfully", adminUserService.banUser(userId, admin.getId(), request)));
    }

    @PatchMapping("/{userId}/unban")
    @Operation(summary = "Unban a marketplace user")
    @Audit(action = "UNBAN_USER", entityType = "USER")
    public ResponseEntity<ApiResponse<AdminUserResponse>> unbanUser(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserPrincipal admin
    ) {
        return ResponseEntity.ok(ApiResponse.success("User access restored", adminUserService.unbanUser(userId, admin.getId())));
    }
}
