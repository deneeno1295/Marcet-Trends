# Insight Graph Web App

A production-ready, multi-tenant web application for ingesting, connecting, and visualizing insights across people, trends, and time. Built with Next.js 14, Supabase, and OpenAI.

## Features

### 🔍 Content Ingestion
- **URL/Text/File Ingestion**: Drop content via URLs, text, or files
- **Automatic Processing**: AI-powered summarization, tagging, and entity extraction
- **Batch Processing**: Efficient embedding generation for cost optimization
- **RSS Feed Integration**: Automated periodic ingestion from RSS sources

### 📊 Visualization
- **Interactive Graph**: Cytoscape.js-powered network visualization with performance optimizations
- **Timeline View**: Calendar heatmap and filterable timeline of insights
- **Real-time Updates**: Optimistic UI updates for responsive user experience

### 👥 Insight Hubs
- **Person Hubs**: Track individuals with activity feeds, top claims, contradictions, and momentum metrics
- **Trend Hubs**: Monitor macro trends with sparklines, heatmaps, and signal tracking
- **Link Discovery**: Automatic and manual linking between related insights

### 📧 Newsletters
- **Template-based Generation**: Daily Pulse and Weekly Executive Brief templates
- **Audience Tuning**: Customizable output based on audience (Leadership, Product, etc.)
- **Salesforce Integration**: Optional push to Salesforce via Platform Events

### 🏢 Multi-Tenancy
- **Workspaces**: Isolated environments for different teams
- **Role-Based Access**: OWNER, ADMIN, EDITOR, VIEWER roles with RLS enforcement
- **Salesforce SSO**: OAuth integration with Salesforce

### 🔧 Production Features
- **Error Monitoring**: Sentry integration for tracking errors and performance
- **Rate Limiting**: Upstash Redis-powered API rate limiting
- **Background Jobs**: Inngest for reliable job processing with retries
- **CI/CD**: GitHub Actions workflows for automated testing and deployment

## Tech Stack

- **Framework**: Next.js 14 (App Router) with TypeScript
- **Database**: Supabase Postgres with pgvector extension
- **ORM**: Prisma with RLS policies
- **Authentication**: Clerk with Salesforce OAuth support
- **LLM**: OpenAI (GPT-4 Turbo, text-embedding-3-small)
- **Background Jobs**: Inngest
- **UI**: Tailwind CSS + shadcn/ui + Lucide icons
- **Graph Visualization**: Cytoscape.js with cola layout
- **Error Tracking**: Sentry
- **Rate Limiting**: Upstash Redis
- **Analytics**: PostHog (optional)

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- Supabase account (or local Postgres with pgvector)
- Clerk account
- OpenAI API key
- (Optional) Salesforce Connected App
- (Optional) Upstash Redis account
- (Optional) Sentry account

### 1. Clone and Install

```bash
git clone <repository-url>
cd insight-graph-app
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env.local` and fill in the required values:

```bash
cp .env.example .env.local
```

**Required variables:**

```env
# Database (Supabase)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."

# OpenAI
OPENAI_API_KEY="sk-..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Optional variables:**

```env
# Salesforce OAuth
SALESFORCE_CLIENT_ID="..."
SALESFORCE_CLIENT_SECRET="..."
SALESFORCE_DOMAIN="login.salesforce.com"

# Inngest
INNGEST_EVENT_KEY="..."
INNGEST_SIGNING_KEY="..."

# Upstash Redis
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."

# Sentry
NEXT_PUBLIC_SENTRY_DSN="..."
SENTRY_ORG="..."
SENTRY_PROJECT="..."
SENTRY_AUTH_TOKEN="..."

# PostHog
NEXT_PUBLIC_POSTHOG_KEY="..."
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"
```

### 3. Database Setup

**Initialize Prisma:**

```bash
npm run db:generate
npm run db:push
```

**Apply RLS policies** (if using Supabase):

```bash
psql $DATABASE_URL < prisma/rls-policies.sql
```

**Seed demo data:**

```bash
npm run db:seed
```

### 4. Salesforce Setup (Optional)

If integrating with Salesforce:

1. **Create a Connected App** in Salesforce:
   - Setup → App Manager → New Connected App
   - Enable OAuth Settings
   - Callback URL: `https://your-domain.com/api/auth/salesforce/callback`
   - Scopes: `api`, `refresh_token`, `openid`

2. **Deploy custom objects**:

```bash
cd salesforce
chmod +x deploy.sh
./deploy.sh
```

3. **Configure Clerk** with Salesforce as a custom OAuth provider.

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Default demo credentials** (after seeding):
- Email: `demo@insightgraph.com`
- Workspace: `demo-workspace`

### 6. Run Background Jobs (Optional)

In a separate terminal, start the Inngest dev server:

```bash
npm run inngest:dev
```

## Project Structure

