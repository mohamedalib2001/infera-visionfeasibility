# INFERA Vision Feasibility

## Overview

INFERA Vision Feasibility is an AI-powered SaaS platform for generating professional investment feasibility studies. The platform enables entrepreneurs, investors, and businesses to create comprehensive feasibility reports within minutes, featuring financial analysis (CAPEX/OPEX, Cash Flow, IRR/NPV/ROI), market analysis (TAM/SAM/SOM), risk assessment, and AI-generated recommendations. The application supports bilingual content (English/Arabic) and includes subscription management via Stripe.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Animations**: Framer Motion for complex animations
- **Charts**: Recharts for financial visualizations
- **Build Tool**: Vite with hot module replacement

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ES modules)
- **Authentication**: JWT-based with bcryptjs for password hashing
- **API Pattern**: RESTful JSON APIs with Zod validation
- **Build**: esbuild for production bundling

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` defines all tables including users, organizations, projects, feasibility_reports, financial_models, market_estimates, risk_items, subscriptions, projectKpis, projectCompetitors, investorPitches, documentIssuances
- **Migrations**: Drizzle Kit with `db:push` command

### AI Integration
- **Provider**: OpenAI API via Replit AI Integrations
- **Models Used**: GPT for text generation, gpt-audio-mini for voice, gpt-image-1 for images
- **Features**: Feasibility report generation, voice chat, image generation
- **Location**: `server/services/ai-service.ts` and `server/replit_integrations/`

### Investment-Grade Report Enhancements
The AI prompts enforce professional investment standards:
- **Quality Gate**: Consistency checks, conservative numbers, investor lens (not marketing)
- **Decision Structuring**: GO / Conditional GO / NO-GO with explicit conditions
- **Sensitivity Analysis**: ±10% price, ±10% costs, ±15% volume impact on IRR/NPV
- **Break-Even Analysis**: In production units AND revenue value
- **Operational Transparency**: Max capacity, utilization rate, ramp-up plan, expansion triggers
- **Worst Case Scenario**: Breakdown point, investment at risk %, early warning indicators

### Payment Processing
- **Provider**: Stripe via Replit Stripe Connector
- **Features**: Subscription management, checkout sessions, customer portal
- **Sync**: stripe-replit-sync for webhook handling and schema management

### Code Organization
```
client/src/          # React frontend
├── components/      # Reusable UI components (shadcn/ui)
├── pages/           # Route components (Landing, Dashboard, etc.)
├── lib/             # Utilities (auth, api, queryClient)
├── hooks/           # Custom React hooks

server/              # Express backend
├── routes.ts        # API route definitions
├── storage.ts       # Database operations interface
├── services/        # Business logic (AI, financial engine)
├── replit_integrations/  # Voice, chat, image, batch processing

shared/              # Shared code between client/server
├── schema.ts        # Drizzle database schema + Zod types
```

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable

### AI Services
- **OpenAI API**: Accessed through Replit AI Integrations
  - Environment variables: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`

### Payment Processing
- **Stripe**: Subscription billing and payment processing
  - Managed via Replit Stripe Connector
  - Webhook handling through `stripe-replit-sync` package

### Required Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: JWT signing secret
- `AI_INTEGRATIONS_OPENAI_API_KEY`: OpenAI API key
- `AI_INTEGRATIONS_OPENAI_BASE_URL`: OpenAI base URL
- Stripe credentials auto-configured via Replit connector

### Key NPM Packages
- `drizzle-orm` / `drizzle-kit`: Database ORM and migrations
- `@tanstack/react-query`: Server state management
- `framer-motion`: Animation library
- `jspdf`: PDF report generation
- `recharts`: Financial charts and graphs
- `zod`: Runtime type validation
- `stripe`: Payment processing SDK

## Production Hardening

### Health Check Endpoints
- **GET /api/health**: Liveness probe with database and memory checks
- **GET /api/health/ready**: Readiness probe with full service verification (DB, AI, Stripe, Email)

### Data Protection
- **Soft Delete**: All deletions use soft-delete with `isActive`/`isDeleted` fields
- **Audit Logging**: All CRUD operations logged to `audit_logs` table
- **Restore Capability**: Admin can restore soft-deleted users and projects

### Resilience Patterns
- **Circuit Breaker**: AI service wrapped with circuit breaker (closed/open/half-open states)
  - Location: `server/lib/circuit-breaker.ts`
  - Failure threshold: 5 failures, reset timeout: 30s
- **Structured Logging**: JSON logging in production, colored console in development
  - Location: `server/lib/logger.ts`
  - Log levels: debug, info, warn, error

### Database Schema Notes
- Users table has `isActive` for soft-delete (default: true)
- Projects table has `isDeleted` and `deletedAt` for soft-delete
- Reports table has `isDeleted` and `deletedAt` for soft-delete
- Dependent entities (financial_models, market_estimates, risk_items) have `isDeleted` and `deletedAt` for soft-delete
  - All queries filter out deleted records
  - Cascade soft-delete when parent report is deleted
  - Cascade restore when parent report is restored
  - Permanent delete is admin-only for GDPR compliance
