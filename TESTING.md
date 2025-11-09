# Testing Guide for Insight Graph

This guide walks you through testing the Insight Graph application from setup to feature verification.

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
cd "/Users/o.deneen/Desktop/Marcet Trends"
npm install
```

### 2. Set Up Environment

```bash
cp .env.example .env.local
```

**Minimal `.env.local` for local testing:**

```env
# Database (use a local PostgreSQL or Supabase free tier)
DATABASE_URL="postgresql://postgres:password@localhost:5432/insight_graph"
DIRECT_URL="postgresql://postgres:password@localhost:5432/insight_graph"

# Clerk (create free account at clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# OpenAI (required for AI features)
OPENAI_API_KEY="sk-..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# Optional (can skip for initial testing)
INNGEST_EVENT_KEY=""
INNGEST_SIGNING_KEY=""
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
NEXT_PUBLIC_SENTRY_DSN=""
```

### 3. Database Setup

**Option A: Local PostgreSQL**

```bash
# Install PostgreSQL with pgvector
# macOS:
brew install postgresql@15 pgvector

# Start PostgreSQL
brew services start postgresql@15

# Create database
createdb insight_graph

# Enable pgvector extension
psql insight_graph -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

**Option B: Supabase (Recommended)**

1. Go to [supabase.com](https://supabase.com) and create a free project
2. Get your connection strings from Settings → Database
3. Update `.env.local` with the connection URLs
4. pgvector is already installed on Supabase

**Initialize Database:**

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Apply RLS policies (if using Supabase)
psql $DATABASE_URL < prisma/rls-policies.sql

# Seed demo data
npm run db:seed
```

### 4. Set Up Clerk

1. Go to [clerk.com](https://clerk.com) and create a free account
2. Create a new application
3. Copy the API keys to `.env.local`
4. In Clerk Dashboard:
   - Go to **JWT Templates** → Create a new template
   - Add custom claim: `"userId": "{{user.id}}"`

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Phase 2: Manual Feature Testing

### Test 1: Authentication & Onboarding

**Steps:**
1. Navigate to http://localhost:3000
2. You should be redirected to `/login`
3. Click "Sign up" in the Clerk widget
4. Create an account (use email + password or social auth)
5. After sign-up, you should be redirected to `/demo-workspace` (from seed data)

**Expected Result:**
- ✅ Successfully sign up and log in
- ✅ Redirected to workspace home page
- ✅ See navigation bar with workspace name

**Troubleshooting:**
- If stuck on login page: Check Clerk keys in `.env.local`
- If database error: Verify `DATABASE_URL` is correct
- If RLS error: Apply RLS policies or disable RLS temporarily

---

### Test 2: Workspace Home

**Steps:**
1. View the workspace home page (`/w/demo-workspace`)
2. Check the stats cards show:
   - Total Items (should be ~4 from seed)
   - Connections (should be ~2)
   - People (should be 4)
   - Trends (should be 3)
3. Scroll down to see "Recent Insights"

**Expected Result:**
- ✅ Stats cards show correct counts
- ✅ Recent insights list shows seeded items
- ✅ Tags and people badges are visible
- ✅ Navigation links work

---

### Test 3: Content Ingestion (/drop)

**Steps:**
1. Click **Drop** in the navigation
2. Test with this URL: `https://openai.com/blog/chatgpt`
3. Click **Ingest**
4. Wait 5-15 seconds for processing
5. Review the preview:
   - Title extracted
   - Summary generated (AI)
   - Tags suggested (AI)
   - Content preview shown
6. Click **Confirm & Save**

**Expected Result:**
- ✅ Content extracted successfully
- ✅ AI-generated summary appears
- ✅ Tags are relevant
- ✅ Item saved and redirected to home

**Troubleshooting:**
- **"Failed to extract content"**: Try a different URL (some sites block scraping)
- **OpenAI error**: Check `OPENAI_API_KEY` is valid and has credits
- **Timeout**: OpenAI API might be slow; increase timeout or try again
- **Rate limit error**: If no Redis, rate limiting is disabled (should work)

**Alternative Test URLs:**
- https://www.anthropic.com/news
- https://blog.langchain.dev
- https://simonwillison.net

---

### Test 4: Graph Visualization

**Steps:**
1. Click **Graph** in navigation
2. Wait for graph to render
3. Observe:
   - Nodes appear (should be ~4-6 from seed + any added)
   - Edges connect related nodes
   - Layout is organized (cola layout)
4. Click on a node
5. View node details in sidebar
6. Use zoom controls (bottom left)

**Expected Result:**
- ✅ Graph renders without errors
- ✅ Nodes sized by score
- ✅ Edges show relation types
- ✅ Clicking node shows details
- ✅ Zoom and pan work smoothly

**Troubleshooting:**
- **Graph not rendering**: Open browser console, check for Cytoscape errors
- **No nodes appear**: Verify items exist in database (`npm run db:seed`)
- **Layout issues**: Refresh page or click "Fit View" button

---

### Test 5: Timeline View

**Steps:**
1. Click **Timeline** in navigation
2. View the calendar heatmap
3. Observe colored squares based on activity
4. Click a date with activity (darker blue)
5. View filtered items for that date

**Expected Result:**
- ✅ Calendar displays current month
- ✅ Dates with items are highlighted
- ✅ Clicking a date filters items
- ✅ Items show with correct dates

---

### Test 6: People Hub

**Steps:**
1. Click **People** in navigation
2. View the grid of people (should see 4: Sam Altman, Demis Hassabis, etc.)
3. Click on a person card
4. View the person detail page:
   - Profile information
   - Momentum metric (last 4 weeks)
   - Total insights count
   - Top claims section
   - Recent activity

**Expected Result:**
- ✅ People grid displays correctly
- ✅ Person detail page loads
- ✅ Metrics calculate correctly
- ✅ Insights are associated with person

---

### Test 7: Trends Hub

**Steps:**
1. Click **Trends** in navigation
2. View trend cards (should see 3: Agentic Enterprise, RAG Observability, Multimodal AI)
3. Click on a trend
4. View trend detail page:
   - Description
   - Momentum sparkline (4-week chart)
   - Top insights
   - Contradictions (if any)

**Expected Result:**
- ✅ Trends display with colors
- ✅ Trend detail shows analytics
- ✅ Sparkline renders (simple bars)
- ✅ Related insights shown

---

### Test 8: Creating Links

**Steps:**
1. Go to Graph view
2. In the future, you'd click two nodes and create a link
3. For now, test via API:

```bash
# Get item IDs first
curl http://localhost:3000/api/w/demo-workspace/items | jq '.[0:2] | .[].id'

# Create a link (replace IDs)
curl -X POST http://localhost:3000/api/w/demo-workspace/links \
  -H "Content-Type: application/json" \
  -d '{
    "fromItemId": "ITEM_ID_1",
    "toItemId": "ITEM_ID_2",
    "relation": "supports",
    "weight": 1.5
  }'
```

**Expected Result:**
- ✅ Link created successfully
- ✅ Appears in graph on refresh

---

### Test 9: Newsletter Generation

**Steps:**
1. Click **Newsletters** in navigation
2. Click **New Newsletter**
3. (Note: Full UI might not be built, test via API)

**API Test:**

```bash
curl -X POST http://localhost:3000/api/w/demo-workspace/newsletters \
  -H "Content-Type: application/json" \
  -d '{
    "periodStart": "2024-01-01T00:00:00Z",
    "periodEnd": "2024-01-31T23:59:59Z",
    "audience": "Leadership",
    "cadence": "weekly"
  }'
```

**Expected Result:**
- ✅ Returns 202 status (job queued)
- ✅ Newsletter appears in list after processing (if Inngest running)

**Note:** Without Inngest running, newsletter won't generate. To test fully:

```bash
# Terminal 1: Run dev server
npm run dev

# Terminal 2: Run Inngest dev server
npm run inngest:dev
```

---

## Phase 3: Automated Testing

### Run Type Checking

```bash
npm run type-check
```

**Expected:** No TypeScript errors

### Run Linter

```bash
npm run lint
```

**Expected:** No linting errors (or only warnings)

### Run Unit Tests

```bash
npm test
```

**Note:** Test files aren't created yet. To add a sample test:

```bash
mkdir -p src/test
```

Create `src/test/utils.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { slugify, truncate, cosineSimilarity } from '@/lib/utils';

describe('Utils', () => {
  it('should slugify text', () => {
    expect(slugify('Hello World!')).toBe('hello-world');
  });

  it('should truncate text', () => {
    expect(truncate('Hello World', 5)).toBe('He...');
  });

  it('should calculate cosine similarity', () => {
    const a = [1, 0, 0];
    const b = [1, 0, 0];
    expect(cosineSimilarity(a, b)).toBe(1);
  });
});
```

Run:
```bash
npm test
```

### Run E2E Tests (Playwright)

**Setup:**

```bash
npx playwright install
```

**Create sample E2E test:**

```bash
mkdir -p e2e
```

Create `e2e/login.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test('should load login page', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Insight Graph/);
});

test('should redirect to workspace after auth', async ({ page }) => {
  // This test would require mocking Clerk auth
  // Skipping for now
});
```

**Run:**

```bash
npm run test:e2e
```

---

## Phase 4: Advanced Testing

### Test Inngest Jobs

**Setup:**

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run inngest:dev
```

**Test web ingestion job:**

1. Ingest a URL via /drop
2. Watch Inngest dev server logs
3. Should see:
   - `ingest/web` job triggered
   - Steps: fetch-content, generate-summary, etc.
   - Job completes successfully

**Test newsletter generation:**

```bash
curl -X POST http://localhost:3000/api/w/demo-workspace/newsletters \
  -H "Content-Type: application/json" \
  -d '{
    "periodStart": "2024-01-01",
    "periodEnd": "2024-01-31",
    "audience": "Leadership",
    "cadence": "weekly"
  }'