```
insight-graph-app/
├── prisma/
│   ├── schema.prisma           # Database schema with pgvector
│   ├── migrations/             # Database migrations
│   ├── rls-policies.sql        # Row-level security policies
│   └── seed.ts                 # Demo data seeder
├── salesforce/
│   ├── custom-objects.json     # SF object definitions
│   └── deploy.sh               # Deployment script
├── src/
│   ├── app/
│   │   ├── api/                # API routes
│   │   ├── w/[slug]/           # Workspace routes
│   │   │   ├── drop/           # Content ingestion
│   │   │   ├── viz/            # Visualizations
│   │   │   ├── hubs/           # Person & Trend hubs
│   │   │   └── newsletters/    # Newsletter composer
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   └── workspace-nav.tsx   # Navigation component
│   ├── lib/
│   │   ├── db.ts               # Prisma client
│   │   ├── env.ts              # Environment validation
│   │   ├── llm.ts              # LLM service interface
│   │   ├── rate-limit.ts       # Upstash rate limiting
│   │   ├── utils.ts            # Utility functions
│   │   ├── inngest/            # Background jobs
│   │   └── salesforce/         # Salesforce integration
│   └── middleware.ts           # Clerk auth middleware
├── .github/
│   └── workflows/
│       └── ci.yml              # CI/CD pipeline
└── README.md
```

## Usage

### Ingesting Content

1. Navigate to **Drop** in the workspace nav
2. Paste a URL (e.g., blog post, article)
3. Preview the extracted content, summary, and tags
4. Confirm to save the insight

The system will:
- Extract content using Readability
- Generate AI summary and tags
- Create embeddings for similarity search
- Extract people and trends via NER
- Calculate relevance scores

### Creating Links

In the **Graph** view:
- Select two nodes
- Click "Create Link"
- Choose relation type: `supports`, `contradicts`, `relates_to`, `evolves_from`

### Generating Newsletters

1. Go to **Newsletters** → **New Newsletter**
2. Select period (e.g., last 7 days)
3. Choose audience (Leadership, Product, etc.)
4. Choose cadence (Daily, Weekly)
5. Generate

The system will:
- Retrieve items from the period
- Calculate trend momentum
- Generate HTML using Handlebars templates
- Store the newsletter for download/sharing

### Viewing Insights

**Person Hubs:**
- Activity feed of recent insights
- Top claims (highest scored items)
- Contradictions (conflicting statements)
- Momentum (4-week rolling count)

**Trend Hubs:**
- Sparkline showing weekly momentum
- Top insights related to the trend
- Heatmap by source
- Contradictions within the trend

## API Endpoints

### Items

- `GET /api/w/[slug]/items` - List items
- `POST /api/w/[slug]/items` - Create item

### Links

- `GET /api/w/[slug]/links` - List links
- `POST /api/w/[slug]/links` - Create link

### Drop (Ingestion)

- `POST /api/w/[slug]/drop` - Ingest content from URL

### Newsletters

- `GET /api/w/[slug]/newsletters` - List newsletters
- `POST /api/w/[slug]/newsletters` - Generate newsletter

### Inngest

- `POST /api/inngest` - Inngest webhook endpoint

## Testing

### Unit Tests

```bash
npm test
```

### E2E Tests

```bash
npm run test:e2e
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## Deployment

### Vercel (Recommended)

1. **Connect repository** to Vercel
2. **Add environment variables** in Vercel dashboard
3. **Deploy**:

```bash
vercel --prod
```

4. **Run migrations** after deployment:

```bash
npm run db:migrate
```

### Manual Deployment

1. **Build**:

```bash
npm run build
```

2. **Start production server**:

```bash
npm start
```

## CI/CD

The GitHub Actions workflow (`.github/workflows/ci.yml`) automatically:

- Runs type checking and linting
- Executes unit tests
- Builds the application
- Runs E2E tests with Playwright
- Deploys preview for PRs
- Deploys to production on main branch merge

**Required GitHub Secrets:**

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `OPENAI_API_KEY`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## Performance Optimizations

### Graph Visualization

- **Lazy Loading**: Limits initial render to 100 nodes
- **Subgraph Rendering**: Renders visible portion first
- **Efficient Layouts**: Uses cola for large graphs (faster than force-directed)
- **Debounced Updates**: Batches graph updates

### Embeddings

- **Batch Processing**: Groups multiple embeddings in single API call
- **Caching**: Stores embeddings in database to avoid regeneration
- **Reduced Dimensions**: Uses 1536-dim embeddings for balance of accuracy and speed

### Database

- **Indexes**: Strategic indexes on `workspaceId`, `occurredAt`, `score`
- **Vector Index**: IVFFlat index for fast similarity search
- **RLS**: Row-level security enforced at database level

## Troubleshooting

### Database Connection Issues

If you see "Cannot connect to database":
- Verify `DATABASE_URL` is correct
- Check Supabase/Postgres is running
- Ensure pgvector extension is installed

### Clerk Authentication Errors

- Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`
- Check allowed redirect URLs in Clerk dashboard

### OpenAI API Errors

- Verify `OPENAI_API_KEY` is valid
- Check rate limits and quotas
- Monitor Sentry for detailed error traces

### Graph Not Rendering

- Check browser console for Cytoscape errors
- Ensure items and links exist in database
- Try clearing browser cache

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues, questions, or contributions, please open an issue on GitHub.

---

Built with ❤️ using Next.js, Supabase, OpenAI, and modern web technologies.


