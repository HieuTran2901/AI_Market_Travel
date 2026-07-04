# AI Travel Marketplace Backend

Spring Boot backend for the AI Travel Marketplace. It provides REST APIs for authentication, listings, inventory, booking, cart/order/payment, reviews, provider tools, notifications, storage, and AI-assisted travel planning.

## Main Features

- JWT authentication with access and refresh tokens.
- Role-based access for customers, providers, and admins.
- Public listing search and listing detail APIs.
- Provider listing management.
- Booking, inventory, availability, order, payment, refund, and settlement workflows.
- Review/comment APIs with booking eligibility checks.
- Flyway-managed MySQL schema and demo seed data.
- Local file upload support.
- Mock AI provider by default, with optional Gemini, OpenAI, and Anthropic configuration.
- OpenAPI/Swagger documentation.

## Tech Stack

- Java 21
- Spring Boot 3.3
- Spring Web
- Spring Security
- JWT with JJWT
- Spring Data JPA / Hibernate
- MySQL 8
- Flyway
- Maven Wrapper
- Lombok
- Spring Validation
- Spring AOP
- springdoc-openapi / Swagger UI

## Project Structure

```text
backend/
  mvnw
  mvnw.cmd
  pom.xml
  src/main/java/com/travel/marketplace/
    config/              Security, OpenAPI, storage config
    dto/                 Shared API response DTOs
    exception/           Error codes and exception handling
    modules/
      ai/                AI planner, assistant, recommendation
      auth/              Login, register, token refresh
      booking/           Booking workflows
      inventory/         Availability and capacity
      listing/           Listings, details, search
      notification/      Notifications
      payment/           Payments and refunds
      pricing/           Pricing helpers
      provider/          Provider profile and dashboard
      review/            Reviews/comments
      scheduler/         Scheduled tasks
      storage/           Upload/storage APIs
      user/              Users and profiles
    security/            JWT filter and token provider
  src/main/resources/
    application.yml
    application-example.yml
    db/migration/        Flyway migrations
```

## Environment Configuration

The local app reads configuration from `src/main/resources/application.yml`.

Do not commit real secrets. For deployment or shared examples, use placeholders or environment variables. A safe template is available at:

```text
src/main/resources/application-example.yml
```

Important settings:

- `spring.datasource.url`: MySQL JDBC URL
- `spring.datasource.username`: database username
- `spring.datasource.password`: database password
- `app.jwt.secret`: Base64-encoded JWT signing secret
- `app.jwt.expiration-ms`: access token lifetime
- `app.jwt.refresh-expiration-ms`: refresh token lifetime
- `storage.local.upload-dir`: local upload directory
- `storage.local.base-url`: public URL for uploaded files
- `ai.provider`: `mock`, `gemini`, `openai`, or `anthropic`
- `ai.*.api-key`: optional external AI provider API keys
- `server.port`: port, usually `8080`

Example environment-style values:

```text
DATABASE_URL=jdbc:mysql://localhost:3306/your_database_name?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
DATABASE_USERNAME=your_username
DATABASE_PASSWORD=your_password
JWT_SECRET=your_base64_encoded_jwt_secret
PORT=8080
AI_PROVIDER=mock
```

### CORS

CORS is configured in:

```text
src/main/java/com/travel/marketplace/config/SecurityConfig.java
```

The current local allowed origins include:

- `http://localhost:5173`
- `http://localhost:3000`

For production, add your deployed frontend URL safely in configuration/code before deployment.

## Installation and Setup

Prerequisites:

- Java Development Kit 21
- MySQL 8
- PowerShell on Windows

The project includes Maven Wrapper scripts, so a global Maven installation is not required.

Install dependencies and compile:

```powershell
cd backend
.\mvnw.cmd -DskipTests compile
```

## Create the Database

If your MySQL user cannot create databases automatically, create it manually:

```sql
CREATE DATABASE your_database_name CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Then update your local `application.yml` or environment variables with the correct database URL, username, and password.

Flyway runs automatically on application startup and applies migrations from:

```text
src/main/resources/db/migration
```

## Run Locally

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Default backend URL:

```text
http://localhost:8080
```

## API Documentation and Testing

Swagger UI:

```text
http://localhost:8080/swagger-ui.html
```

OpenAPI JSON:

```text
http://localhost:8080/api-docs
```

Useful manual checks:

```powershell
Invoke-RestMethod http://localhost:8080/api/v1/listings
```

Authenticate through the `/api/v1/auth/login` endpoint, then send protected requests with:

```text
Authorization: Bearer your_access_token
```

## Deployment Notes

### Render or Similar Platforms

Recommended setup:

1. Create a MySQL database service or use an external managed MySQL 8 database.
2. Set environment variables for database credentials and JWT secret.
3. Build command:

```text
./mvnw -DskipTests package
```

4. Start command:

```text
java -jar target/marketplace-0.0.1-SNAPSHOT.jar
```

5. Set `PORT` if the platform requires it.
6. Update CORS to allow your deployed frontend domain.
7. Configure `storage.local.base-url` or move uploads to durable object storage for production.

### Production Safety

- Use a strong Base64-encoded JWT secret.
- Do not use local development database credentials.
- Keep AI provider keys in environment variables only.
- Make sure Flyway migrations are reviewed before running against production data.
- Use HTTPS for frontend and backend.

## Common Troubleshooting

- Database connection fails: verify MySQL is running, credentials are correct, and the database exists.
- Flyway migration fails: check migration order and avoid editing already-applied migrations.
- JWT errors on startup: ensure `app.jwt.secret` is valid Base64 and long enough for the signing algorithm.
- Frontend CORS errors: add the frontend origin to backend CORS configuration.
- Swagger does not load: confirm the backend started successfully and visit `/swagger-ui.html`.
- File uploads do not render: confirm `storage.local.upload-dir` exists and `storage.local.base-url` points to the backend upload URL.

