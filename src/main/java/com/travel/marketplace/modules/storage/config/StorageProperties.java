package com.travel.marketplace.modules.storage.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "storage")
public class StorageProperties {
    private String type = "local";
    private Local local = new Local();

    @Data
    public static class Local {
        private String uploadDir = "./uploads";
        private String baseUrl = "http://localhost:8080/uploads";
    }
}