- `platform_config` table for dynamic configuration (future use)
- `audit_logs` table tracks all data operations

### Storage Methods
- `deleteUser()`, `deleteProject()`, `deleteReport()`: Soft-delete with audit logging and cascade
- `restoreUser()`, `restoreProject()`, `restoreReport()`: Restore soft-deleted entities with cascade
- `permanentlyDeleteUser()`, `permanentlyDeleteProject()`: Admin-only hard delete with cascade
- `getOrganizationById()`: Fetch organization details for issuer info in reports

### Document Issuance & Recipient Tracking
- **Projects table**: Includes client/recipient fields (clientName, clientCompany, clientEmail, clientPhone, clientAddress, clientType)
- **PDF Cover Page**: Displays both issuer (subscriber) and recipient (client) information
- **Issuer Info**: Pulled from authenticated user's name and organization
- **Recipient Info**: Optional fields captured during project creation via bilingual form
- **Smart Tools Tables**: projectKpis, projectCompetitors, investorPitches for enhanced analytics

### Mobile Responsiveness

**Breakpoint Strategy:**
- Mobile: < 640px (default)
- sm: >= 640px
- md: >= 768px
- lg: >= 1024px

**Key Mobile Patterns:**
- Landing page: Hamburger menu (Sheet component) for mobile navigation
- Dashboard/Reports: Headers wrap with flex-col sm:flex-row, buttons full-width on mobile
- ReportView: Horizontally scrollable tabs with overflow-x-auto
- Grids: 1 col mobile → 2 cols sm → 3+ cols md/lg
- AppShell: Sidebar overlays on mobile (zero margin), sticky header with sidebar trigger

**Component-Level Patterns:**
- Text sizes: text-2xl sm:text-3xl for headings
- Cards: flex-col sm:flex-row for card content
- Buttons: w-full sm:w-auto for primary actions
- Text truncation: truncate class with min-w-0 parent

### RTL (Right-to-Left) Arabic Support

**Global RTL Management:**
- AuthProvider (auth.tsx) manages RTL direction as single source of truth
- Sets document.documentElement.dir and lang on mount from localStorage
- Updates direction when user.language changes
- Falls back to localStorage for unauthenticated users

**CSS Implementation (index.css):**
- Global text alignment: html[dir="rtl"] body { text-align: right }
- Input fields alignment for RTL
- Table and list alignment with logical padding
- Number isolation for inputs and [data-type="number"]
- Prose content alignment

**Per-Page RTL Support:**
All major pages have explicit RTL text alignment:
- Landing, Login, Register (standalone)
- Dashboard, Reports, Analytics, HelpCenter, Contact (via DashboardLayout)
- NewProject, ProjectDetail, ReportView (all states)
- Pricing, AdminDashboard, not-found

**PDF Export RTL (Professional Multi-Page):**
- Multi-page architecture with 9 separate pages:
  1. Cover page with logo, project details, branding
  2. Table of contents with section list
  3. Executive Summary with GO/NO-GO decision
  4. Market Analysis with TAM/SAM/SOM table
  5. Technical/Operational Analysis
  6. Financial Analysis (CAPEX, OPEX, cash flows, scenarios)
  7. Risk Analysis with color-coded severity matrix
  8. Recommendations with implementation steps
  9. Conclusion with final investment recommendation
- Page-aware rendering with headers/footers and page numbers
- Each page rendered separately via html2canvas at 2x scale
- Full RTL with direction: rtl, text-align: right
- Arabic font stack: Cairo, Segoe UI, Arial, Tahoma
- Color-coded metrics and risk indicators
- Professional styling with cards, tables, and section breaks

**ReportView Tab Order:**
- Tabs are reversed in DOM order for correct RTL keyboard navigation
- Uses explicit array reversal instead of CSS flex-direction

**Layout Architecture (AppShell):**
- Persistent SidebarProvider without key={lang} - prevents remount on language changes
- MainContent component uses useSidebar hook for state-aware margins
- Explicit margin-based space reservation:
  - RTL: marginRight based on sidebar width
  - LTR: marginLeft based on sidebar width
  - Dynamic adjustment for collapsed state (16rem expanded, 3rem collapsed)
  - Zero margin on mobile (sidebar overlays)
- Layout isolation: Auth state changes don't trigger layout recalculation

### Known Limitations
- Stripe schema warnings on startup (non-blocking, uses API fallback)
- AI health check uses minimal chat completion (cached 5 minutes) due to proxy limitations
- RTL spacing uses per-component classes; full logical properties (ms/me) migration pending
- Numeric displays require data-type="number" attribute for LTR isolation