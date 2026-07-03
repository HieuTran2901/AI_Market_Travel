package com.travel.marketplace.modules.storage.service;

import org.springframework.web.multipart.MultipartFile;

/**
 * Common abstraction for file storage.
 */
public interface StorageProvider {
    
    /**
     * Upload a file and return its public or internal reference URL.
     */
    String uploadFile(MultipartFile file, String folder);
    
    /**
     * Delete a file by its reference.
     */
    void deleteFile(String fileUrl);
    
    /**
     * Generates a temporary presigned URL for direct client upload (S3/MinIO specific, otherwise throws UnsupportedOperationException).
     */
    String generatePresignedUploadUrl(String fileName, String folder);
}
