# Vercel Deployment Guide

## Changes Made to Fix Deployment

### 1. Fixed Sentry Configuration
- Updated `instrumentation.ts` to import from root-level Sentry configs
- Removed duplicate Sentry files in `src/lib/` that were causing conflicts
- Made Sentry optional during build (only activates if `SENTRY_AUTH_TOKEN` is set)

### 2. Environment Variable Handling
- Updated `src/lib/env.ts` to make all environment variables optional during build
- This prevents build failures when env vars aren't set yet
- Environment validation now warns instead of throwing errors

### 3. Next.js Configuration
- Added `instrumentationHook: true` to experimental features
- Configured Puppeteer to be excluded from client bundle (not used but listed as dependency)
- Increased `staticPageGenerationTimeout` to 180 seconds
- Added proper webpack externals configuration

### 4. Build Scripts
- Added `postinstall` script to run `prisma generate` automatically
- Updated build script to include `prisma generate`

### 5. Added Configuration Files
- Created `vercel.json` with proper build configuration
- Created `.vercelignore` to exclude unnecessary files
- Created `src/app/global-error.tsx` for global error handling

## Required Environment Variables in Vercel

You need to set these environment variables in your Vercel project settings:

### Essential (Required for deployment)
```
DATABASE_URL=postgresql://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NODE_ENV=production
```

### Optional (Add as needed)
```
# Database
DIRECT_URL=postgresql://...  # For Prisma migrations

# Salesforce
SALESFORCE_CLIENT_ID=...
SALESFORCE_CLIENT_SECRET=...
SALESFORCE_DOMAIN=...

# Inngest (for background jobs)
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...

# Upstash Redis (for rate limiting)
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# Sentry (for error tracking)
NEXT_PUBLIC_SENTRY_DSN=...
SENTRY_ORG=...
SENTRY_PROJECT=...
SENTRY_AUTH_TOKEN=...

# PostHog (for analytics)
NEXT_PUBLIC_POSTHOG_KEY=...
NEXT_PUBLIC_POSTHOG_HOST=...
```

## Deployment Steps

1. **Push your changes to Git**
   ```bash
   git add .
   git commit -m "Fix Vercel deployment configuration"
   git push
   ```

2. **Set up PostgreSQL database**
   - Use [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
   - Or use [Supabase](https://supabase.com)
   - Or use [Neon](https://neon.tech)
   - Make sure to enable the `pgvector` extension for embeddings

3. **Configure Vercel project**
   - Go to your Vercel project settings
   - Add all required environment variables
   - Make sure `DATABASE_URL` points to your PostgreSQL instance

4. **Deploy**
   - Vercel will automatically deploy from your Git repository
   - Or manually trigger a deployment from the Vercel dashboard

## Troubleshooting

### Build Fails with "Cannot find Sentry config"
- This should now be fixed with the conditional Sentry wrapper
- If it persists, temporarily remove `SENTRY_AUTH_TOKEN` from env vars

### Database Connection Errors
- Ensure `DATABASE_URL` is set correctly
- Check that pgvector extension is enabled: `CREATE EXTENSION IF NOT EXISTS vector;`
- For Vercel Postgres, use the connection pooling URL for `DATABASE_URL` and direct URL for `DIRECT_URL`

### Missing Environment Variables
- All env vars are now optional during build
- The app will fail at runtime if critical vars (like `OPENAI_API_KEY`) are missing
- Check the Vercel deployment logs for warnings about missing variables

### Function Timeout Errors
- API routes are configured with 60-second timeout in `vercel.json`
- For longer operations, consider using Inngest for background jobs

## Database Setup

After deployment, you need to run migrations:

```bash
# Option 1: Using Vercel CLI
vercel env pull .env.local
npx prisma migrate deploy

# Option 2: Via the database directly
# Run the migrations SQL files from prisma/migrations
```

## Post-Deployment Checklist

- [ ] Database is set up with pgvector extension
- [ ] Migrations are applied
- [ ] All required environment variables are set
- [ ] Test authentication (Clerk)
- [ ] Test creating a workspace
- [ ] Test adding content
- [ ] Verify LLM functions work (summarization, tagging)
- [ ] Check Sentry for any errors (if enabled)

## Optional: Remove Puppeteer

Puppeteer is listed as a dependency but not used. To reduce deployment size:

```bash
npm uninstall puppeteer
```

Then remove `'puppeteer'` from `serverComponentsExternalPackages` in `next.config.js`.

