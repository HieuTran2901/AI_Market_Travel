package com.travel.marketplace.config;

import com.travel.marketplace.modules.storage.config.StorageProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

/**
 * Serves locally uploaded files as static resources.
 * Mapping: GET /uploads/** → local upload directory.
 *
 * This config is only relevant when storage.type=local.
 * When using S3 or Cloudinary, files are served directly from those CDNs.
 */
@Configuration
public class StorageConfig implements WebMvcConfigurer {

    private final StorageProperties storageProperties;

    public StorageConfig(StorageProperties storageProperties) {
        this.storageProperties = storageProperties;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String uploadDir = Paths.get(storageProperties.getLocal().getUploadDir())
                .toAbsolutePath()
                .normalize()
                .toUri()
                .toString();

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadDir);
    }
}
