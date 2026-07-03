package com.travel.marketplace.modules.storage.controller;

import com.travel.marketplace.dto.ApiResponse;
import com.travel.marketplace.modules.storage.service.StorageProvider;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/storage")
@Tag(name = "Storage", description = "Upload and manage files")
@SecurityRequirement(name = "bearerAuth")
public class StorageController {

    private final StorageProvider storageProvider;

    public StorageController(StorageProvider storageProvider) {
        this.storageProvider = storageProvider;
    }

    @PostMapping("/upload")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Upload a file")
    public ResponseEntity<ApiResponse<String>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "general") String folder) {

        String url = storageProvider.uploadFile(file, folder);
        return ResponseEntity.ok(ApiResponse.success("File uploaded successfully", url));
    }
}
