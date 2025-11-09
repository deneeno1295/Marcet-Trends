# Insight Graph Architecture

## System Overview

Insight Graph is a multi-tenant SaaS application for knowledge management, built on a modern serverless stack with emphasis on scalability, security, and developer experience.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  Next.js 14 (App Router) + React + Tailwind + Cytoscape.js  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       API Layer (Next.js)                    │
│  • REST endpoints (/api/w/[slug]/...)                       │
│  • Server Actions                                            │
│  • Middleware (Auth, RLS)                                    │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐   ┌────────────────────┐   ┌──────────────┐
│   Database   │   │  Background Jobs   │   │  External    │
│              │   │                    │   │  Services    │
│  Supabase    │   │     Inngest        │   │              │
│  Postgres    │   │  • Ingest web      │   │  • OpenAI    │
│  + pgvector  │   │  • Generate digest │   │  • Clerk     │
│  + RLS       │   │  • RSS sync        │   │  • Salesforce│
│              │   │  • SF sync         │   │  • Sentry    │
└──────────────┘   └────────────────────┘   │  • Upstash   │
                                             └──────────────┘
```

## Core Components

### 1. Data Layer

**Prisma ORM** manages the data model with:
- User, Workspace, Membership (multi-tenancy)
- Item (insights), Link (connections)
- Person, Trend (entities)
- Tag, Theme (organization)
- Newsletter (digests)

**PostgreSQL + pgvector**:
- Primary data store
- Vector embeddings for semantic search
- RLS policies for tenant isolation

**Row-Level Security (RLS)**:
- All tables have RLS enabled
- Helper functions: `has_workspace_access()`, `get_user_role()`
- Context set via `set_config('app.current_user_id', ...)`

### 2. Application Layer

**Next.js 14 App Router**:
- Server Components by default
- Client Components for interactivity
- API Routes for REST endpoints
- Middleware for auth and RLS

**Authentication (Clerk)**:
- User management
- Salesforce OAuth integration
- Session handling

**Routes**:
- `/` - Home (redirects to workspace)
- `/w/[slug]/` - Workspace home
- `/w/[slug]/drop` - Content ingestion
- `/w/[slug]/viz/{graph,timeline}` - Visualizations
- `/w/[slug]/hubs/{people,trends}` - Entity hubs
- `/w/[slug]/newsletters` - Digest generation

### 3. Background Processing

**Inngest** handles async jobs:
- `ingest/web` - Fetch, extract, summarize, embed content
- `ingest/rss` - Periodic RSS feed ingestion
- `digest/generate` - Newsletter generation
- `salesforce/sync` - Bi-directional SF sync

**Job Flow (Web Ingest)**:
```
1. Fetch URL → Readability extraction
2. Convert to Markdown (Turndown)
3. Parallel:
   a. Generate summary (GPT-4)
   b. Extract tags (GPT-4)
   c. NER for people/trends (GPT-4)
