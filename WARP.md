# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a **Farm Management System** built with Next.js 15 and TypeScript, designed to help farmers manage crops, tasks, and agricultural activities. The system uses a modern tech stack with Prisma ORM, PostgreSQL database, Clerk authentication, and Tailwind CSS for styling.

**Live Production URL:** https://farm-management-system-8tuyalxsk-baobab-stacks-projects.vercel.app

## Development Commands

### Environment Setup

```bash
# Install dependencies (uses pnpm in production)
npm install

# Generate Prisma client (runs automatically after install)
npx prisma generate

# Push database schema to PostgreSQL
npx prisma db push

# View database in Prisma Studio
npx prisma studio
```

### Development Workflow

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Type check without building
npx tsc --noEmit
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Fix ESLint issues automatically
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting without fixing
npm run format:check
```

### Database Operations

```bash
# Reset database and apply schema
npx prisma migrate reset

# Create and apply new migration
npx prisma migrate dev --name descriptive_name

# Apply migrations in production
npx prisma migrate deploy

# Seed database (if seed script exists)
npx prisma db seed
```

### Single File/Component Development

```bash
# Run single test file (if tests exist)
npm test -- --testNamePattern="component-name"

# Type check specific file
npx tsc path/to/file.ts --noEmit

# Lint specific file
npx eslint path/to/file.ts --fix
```

## Architecture Overview

### Technology Stack

- **Framework:** Next.js 15 with App Router and TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** Clerk (replaces NextAuth.js)
- **Styling:** Tailwind CSS with custom utility classes
- **AI Features:** Feature flag system for AI analytics (production-ready)
- **Deployment:** Vercel with environment variable management

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages (grouped route)
│   ├── api/               # API routes (route handlers)
│   │   ├── crops/         # CRUD operations for crops
│   │   ├── tasks/         # Task management endpoints
│   │   ├── ai/            # AI analytics endpoints
│   │   └── [activity]/    # Activity logging (irrigation, fertilizer, etc.)
│   ├── crops/             # Crop management pages
│   ├── dashboard/         # Main dashboard with AI insights
│   ├── tasks/             # Task planning interface
│   └── reports/           # Analytics and reporting
├── components/            # Reusable React components
│   ├── ui/               # Base UI components (shadcn/ui style)
│   ├── ai/               # AI-specific components
│   └── providers/        # Context providers
├── lib/                   # Utility libraries and configurations
│   ├── db/               # Database services and queries
│   ├── ai-bridge/        # AI data access layer
│   ├── validations/      # Zod schemas for API validation
│   ├── prisma.ts         # Prisma client configuration
│   ├── feature-flags.ts  # AI feature flag management
│   └── utils.ts          # Shared utility functions
└── types/                # TypeScript type definitions
```

### Key Architectural Patterns

#### Database Architecture

- **Prisma ORM** with PostgreSQL for type-safe database operations
- **User-scoped data:** All resources (crops, tasks, logs) are tied to `userId` managed by Clerk
- **Activity logging:** Separate models for irrigation, fertilizer, pest/disease, and harvest tracking
- **Enum-based status management:** Crop status, task priority/category, etc.

#### API Route Structure

- **RESTful endpoints:** Following REST conventions for CRUD operations
- **Route handlers:** Next.js 13+ API routes in `app/api/` directory
- **Authentication middleware:** Clerk integration for protected routes
- **Zod validation:** Input validation using Zod schemas

#### Authentication Flow

- **Clerk Authentication:** Replaces traditional NextAuth.js setup
- **Route protection:** Uses Clerk's middleware for protected routes
- **User context:** User ID from Clerk session manages all data access

#### AI Integration Architecture

- **Feature flags:** Controlled rollout using environment variables and localStorage
- **Data bridge:** Safe, read-only access to farm data for AI analysis
- **Non-disruptive:** AI features are additive, existing functionality unchanged
- **Production ready:** Live AI analytics with confidence scoring

## Important Implementation Details

### Database Schema Key Points

- No explicit User model (Clerk manages users)
- All models include `userId: String` for data isolation
- Cascade deletes for activity logs when crops are deleted
- Enum types for consistent status management

### Authentication Integration

- Clerk replaces NextAuth.js completely
- Use `@clerk/nextjs` for components and hooks
- Server-side auth via Clerk's session management
- Redirect configuration in root layout

### AI Feature Development

- Check `src/lib/feature-flags.ts` for available AI features
- Use `useFeatureFlag()` hook in components
- AI endpoints protected by feature flags
- Data access through `src/lib/ai-bridge/data-access.ts`

### Environment Variables (Production)

```bash
# Database
DATABASE_URL="postgresql://..."

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# AI Feature Flags
ENABLE_AI_ANALYTICS="true"
ENABLE_AI_CROP_RECOMMENDATIONS="false"
ENABLE_AI_FINANCIAL_INSIGHTS="false"
```

### Component Development Patterns

- Use `cn()` utility for conditional CSS classes (Tailwind + clsx)
- Follow shadcn/ui patterns for base components
- Feature flag checks for conditional rendering
- Consistent date formatting using `formatDate()` and `formatDateTime()`

### API Development Guidelines

- Always validate input with Zod schemas
- Include proper error handling with HTTP status codes
- Use Clerk session for user authentication
- Return consistent API response format: `{ success: boolean, data?: any, error?: string }`

### Deployment Considerations

- Vercel deployment with automatic builds
- Environment variables managed through Vercel dashboard
- Database migrations must be applied manually to production
- Feature flags allow for gradual AI feature rollout

## Development Workflow Best Practices

### When Adding New Features

1. Check if feature flags are needed for controlled rollout
2. Add Zod validation schemas in `src/lib/validations/`
3. Create database service functions in `src/lib/db/services/`
4. Implement API routes with proper error handling
5. Build UI components with loading and error states
6. Test with various user scenarios and edge cases

### When Working with AI Features

1. Verify feature flags are enabled in environment
2. Use `src/lib/ai-bridge/data-access.ts` for data access
3. Include confidence levels and actionable indicators
4. Implement graceful fallbacks for when AI is disabled
5. Follow the pattern established in AI analytics endpoint

### Database Schema Changes

1. Create migration with descriptive name
2. Update TypeScript types if needed
3. Modify Prisma service functions
4. Test with existing data scenarios
5. Consider backward compatibility for production

This farm management system is production-ready with live users and includes innovative AI features for agricultural insights. The architecture supports both traditional farm management workflows and modern AI-powered analytics in a seamless, non-disruptive manner.
