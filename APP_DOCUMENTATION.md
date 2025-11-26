# FarmFlow - Comprehensive Farm Management System

## Overview

FarmFlow is a modern, full-stack web application designed to help farmers manage their agricultural operations efficiently. It provides comprehensive tools for crop management, task planning, financial tracking, equipment management, soil analysis, weather monitoring, and AI-powered farming insights.

## What the App Does

### Core Features

#### 1. **Crop Management**

- Track multiple crops with detailed information (variety, planting dates, harvest dates)
- Monitor crop status through growth stages (PLANTED, GROWING, FLOWERING, FRUITING, HARVESTED)
- Record crop-specific activities and logs
- Link crops to specific fields for better organization
- Track expected vs. actual harvest dates

#### 2. **Field Management**

- Manage multiple fields with area measurements
- Store field boundaries using GeoJSON polygons
- Track soil type, drainage, and irrigation systems
- Associate crops with specific fields
- Monitor field-level activities and costs

#### 3. **Task Management**

- Create and assign farming tasks with priorities (LOW, MEDIUM, HIGH, URGENT)
- Categorize tasks (PLANTING, IRRIGATION, FERTILIZATION, PEST_CONTROL, HARVESTING, MAINTENANCE)
- Track task status (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
- Set due dates and completion tracking
- Link tasks to specific crops

#### 4. **Activity Logging**

- **Irrigation Logs**: Track water usage, duration, and irrigation methods
- **Fertilizer Logs**: Record fertilizer applications with type, amount, and method
- **Pest & Disease Logs**: Monitor pest/disease incidents with severity levels and treatments
- **Harvest Logs**: Document harvest quantities, quality grades, and dates

#### 5. **Soil Management**

- Conduct soil tests with comprehensive nutrient analysis (pH, N, P, K, organic matter)
- Track soil amendments and applications
- Monitor soil health trends over time
- Get AI-powered soil improvement recommendations
- Link soil data to specific fields and crops

#### 6. **Weather Integration**

- Real-time weather data and forecasts
- Weather alerts for farming-critical conditions (frost, storms, drought, floods)
- Historical weather pattern analysis
- Weather-based farming recommendations
- Integration with farming activities for optimal timing

#### 7. **Financial Management**

- Track income and expenses by category
- Multiple account management (checking, savings, credit cards)
- Supplier/vendor management
- Budget creation and tracking
- Cost allocation by crop and field
- QuickBooks integration for accounting
- Financial transaction history
- Payment status tracking

#### 8. **Equipment Management**

- Comprehensive equipment inventory
- Maintenance scheduling and logging
- Fuel usage tracking
- Equipment status and condition monitoring
- Service history and warranty tracking
- Equipment utilization metrics
- Rental rate management for shared equipment

#### 9. **Land Preparation**

- Tillage operation planning and tracking
- Equipment allocation for land prep
- Workflow management for preparation steps
- Soil condition monitoring during prep
- Cost tracking for land preparation activities

#### 10. **Pre-Season Planning**

- Create comprehensive seasonal plans
- Crop rotation planning with multi-year cycles
- Resource allocation (seeds, fertilizer, labor, equipment)
- Budget planning and risk assessment
- Market analysis integration
- Seasonal task scheduling

#### 11. **AI-Powered Insights** (Google Gemini Integration)

- Conversational AI farming assistant
- Context-aware recommendations based on farm data
- Crop health analysis and recommendations
- Financial insights and optimization suggestions
- Weather-based activity recommendations
- Pest and disease identification assistance
- Personalized farming advice

#### 12. **Analytics & Reporting**

- Farm performance dashboards
- Crop yield analysis
- Cost analysis and profitability tracking
- Activity timeline visualization
- Resource utilization reports
- Trend analysis over time

## Tech Stack

### Frontend

- **Framework**: Next.js 15.5.6 (React 19.1.0)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3.4.17
- **UI Components**:
  - Radix UI primitives (labels, progress, select, separator, toast)
  - Custom component library
  - Lucide React icons
- **State Management**: React hooks and context
- **Form Handling**: Zod 4.0.14 for validation
- **Date Handling**: date-fns 4.1.0

### Backend

- **Runtime**: Node.js 20
- **Framework**: Next.js API Routes (serverless functions)
- **Database**: PostgreSQL (via Prisma)
- **ORM**: Prisma 6.13.0
- **Authentication**: Clerk 5.7.1 (NextAuth alternative)
- **API Client**: Axios 1.12.2

### AI & Machine Learning

- **AI Provider**: Google Generative AI (Gemini)
- **Package**: @google/generative-ai 0.24.1
- **Models**: Gemini 1.5 Flash
- **Features**:
  - Chat-based assistance
  - Context-aware responses
  - Multi-turn conversations
  - Structured insights generation

### Database & Data Management

- **Primary Database**: PostgreSQL
- **ORM**: Prisma with comprehensive schema
- **Data Models**: 40+ models covering all farming aspects
- **Relationships**: Complex relational data with cascading deletes
- **Migrations**: Prisma migrations for schema versioning

### External Integrations

- **Weather**: Custom weather service integration
- **Accounting**: QuickBooks Online integration (node-quickbooks 2.0.46)
- **Analytics**: Vercel Analytics & Speed Insights
- **Storage**: Supabase 2.57.4 (for file storage and additional features)

### Development Tools

- **Package Manager**: pnpm
- **Linting**: ESLint 9 with Next.js config
- **Formatting**: Prettier 3.6.2
- **Testing**: Jest 30.2.0 with React Testing Library
- **Git Hooks**: Husky 9.1.7 with lint-staged
- **Build Tool**: Next.js built-in (Turbopack/Webpack)

### Security & Authentication

- **Auth Provider**: Clerk (modern auth platform)
- **Session Management**: Clerk middleware
- **Protected Routes**: Route-based authentication
- **Security Headers**: Comprehensive security headers in Next.js config
  - HSTS, XSS Protection, Frame Options
  - Content Security, Referrer Policy
  - DNS Prefetch Control

### Deployment & Hosting

- **Platform**: Vercel (optimized for Next.js)
- **Database Hosting**: PostgreSQL (likely Vercel Postgres or Supabase)
- **Environment**: Production, staging, and development environments
- **CI/CD**: GitHub Actions ready (configuration present)

### Code Quality

- **TypeScript**: Strict type checking
- **ESLint**: Code quality enforcement
- **Prettier**: Code formatting
- **Pre-commit Hooks**: Automated linting and formatting
- **Testing**: Unit and integration tests

## Architecture

### Application Structure

```
├── src/
│   ├── app/                    # Next.js 15 App Router
│   │   ├── (auth)/            # Authentication pages
│   │   ├── api/               # API routes (serverless functions)
│   │   ├── dashboard/         # Main dashboard
│   │   ├── crops/             # Crop management pages
│   │   ├── fields/            # Field management
│   │   ├── tasks/             # Task management
│   │   ├── equipment/         # Equipment tracking
│   │   ├── soil/              # Soil management
│   │   ├── weather/           # Weather dashboard
│   │   ├── planning/          # Pre-season planning
│   │   ├── settings/          # User settings
│   │   └── ai-companion/      # AI assistant interface
│   ├── components/            # React components
│   │   ├── ui/               # Reusable UI components
│   │   ├── ai/               # AI-specific components
│   │   ├── fields/           # Field components
│   │   ├── planning/         # Planning components
│   │   ├── soil/             # Soil management components
│   │   └── weather/          # Weather components
│   ├── lib/                   # Business logic & utilities
│   │   ├── ai/               # AI service layer
│   │   ├── db/               # Database services
│   │   ├── services/         # External service integrations
│   │   └── validations/      # Zod schemas
│   ├── hooks/                 # Custom React hooks
│   ├── types/                 # TypeScript type definitions
│   └── utils/                 # Utility functions
├── prisma/                    # Database schema & migrations
├── ai-agents/                 # AI agent configurations
└── public/                    # Static assets
```

### Data Flow

1. **User Interface** → React components with Tailwind CSS
2. **Client-Side Logic** → Custom hooks and context providers
3. **API Layer** → Next.js API routes (serverless)
4. **Business Logic** → Service layer in `/lib`
5. **Data Access** → Prisma ORM
6. **Database** → PostgreSQL
7. **External Services** → Weather, AI, QuickBooks APIs

### Key Design Patterns

- **Server Components**: Leveraging Next.js 15 server components
- **API Routes**: RESTful API design with Next.js route handlers
- **Service Layer**: Separation of business logic from routes
- **Repository Pattern**: Database access abstraction via Prisma
- **Component Composition**: Reusable UI components with Radix UI
- **Type Safety**: End-to-end TypeScript for type safety

## Key Technologies Explained

### Why Next.js 15?

- Server-side rendering for better SEO and performance
- API routes for backend functionality without separate server
- File-based routing for intuitive page structure
- Built-in optimization (images, fonts, scripts)
- Excellent developer experience

### Why Prisma?

- Type-safe database queries
- Automatic migrations
- Intuitive schema definition
- Excellent TypeScript integration
- Database agnostic (easy to switch databases)

### Why Clerk?

- Modern authentication with minimal setup
- Built-in user management UI
- Social login support
- Secure session management
- Excellent Next.js integration

### Why Google Gemini AI?

- Advanced language understanding
- Context-aware responses
- Cost-effective compared to alternatives
- Multi-turn conversation support
- Function calling capabilities

### Why Tailwind CSS?

- Utility-first approach for rapid development
- Consistent design system
- Small bundle size (purges unused styles)
- Responsive design made easy
- Dark mode support built-in

## Database Schema Highlights

The application uses 40+ interconnected models including:

- Core entities: Crops, Fields, Tasks, Equipment
- Activity logging: Irrigation, Fertilizer, Pest/Disease, Harvest
- Financial: Accounts, Transactions, Budgets, Suppliers
- Planning: Pre-season plans, Crop rotation, Resource allocation
- Soil: Tests, Amendments, Trends
- Weather: Current data, Forecasts, Alerts
- Equipment: Maintenance, Fuel logs
- Integration: QuickBooks sync, Activity tracking

## API Endpoints

The app provides 50+ API endpoints organized by feature:

- `/api/crops` - Crop CRUD operations
- `/api/fields` - Field management
- `/api/tasks` - Task management
- `/api/activities` - Activity logging
- `/api/soil/*` - Soil management
- `/api/weather/*` - Weather data
- `/api/financial/*` - Financial operations
- `/api/ai/*` - AI-powered features
- `/api/planning/*` - Pre-season planning
- `/api/land-preparation/*` - Land prep operations
- `/api/quickbooks/*` - QuickBooks integration

## Development Workflow

### Getting Started

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env

# Run database migrations
npx prisma migrate dev

# Start development server
pnpm dev
```

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix linting issues
- `pnpm format` - Format code with Prettier
- `pnpm test` - Run tests

### Code Quality

- Pre-commit hooks ensure code quality
- Automatic linting and formatting on commit
- TypeScript strict mode enabled
- Comprehensive test coverage

## Future Enhancements

Based on the codebase, planned features include:

- Mobile app with gesture support (hooks present)
- Enhanced analytics with ML predictions
- IoT sensor integration for real-time monitoring
- Multi-farm management
- Team collaboration features
- Advanced reporting and data export
- Offline mode support
- Mobile-responsive improvements

## Security Features

- HTTPS enforcement with HSTS
- XSS protection headers
- Frame protection (clickjacking prevention)
- Content type sniffing prevention
- Referrer policy for privacy
- Permissions policy for browser features
- Clerk authentication with secure sessions
- Environment variable protection
- SQL injection prevention via Prisma
- Input validation with Zod

## Performance Optimizations

- Server-side rendering for fast initial loads
- Static generation where possible
- Image optimization with Next.js Image
- Code splitting and lazy loading
- Vercel Edge Network for global CDN
- Database query optimization with Prisma
- Caching strategies for API responses

---

**Version**: 0.1.0  
**License**: Private  
**Platform**: Web (Desktop & Mobile browsers)  
**Deployment**: Vercel  
**Database**: PostgreSQL