4. Generate embedding (text-embedding-3-small)
5. Create Item + associations in DB
6. Calculate score
```

### 4. LLM Integration

**Pluggable Interface** (`src/lib/llm.ts`):
```typescript
interface LLM {
  summarize(md: string): Promise<string>;
  tag(md: string): Promise<string[]>;
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
  ner(md: string): Promise<{people, trends}>;
}
```

**Default: OpenAI**
- GPT-4 Turbo for summarization, tagging, NER
- text-embedding-3-small (1536 dims) for embeddings
- Batch embeddings for cost optimization (50-70% reduction)

### 5. Graph Visualization

**Cytoscape.js** powers the network view:
- Node sizing by score
- Edge styling by relation type
- Cola layout for performance
- Lazy loading (100 nodes max initially)
- On-demand detail fetching

**Optimizations**:
- Subgraph rendering
- Debounced updates
- Web Workers for layout (future)

### 6. Salesforce Integration

**OAuth Flow**:
1. User authorizes via Clerk custom OAuth
2. Tokens stored in `OAuthAccount` table
3. Refresh handled automatically by jsforce

**Data Sync**:
- **Pull**: SOQL queries for Opportunities, Cases → Items
- **Push**: Upsert Items to `Insight__c`, Links to `Waypoint__c`
- **Events**: Publish `Insight_Digest__e` for newsletters

**Custom Objects** (see `salesforce/custom-objects.json`):
- `Insight__c` - mirrors Item
- `Waypoint__c` - mirrors Link
- `Insight_Digest__e` - Platform Event for newsletters

### 7. Security & Performance

**Rate Limiting (Upstash Redis)**:
- `/api/w/[slug]/drop`: 100 req/min per user
- General API: 1000 req/min per user
- Newsletter generation: 10/hour per workspace

**Error Monitoring (Sentry)**:
- Auto-instrumentation for Next.js
- Inngest job error tracking
- Performance transaction monitoring

**Caching**:
- Embeddings cached in DB
- React Query for client-side caching

## Data Flow Examples

### Content Ingestion

```
User submits URL
    ↓
POST /api/w/:slug/drop (rate limited)
    ↓
Readability + Turndown → Markdown
    ↓
LLM: summarize, tag, NER
    ↓
Preview returned to user
    ↓
User confirms
    ↓
POST /api/w/:slug/items
    ↓
Inngest: ingest/web
    ↓
Create Item + Tags + People + Trends
    ↓
Calculate score, store embedding
    ↓
Done
```

### Newsletter Generation

```
User requests newsletter
    ↓
POST /api/w/:slug/newsletters
    ↓
Inngest: digest/generate
    ↓
1. Retrieve items (period + score filter)
2. Calculate trend momentum
3. Identify top signals
4. Render Handlebars template → HTML
5. Store Newsletter
    ↓
Optional: Publish to Salesforce
    ↓
Done
```

### Graph Rendering

```
User navigates to /viz/graph
    ↓
Fetch items + links (limit 100)
    ↓
Transform to Cytoscape elements
    ↓
Initialize Cytoscape with cola layout
    ↓
Render graph
    ↓
User clicks node → Fetch details on-demand
    ↓
User creates link → POST /api/w/:slug/links
    ↓
Optimistic UI update
```

## Deployment

**Vercel (Production)**:
- Automatic deployments from `main`
- Edge Functions for API routes
- Serverless functions for background jobs (via Inngest webhook)

**Database (Supabase)**:
- Hosted Postgres with pgvector
- Connection pooling via Supavisor
- Automatic backups

**Background Jobs (Inngest Cloud)**:
- Managed job execution
- Retries with exponential backoff
- Dashboard for monitoring

## Scaling Considerations

**Current Architecture** supports:
- 100s of workspaces
- 1000s of items per workspace
- 10s of concurrent users per workspace

**Bottlenecks & Solutions**:

1. **LLM costs**: Batch embeddings, cache aggressively
2. **Graph performance**: Implement subgraph views, pagination
3. **Database connections**: Connection pooling (Supabase default)
4. **Vector search**: Upgrade to dedicated vector DB (Pinecone) if >1M items

**Future Enhancements**:
- Read replicas for analytics queries
- CDN for static assets
- Redis for session caching
- ElasticSearch for full-text search

## Monitoring & Observability

- **Errors**: Sentry
- **Performance**: Sentry Transaction Monitoring
- **Analytics**: PostHog (optional)
- **Logs**: Vercel logs + structured logging
- **Uptime**: Uptime Robot or similar

## Security Layers

1. **Network**: Vercel firewall, DDoS protection
2. **Application**: Clerk auth, RLS policies
3. **Database**: RLS, encrypted connections, secrets in env vars
4. **Rate Limiting**: Upstash Redis
5. **Audit**: Sentry breadcrumbs, Prisma query logs

---

For detailed setup, see [README.md](./README.md).


