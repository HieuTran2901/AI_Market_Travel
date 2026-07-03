package com.travel.marketplace.modules.storage.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Slf4j
@Service
@ConditionalOnProperty(name = "storage.type", havingValue = "s3")
public class S3StorageProvider implements StorageProvider {

    // Assume AmazonS3Client is injected here

    @Override
    public String uploadFile(MultipartFile file, String folder) {
        String objectKey = folder + "/" + UUID.randomUUID() + "_" + file.getOriginalFilename();
        log.info("Uploading to S3 (Mock): bucket/{}", objectKey);
        // AmazonS3Client.putObject(...)
        return "https://s3.amazonaws.com/marketplace-bucket/" + objectKey;
    }

    @Override
    public void deleteFile(String fileUrl) {
        log.info("Deleting from S3 (Mock): {}", fileUrl);
        // AmazonS3Client.deleteObject(...)
    }

    @Override
    public String generatePresignedUploadUrl(String fileName, String folder) {
        String objectKey = folder + "/" + UUID.randomUUID() + "_" + fileName;
        log.info("Generating presigned URL for S3: {}", objectKey);
        // Generate pre-signed URL valid for X minutes
        return "https://s3.amazonaws.com/marketplace-bucket/" + objectKey + "?signature=mocked&expires=123";
    }
}
