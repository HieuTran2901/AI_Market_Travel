package com.travel.marketplace.modules.storage.service;

import com.travel.marketplace.modules.storage.config.StorageProperties;
import lombok.extern.slf4j.Slf4j;
import jakarta.annotation.PostConstruct;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Slf4j
@Service
@ConditionalOnProperty(name = "storage.type", havingValue = "local", matchIfMissing = true)
public class LocalStorageProvider implements StorageProvider {

    private final StorageProperties storageProperties;
    private Path uploadRootPath;

    public LocalStorageProvider(StorageProperties storageProperties) {
        this.storageProperties = storageProperties;
    }

    @PostConstruct
    public void init() {
        this.uploadRootPath = Paths.get(storageProperties.getLocal().getUploadDir())
                .toAbsolutePath()
                .normalize();
        try {
            Files.createDirectories(uploadRootPath);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize local storage directory: " + uploadRootPath, e);
        }
    }

    @Override
    public String uploadFile(MultipartFile file, String folder) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot store empty file");
        }

        try {
            String originalFilename = StringUtils.cleanPath(
                    file.getOriginalFilename() != null ? file.getOriginalFilename() : "file");
            String extension = getExtension(originalFilename);
            String fileName = UUID.randomUUID() + (extension.isEmpty() ? "" : "." + extension);
            Path folderPath = resolveStoragePath(folder);
            Path filePath = folderPath.resolve(fileName).normalize();

            if (!filePath.startsWith(uploadRootPath)) {
                throw new SecurityException("Cannot store file outside upload directory");
            }

            Files.createDirectories(folderPath);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            String storageKey = buildStorageKey(folder, fileName);
            return buildPublicUrl(storageKey);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file locally", e);
        }
    }

    @Override
    public void deleteFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) {
            return;
        }

        String storageKey = fileUrl;
        String baseUrl = storageProperties.getLocal().getBaseUrl();
        if (storageKey.startsWith(baseUrl)) {
            storageKey = storageKey.substring(baseUrl.length());
        }
        storageKey = storageKey.replaceFirst("^/+", "");

        Path targetPath = uploadRootPath.resolve(storageKey).normalize();
        if (!targetPath.startsWith(uploadRootPath)) {
            throw new SecurityException("Cannot delete file outside upload directory");
        }

        try {
            Files.deleteIfExists(targetPath);
        } catch (IOException e) {
            log.warn("Failed to delete local file: {}", storageKey, e);
        }
    }

    @Override
    public String generatePresignedUploadUrl(String fileName, String folder) {
        throw new UnsupportedOperationException("Presigned URLs are not supported by the local storage provider.");
    }

    private Path resolveStoragePath(String folder) {
        if (folder == null || folder.isBlank()) {
            return uploadRootPath;
        }
        return uploadRootPath.resolve(StringUtils.cleanPath(folder)).normalize();
    }

    private String buildStorageKey(String folder, String fileName) {
        if (folder == null || folder.isBlank()) {
            return fileName;
        }
        return StringUtils.cleanPath(folder).replace("\\", "/") + "/" + fileName;
    }

    private String buildPublicUrl(String storageKey) {
        String baseUrl = storageProperties.getLocal().getBaseUrl();
        return baseUrl.endsWith("/") ? baseUrl + storageKey : baseUrl + "/" + storageKey;
    }

    private String getExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        return (dotIndex > 0 && dotIndex < filename.length() - 1)
                ? filename.substring(dotIndex + 1).toLowerCase()
                : "";
    }
}
