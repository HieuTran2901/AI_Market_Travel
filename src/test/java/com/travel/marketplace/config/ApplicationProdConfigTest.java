package com.travel.marketplace.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.yaml.snakeyaml.Yaml;

import java.io.InputStream;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class ApplicationProdConfigTest {

    @Test
    @DisplayName("Verify application-prod.yml exists, is valid YAML without duplicate root keys, and has required structure")
    void testApplicationProdYamlStructure() {
        InputStream is = getClass().getClassLoader().getResourceAsStream("application-prod.yml");
        assertThat(is).as("application-prod.yml must be on the classpath").isNotNull();

        Yaml yaml = new Yaml();
        Map<String, Object> config = yaml.load(is);
        assertThat(config).isNotNull();

        // 1. Verify Profile Activation
        assertThat(config).containsKey("spring");
        @SuppressWarnings("unchecked")
        Map<String, Object> spring = (Map<String, Object>) config.get("spring");
        assertThat(spring).containsKey("config");
        @SuppressWarnings("unchecked")
        Map<String, Object> springConfig = (Map<String, Object>) spring.get("config");
        @SuppressWarnings("unchecked")
        Map<String, Object> activate = (Map<String, Object>) springConfig.get("activate");
        assertThat(activate.get("on-profile")).isEqualTo("prod");

        // 2. Verify JPA ddl-auto is validate
        @SuppressWarnings("unchecked")
        Map<String, Object> jpa = (Map<String, Object>) spring.get("jpa");
        @SuppressWarnings("unchecked")
        Map<String, Object> hibernate = (Map<String, Object>) jpa.get("hibernate");
        assertThat(hibernate.get("ddl-auto")).isEqualTo("validate");

        // 3. Verify Flyway is enabled
        @SuppressWarnings("unchecked")
        Map<String, Object> flyway = (Map<String, Object>) spring.get("flyway");
        assertThat(flyway.get("enabled")).isEqualTo(true);

        // 4. Verify Single App Root & Sub-blocks
        assertThat(config).containsKey("app");
        @SuppressWarnings("unchecked")
        Map<String, Object> app = (Map<String, Object>) config.get("app");
        assertThat(app).containsKeys("cors", "otp", "mail", "jwt");

        // 5. Verify Payment Root
        assertThat(config).containsKey("payment");
        @SuppressWarnings("unchecked")
        Map<String, Object> payment = (Map<String, Object>) config.get("payment");
        assertThat(payment).containsKeys("momo", "sepay");

        // 6. Verify Server Port
        assertThat(config).containsKey("server");
        @SuppressWarnings("unchecked")
        Map<String, Object> server = (Map<String, Object>) config.get("server");
        assertThat(server.get("port")).isEqualTo("${PORT:8080}");

        // 7. Verify Railway MySQL Datasource
        assertThat(spring).containsKey("datasource");
        @SuppressWarnings("unchecked")
        Map<String, Object> datasource = (Map<String, Object>) spring.get("datasource");
        assertThat(datasource.get("url")).isEqualTo("jdbc:mysql://${MYSQLHOST}:${MYSQLPORT:3306}/${MYSQLDATABASE}?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Ho_Chi_Minh");
        assertThat(datasource.get("username")).isEqualTo("${MYSQLUSER}");
        assertThat(datasource.get("password")).isEqualTo("${MYSQLPASSWORD}");
        assertThat(datasource.get("driver-class-name")).isEqualTo("com.mysql.cj.jdbc.Driver");
    }

    @Test
    @DisplayName("Verify application.yml exists, is valid YAML without duplicate root keys (DuplicateKeyException), and has required structure")
    void testApplicationYamlStructure() throws Exception {
        java.nio.file.Path path = java.nio.file.Path.of("src/main/resources/application.yml");
        assertThat(java.nio.file.Files.exists(path)).as("src/main/resources/application.yml must exist").isTrue();

        Yaml yaml = new Yaml();
        try (InputStream is = java.nio.file.Files.newInputStream(path)) {
            Map<String, Object> config = yaml.load(is);
            assertThat(config).isNotNull();

            // Verify Single App Root & Sub-blocks without DuplicateKeyException
            assertThat(config).containsKey("app");
            @SuppressWarnings("unchecked")
            Map<String, Object> app = (Map<String, Object>) config.get("app");
            assertThat(app).containsKeys("cors", "otp", "email", "mail", "jwt");
            assertThat(config).containsKey("resend");
        }
    }
}
