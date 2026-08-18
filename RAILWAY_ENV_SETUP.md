# Railway Production Environment Setup Guide

This guide explains how to configure environment variables for the **AI Travel Marketplace** backend on [Railway](https://railway.com).

---

## 1. Variable Categories & Setup Workflow

### A. Variables that Can Be Imported Immediately
These variables have production-ready defaults and can be applied directly to Railway:
- `PORT=8080` (Railway automatically overrides this if needed)
- `SPRING_PROFILES_ACTIVE=prod`
- `MAIL_HOST=smtp.gmail.com`
- `MAIL_PORT=587`
- `MAIL_SMTP_AUTH=true`
- `MAIL_SMTP_STARTTLS_ENABLE=true`
- `MAIL_SMTP_STARTTLS_REQUIRED=true`
- `MAIL_CONNECTION_TIMEOUT=5000`
- `MAIL_TIMEOUT=5000`
- `MAIL_WRITE_TIMEOUT=5000`
- `MAIL_FROM_NAME=AI Travel Marketplace`
- `OTP_EXPIRATION_SECONDS=60`
- `OTP_RESEND_COOLDOWN_SECONDS=60`
- `OTP_MAX_VERIFICATION_ATTEMPTS=5`
- `STORAGE_TYPE=local`
- `UPLOAD_DIR=./uploads`
- `MOMO_ENABLED=false` (enable after configuring credentials)
- `MOMO_PARTNER_CODE=MOMO`
- `MOMO_ENDPOINT=https://payment.momo.vn/v2/gateway/api/create`
- `MOMO_REQUEST_TYPE=captureWallet`
- `MOMO_LANGUAGE=en`
- `MOMO_TIMEOUT=30s`
- `SEPAY_ENABLED=false` (enable after configuring credentials)
- `SEPAY_ENV=production`
- `AI_PROVIDER=gemini` (or `groq` / `openrouter`)
- `GEMINI_BASE_URL=https://generativelanguage.googleapis.com`
- `GEMINI_API_VERSION=v1beta`
- `GEMINI_MODEL=gemini-2.5-flash`
- `OPENROUTER_BASE_URL=https://openrouter.ai/api/v1`
- `OPENROUTER_CHAT_PATH=/chat/completions`
- `OPENROUTER_MODEL=nvidia/nemotron-3-super-120b-a12b:free`
- `GROQ_BASE_URL=https://api.groq.com/openai/v1`
- `GROQ_CHAT_PATH=/chat/completions`
- `GROQ_MODEL=openai/gpt-oss-120b`
- `SERPAPI_BASE_URL=https://serpapi.com`
- `SPRINGDOC_API_DOCS_ENABLED=true`
- `SPRINGDOC_SWAGGER_UI_ENABLED=true`

---

### B. Variables Requiring Railway Public Backend URL
Once you generate a public domain on Railway (e.g. `https://ai-travel-backend.up.railway.app`), update these variables:
- `UPLOAD_BASE_URL`: `https://<YOUR_RAILWAY_DOMAIN>/uploads`
- `MOMO_IPN_URL`: `https://<YOUR_RAILWAY_DOMAIN>/api/v1/payments/momo/ipn`
- `SEPAY_IPN_URL`: `https://<YOUR_RAILWAY_DOMAIN>/api/v1/payments/sepay/ipn`
- `SEPAY_SUCCESS_URL`: `https://<YOUR_RAILWAY_DOMAIN>/api/v1/payments/sepay/return/success`
- `SEPAY_ERROR_URL`: `https://<YOUR_RAILWAY_DOMAIN>/api/v1/payments/sepay/return/error`
- `SEPAY_CANCEL_URL`: `https://<YOUR_RAILWAY_DOMAIN>/api/v1/payments/sepay/return/cancel`

---

### C. Variables Requiring Frontend Production URL
Set these to your deployed frontend origin (e.g. `https://ai-travel-marketplace.vercel.app`):
- `CORS_ALLOWED_ORIGINS`: `https://<YOUR_FRONTEND_DOMAIN>` (multiple allowed, comma-separated)
- `MOMO_REDIRECT_URL`: `https://<YOUR_FRONTEND_DOMAIN>/payments/momo/return`
- `MOMO_AI_COIN_REDIRECT_URL`: `https://<YOUR_FRONTEND_DOMAIN>/ai-coins/payment-result`
- `SEPAY_FRONTEND_REDIRECT_URL`: `https://<YOUR_FRONTEND_DOMAIN>/ai-coins/payment-result`
- `SEPAY_BOOKING_FRONTEND_REDIRECT_URL`: `https://<YOUR_FRONTEND_DOMAIN>/checkout`

---

### D. Variables Requiring Railway MySQL
When you add a MySQL plugin/service in the same Railway project:
- Railway provides `MYSQLHOST`, `MYSQLPORT`, `MYSQLDATABASE`, `MYSQLUSER`, `MYSQLPASSWORD`.
- The application automatically connects using:
  - `MYSQLHOST`
  - `MYSQLPORT` (defaults to `3306`)
  - `MYSQLDATABASE`
  - `MYSQLUSER`
  - `MYSQLPASSWORD`
- Connect variables across services using Railway Reference Variables if not automatically shared:
  - `MYSQLHOST`: `${{MySQL.MYSQLHOST}}`
  - `MYSQLPORT`: `${{MySQL.MYSQLPORT}}`
  - `MYSQLDATABASE`: `${{MySQL.MYSQLDATABASE}}`
  - `MYSQLUSER`: `${{MySQL.MYSQLUSER}}`
  - `MYSQLPASSWORD`: `${{MySQL.MYSQLPASSWORD}}`

---

### E. Sensitive Variables Requiring Manual Verification
These secrets are already populated from your local environment in `railway-env.json` / `railway-env-production.json`. Verify them in Railway:
- `JWT_SECRET`: Base64-encoded 64-byte HMAC-SHA512 key. *(Mandatory: application fails fast on startup if missing).*
- `MAIL_USERNAME`: Production SMTP email.
- `MAIL_PASSWORD`: Production SMTP App Password.
- `MAIL_FROM`: Verified sender email address.
- `GEMINI_API_KEY`: Google Gemini API key.
- `GROQ_API_KEY`: Groq API key.
- `OPENROUTER_API_KEY`: OpenRouter API key.
- `SERPAPI_API_KEY`: SerpAPI key for flight search.
- `MOMO_ACCESSKEY` & `MOMO_SECRETKEY`: MoMo merchant API credentials.
- `MERCHANTID`, `SEPAY_SECRETKEY`, `SEPAY_IPN_SECRET`: SePay merchant credentials.

---

## 2. Critical Architecture Considerations

### F. Storage Persistence Warning
> [!WARNING]
> Railway containers use an ephemeral filesystem. Files saved under `./uploads` will be wiped whenever the container restarts or redeploys.
> For long-term production, either attach a **Railway Volume** mounted at `./uploads` or configure an S3/Cloudinary object store.

### G. SMTP Requirements
- Gmail SMTP (`smtp.gmail.com:587`) requires a 16-character **Google App Password** if 2-Factor Authentication is enabled on the account.
- `MAIL_FROM` must match the authorized sender on the SMTP account.

### H. MoMo Gateway Requirements
- `MOMO_IPN_URL` must be a publicly accessible HTTPS endpoint (no `localhost` or `ngrok`).
- `MOMO_ENABLED` should remain `false` until the Railway public domain is active.

### I. SePay Gateway Requirements
- `SEPAY_IPN_URL` must be a publicly accessible HTTPS endpoint (no `localhost` or `ngrok`).
- `SEPAY_ENV` should be set to `production` in live environments.

### J. CORS Requirements
- `CORS_ALLOWED_ORIGINS` must include the full protocol and domain of the frontend without trailing slash (e.g. `https://my-app.vercel.app`).
- Because cookies and `Authorization` headers are used with `allowCredentials(true)`, wildcard `*` is disallowed.
