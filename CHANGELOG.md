# Changelog

All notable changes to the Insight Graph project will be documented in this file.

## [0.1.0] - 2024-01-01

### Initial Release

#### Features

**Core Functionality**
- ✅ Multi-tenant workspace architecture with RLS
- ✅ User authentication via Clerk with Salesforce OAuth support
- ✅ Content ingestion from URLs with AI-powered processing
- ✅ Interactive graph visualization using Cytoscape.js
- ✅ Timeline view with calendar heatmap
- ✅ Person and Trend hub pages with analytics
- ✅ Newsletter generation with customizable templates
- ✅ Real-time link creation between insights

**Database**
- ✅ Prisma ORM with PostgreSQL + pgvector
- ✅ Complete data model (Items, Links, People, Trends, Newsletters)
- ✅ Row-level security policies for multi-tenancy
- ✅ Vector similarity search with IVFFlat indexes

**Background Jobs (Inngest)**
- ✅ Web content ingestion pipeline
- ✅ RSS feed sync (foundation)
- ✅ Newsletter digest generation
- ✅ Batch embedding processing for cost optimization

**LLM Integration**
- ✅ OpenAI GPT-4 Turbo for summarization and tagging
- ✅ text-embedding-3-small for semantic search
- ✅ Named entity recognition for people and trends
- ✅ Batch embedding API for efficiency

**Salesforce Integration**
- ✅ OAuth authentication flow
- ✅ Custom object definitions (Insight__c, Waypoint__c)
- ✅ Platform Event (Insight_Digest__e)
- ✅ Push/pull sync capabilities
- ✅ Deployment scripts

**Production Features**
- ✅ Sentry error monitoring and performance tracking
- ✅ Upstash Redis rate limiting
- ✅ CI/CD pipeline via GitHub Actions
- ✅ Automated testing (unit + E2E with Playwright)
- ✅ Vercel deployment configuration

**UI/UX**
- ✅ Modern, responsive design with Tailwind CSS
- ✅ shadcn/ui component library
- ✅ Optimistic UI updates
- ✅ Loading states and error handling
- ✅ Accessible components

#### Documentation
- ✅ Comprehensive README with setup instructions
- ✅ Architecture documentation
- ✅ Salesforce deployment guide
- ✅ Environment configuration examples
- ✅ API documentation

#### Developer Experience
- ✅ TypeScript throughout
- ✅ ESLint and Prettier configuration
- ✅ Vitest for unit testing
- ✅ Playwright for E2E testing
- ✅ Database seeding script with demo data

### Known Limitations

- RSS ingestion requires RSS parser integration (placeholder implemented)
- Salesforce metadata deployment script is a template (XML conversion needed)
- PostHog integration is optional and not fully configured
- Graph visualization limited to 100 nodes initially (optimization needed for larger graphs)

### Next Steps

**v0.2.0 Roadmap**
- [ ] Complete RSS feed parser integration
- [ ] Add bulk import/export functionality
- [ ] Implement search across all insights
- [ ] Add email delivery for newsletters
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] AI-powered link suggestions
- [ ] Custom LLM provider support (Anthropic, etc.)
- [ ] API key management for developers
- [ ] Webhook support for integrations

**Performance Improvements**
- [ ] Implement graph pagination/virtualization
- [ ] Add Redis caching layer
- [ ] Optimize database queries with materialized views
- [ ] Implement background embedding generation queue

**New Features**
- [ ] Collaborative editing
- [ ] Comments and annotations
- [ ] Version history for insights
- [ ] Public sharing links
- [ ] Export to various formats (PDF, Markdown, JSON)
- [ ] Integration marketplace

---

## Release Notes Format

Each release will include:
- New features
- Bug fixes
- Performance improvements
- Breaking changes
- Upgrade instructions
- Deprecation notices


