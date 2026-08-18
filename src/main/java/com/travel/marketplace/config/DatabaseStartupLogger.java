package com.travel.marketplace.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.util.Arrays;

/**
 * Safe startup diagnostic logger for Railway / Production environment.
 * Logs only non-sensitive diagnostic metadata (active profile, host, port, db name).
 * NEVER logs passwords, JWT secrets, or API keys.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DatabaseStartupLogger {

    private final Environment environment;

    @PostConstruct
    public void logStartupDiagnostics() {
        try {
            String[] activeProfiles = environment.getActiveProfiles();
            String activeProfileStr = activeProfiles.length > 0 ? String.join(", ", activeProfiles) : "default (dev)";
            log.info("========== APPLICATION STARTUP DIAGNOSTICS ==========");
            log.info("Active Spring Profiles: [{}]", activeProfileStr);

            String datasourceUrl = "";
            String datasourceUser = "";
            String datasourcePassword = "";

            try {
                datasourceUrl = environment.getProperty("spring.datasource.url", "");
                datasourceUser = environment.getProperty("spring.datasource.username", "");
                datasourcePassword = environment.getProperty("spring.datasource.password", "");
            } catch (Exception ex) {
                log.warn("Notice: Datasource property lookup returned placeholder or unresolved: {}", ex.getMessage());
            }

            // Sanitize URL for safe logging (strip embedded user/pass if present)
            String sanitizedUrl = sanitizeJdbcUrl(datasourceUrl);
            log.info("Datasource Target: {}", sanitizedUrl);
            log.info("Datasource Username Configured: {}", (datasourceUser != null && !datasourceUser.isBlank()));
            log.info("Datasource Password Configured: {}", (datasourcePassword != null && !datasourcePassword.isBlank()));

            boolean isProd = Arrays.asList(activeProfiles).contains("prod");
            if (!isProd && System.getenv("PORT") != null) {
                log.warn("WARNING: PORT environment variable detected but active profile is NOT 'prod'! Make sure SPRING_PROFILES_ACTIVE=prod is set in Railway.");
            }

            if (isProd && (datasourceUrl.contains("localhost") || datasourceUrl.contains("127.0.0.1"))) {
                log.warn("WARNING: Production profile is active but datasource URL points to localhost/127.0.0.1! Check Railway MySQL environment variables.");
            }
            log.info("=====================================================");
        } catch (Throwable t) {
            log.warn("DatabaseStartupLogger encountered a non-blocking diagnostic issue: {}", t.getMessage());
        }
    }

    private String sanitizeJdbcUrl(String url) {
        if (url == null || url.isBlank()) {
            return "[NOT_CONFIGURED]";
        }
        // If standard jdbc:mysql://host:port/db, keep query params but strip any embedded auth
        try {
            if (url.startsWith("jdbc:")) {
                String rawUri = url.substring(5);
                if (rawUri.startsWith("mysql://")) {
                    URI uri = URI.create(rawUri);
                    String host = uri.getHost() != null ? uri.getHost() : "unknown";
                    int port = uri.getPort();
                    String path = uri.getPath() != null ? uri.getPath() : "";
                    return "jdbc:mysql://" + host + (port > 0 ? ":" + port : "") + path;
                }
            }
        } catch (Exception e) {
            // fallback simple masking
        }
        return url.replaceAll("(?i)(password|pwd)=[^;&]*", "$1=******");
    }
}