```

Watch Inngest logs for `digest/generate` job.

---

### Test Rate Limiting (Optional)

**Requires Upstash Redis setup**

1. Create free account at [upstash.com](https://upstash.com)
2. Create Redis database
3. Add credentials to `.env.local`:
   ```env
   UPSTASH_REDIS_REST_URL="https://..."
   UPSTASH_REDIS_REST_TOKEN="..."
   ```
4. Restart dev server
5. Make 101 requests to `/api/w/demo-workspace/drop` rapidly
6. 101st request should return 429 (Rate Limited)

**Test script:**

```bash
for i in {1..101}; do
  curl -X POST http://localhost:3000/api/w/demo-workspace/drop \
    -H "Content-Type: application/json" \
    -d '{"url": "https://example.com"}' &
done
```

---

### Test Sentry Error Tracking (Optional)

1. Create free account at [sentry.io](https://sentry.io)
2. Create project (Next.js)
3. Add DSN to `.env.local`:
   ```env
   NEXT_PUBLIC_SENTRY_DSN="https://...@sentry.io/..."
   ```
4. Restart server
5. Trigger an error (e.g., invalid URL in /drop)
6. Check Sentry dashboard for error

---

## Troubleshooting Common Issues

### Database Connection Failed

**Error:** `Can't reach database server`

