package com.travel.marketplace.modules.notification.controller;

import com.travel.marketplace.dto.ApiResponse;
import com.travel.marketplace.modules.notification.entity.Notification;
import com.travel.marketplace.modules.notification.service.NotificationService;
import com.travel.marketplace.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ApiResponse<Page<Notification>> getMyNotifications(
            @AuthenticationPrincipal UserPrincipal userDetails,
            Pageable pageable) {
        return ApiResponse.success("Notifications fetched", 
                notificationService.getUserNotifications(userDetails.getId(), pageable));
    }

    @GetMapping("/unread-count")
    public ApiResponse<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal UserPrincipal userDetails) {
        long count = notificationService.getUnreadCount(userDetails.getId());
        return ApiResponse.success("Unread count", Map.of("count", count));
    }

    @PatchMapping("/{id}/read")
    public ApiResponse<Void> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userDetails) {
        notificationService.markAsRead(id, userDetails.getId());
        return ApiResponse.success("Marked as read", null);
    }

    @PatchMapping("/read-all")
    public ApiResponse<Void> markAllAsRead(
            @AuthenticationPrincipal UserPrincipal userDetails) {
        notificationService.markAllAsRead(userDetails.getId());
        return ApiResponse.success("All marked as read", null);
    }
}
