# .env.production.example
# Copy this to .env.production and fill in your values

# Node Environment
NODE_ENV=production

# Database (Use SSL connection string)
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
POSTGRES_SSL=true
POSTGRES_SSL_REJECT_UNAUTHORIZED=false

# Redis (Use TLS)
REDIS_URL=rediss://user:password@host:6380/0
REDIS_TLS=true

# Better Auth (Generate with: npx @better-auth/cli@latest secret)
BETTER_AUTH_SECRET=your-generated-64-char-secret-here
BETTER_AUTH_URL=https://yourdomain.com

# Email Service (for verification emails)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM=noreply@yourdomain.com

# Services
AUTH_SERVICE_URL=http://auth-service:3001
BACKEND_SERVICE_URL=http://backend:8000

# Frontend
VITE_API_URL=https://yourdomain.com/api
VITE_AUTH_URL=https://yourdomain.com/auth

# CORS (Production domains only)
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# Security
COOKIE_DOMAIN=.yourdomain.com
COOKIE_SECURE=true
COOKIE_SAMESITE=lax

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_LOGIN_MAX=5
RATE_LIMIT_SIGNUP_MAX=3

# Session Configuration
SESSION_EXPIRES_IN=604800  # 7 days in seconds
SESSION_UPDATE_AGE=86400   # 1 day in seconds
SESSION_FRESH_AGE=600      # 10 minutes in seconds

# 2FA Configuration (if using)
TWO_FACTOR_ISSUER=YourAppName
TWO_FACTOR_WINDOW=1

# CAPTCHA (if using)
CAPTCHA_PROVIDER=cloudflare-turnstile
TURNSTILE_SECRET_KEY=your-turnstile-secret-key
TURNSTILE_SITE_KEY=your-turnstile-site-key

# Monitoring
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
LOG_LEVEL=warn

# Azure Specific (if using Azure)
AZURE_POSTGRES_URL=your-azure-postgres-url
AZURE_REDIS_URL=your-azure-redis-url
REGISTRY=myregistry.azurecr.io
TAG=latest
APP_URL=https://myapp.azurewebsites.net

# Feature Flags
ENABLE_EMAIL_VERIFICATION=true
ENABLE_2FA=true
ENABLE_RATE_LIMITING=true
ENABLE_CAPTCHA=true
ENABLE_SESSION_MONITORING=true