**Solutions:**
- Check PostgreSQL is running: `brew services list`
- Verify connection string in `.env.local`
- Test connection: `psql $DATABASE_URL -c "SELECT 1;"`

### Prisma Client Not Generated

**Error:** `@prisma/client did not initialize yet`

**Solution:**
```bash
npm run db:generate
```

### RLS Policy Errors

**Error:** `Row-level security policy for table ... violated`

**Solutions:**
- Disable RLS temporarily: Comment out RLS policies
- Or ensure `setRLSContext()` is called in every query
- Or run queries with `?pgbouncer=true` in connection string

### OpenAI API Errors

**Error:** `Invalid API key` or `Rate limit exceeded`

**Solutions:**
- Verify API key is correct
- Check you have credits: https://platform.openai.com/usage
- Reduce request frequency

### Clerk Authentication Issues

**Error:** `Clerk publishable key not found`

**Solutions:**
- Check `.env.local` has correct keys
- Restart dev server after adding keys
- Clear browser cache/cookies

### Graph Not Rendering

**Error:** Blank canvas or console errors

**Solutions:**
- Check browser console for errors
- Verify items exist: `curl http://localhost:3000/api/w/demo-workspace/items`
- Try different browser (Chrome recommended)
- Disable browser extensions that might block scripts

---

## Testing Checklist

Use this checklist to verify all features:

### Core Features
- [ ] User can sign up and log in
- [ ] Workspace home displays correctly
- [ ] Drop page ingests URL successfully
- [ ] AI generates summary and tags
- [ ] Item appears in home feed
- [ ] Graph visualizes items and links
- [ ] Timeline shows items by date
- [ ] Person hub displays profiles
- [ ] Person detail shows analytics
- [ ] Trend hub displays trends
- [ ] Trend detail shows momentum

### API Endpoints
- [ ] GET /api/w/:slug/items returns items
- [ ] POST /api/w/:slug/items creates item
- [ ] GET /api/w/:slug/links returns links
- [ ] POST /api/w/:slug/links creates link
- [ ] POST /api/w/:slug/drop processes URL
- [ ] POST /api/w/:slug/newsletters queues generation

### Background Jobs
- [ ] Inngest dev server runs
- [ ] ingest/web job completes
- [ ] digest/generate job completes

### Optional Integrations
- [ ] Rate limiting works (with Redis)
- [ ] Sentry captures errors
- [ ] Salesforce OAuth configured

---

## Performance Benchmarks

Expected performance on local machine:

| Operation | Expected Time | Notes |
|-----------|---------------|-------|
| Page load | < 2s | Initial workspace home |
| URL ingest | 5-15s | Depends on OpenAI API |
| Graph render (100 nodes) | < 3s | With cola layout |
| Newsletter generation | 10-30s | Background job |
| Vector similarity search | < 500ms | With IVFFlat index |

---

## Next Steps After Testing

Once all features are verified:

1. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

2. **Set up production database** (Supabase recommended)

3. **Configure production secrets** in Vercel dashboard

4. **Run database migrations:**
   ```bash
   npm run db:migrate
   ```

5. **Test in production environment**

6. **Set up monitoring:**
   - Sentry for errors
   - Vercel Analytics for performance
   - PostHog for product analytics (optional)

---

## Getting Help

- Check **README.md** for setup details
- Review **ARCHITECTURE.md** for system design
- Check browser console for client-side errors
- Check terminal for server-side errors
- Review Inngest dashboard for job failures

If you encounter issues not covered here, please open an issue on GitHub with:
- Error message
- Steps to reproduce
- Environment details (OS, Node version, etc.)


