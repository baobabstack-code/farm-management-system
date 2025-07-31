# Design Document

## Overview

The Horticulture Farm Management System is designed as a modern web application using a three-tier architecture: presentation layer (React frontend), application layer (Node.js/Express API), and data layer (PostgreSQL database). The system emphasizes type safety through TypeScript, RESTful API design principles, and responsive user experience across desktop and mobile devices.

## Architecture

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (React/TS)    │◄──►│  (Node.js/TS)   │◄──►│  (PostgreSQL)   │
│                 │    │                 │    │                 │
│ - Components    │    │ - Controllers   │    │ - Tables        │
│ - State Mgmt    │    │ - Services      │    │ - Indexes       │
│ - API Client    │    │ - Middleware    │    │ - Constraints   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

- **Frontend**: Next.js 14+ with TypeScript, App Router, and Tailwind CSS for styling
- **Backend**: Next.js API Routes with TypeScript for type safety
- **Database**: PostgreSQL with Prisma ORM for type-safe database operations
- **Authentication**: NextAuth.js with JWT strategy and bcrypt for password hashing
- **API Documentation**: Swagger/OpenAPI specification with next-swagger-doc
- **Testing**: Jest for unit testing, Playwright for E2E testing
- **Development**: ESLint, Prettier for code quality, Husky for git hooks

### Next.js Specific Architecture

#### App Router Structure

```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   └── register/
│       └── page.tsx
├── dashboard/
│   └── page.tsx
├── crops/
│   ├── page.tsx
│   └── [id]/
│       └── page.tsx
├── tasks/
│   └── page.tsx
├── activities/
│   └── page.tsx
├── reports/
│   └── page.tsx
├── api/
│   ├── auth/
│   │   ├── login/
│   │   │   └── route.ts
│   │   └── register/
│   │       └── route.ts
│   ├── crops/
│   │   ├── route.ts
│   │   └── [id]/
│   │       └── route.ts
│   ├── tasks/
│   │   └── route.ts
│   └── activities/
│       └── route.ts
├── globals.css
├── layout.tsx
└── page.tsx
```

#### Prisma Schema Integration

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  username  String   @unique
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  crops     Crop[]
  tasks     Task[]
  irrigationLogs IrrigationLog[]
  fertilizerLogs FertilizerLog[]
  pestDiseaseLogs PestDiseaseLog[]
  harvestLogs HarvestLog[]

  @@map("users")
}
```

#### NextAuth.js Configuration

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          username: user.username,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    signUp: "/register",
  },
});

export { handler as GET, handler as POST };
```

## Components and Interfaces

### Core Data Models

#### User Model

```typescript
interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UserRegistration {
  username: string;
  email: string;
  password: string;
}

interface UserLogin {
  email: string;
  password: string;
}
```

#### Crop Model

```typescript
interface Crop {
  id: string;
  userId: string;
  name: string;
  variety: string;
  plantingDate: Date;
  expectedHarvestDate: Date;
  actualHarvestDate?: Date;
  status: CropStatus;
  area: number; // in square meters
  createdAt: Date;
  updatedAt: Date;
}

enum CropStatus {
  PLANTED = "planted",
  GROWING = "growing",
  FLOWERING = "flowering",
  FRUITING = "fruiting",
  HARVESTED = "harvested",
  COMPLETED = "completed",
}
```

#### Task Model

```typescript
interface Task {
  id: string;
  userId: string;
  cropId?: string;
  title: string;
  description: string;
  dueDate: Date;
  completedAt?: Date;
  priority: TaskPriority;
  category: TaskCategory;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
}

enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

enum TaskCategory {
  PLANTING = "planting",
  IRRIGATION = "irrigation",
  FERTILIZATION = "fertilization",
  PEST_CONTROL = "pest_control",
  HARVESTING = "harvesting",
  MAINTENANCE = "maintenance",
}
```

#### Activity Logs

```typescript
interface IrrigationLog {
  id: string;
  userId: string;
  cropId: string;
  date: Date;
  duration: number; // in minutes
  waterAmount: number; // in liters
  method: string;
  notes?: string;
  createdAt: Date;
}

interface FertilizerLog {
  id: string;
  userId: string;
  cropId: string;
  date: Date;
  fertilizerType: string;
  amount: number;
  applicationMethod: string;
  notes?: string;
  createdAt: Date;
}

interface PestDiseaseLog {
  id: string;
  userId: string;
  cropId: string;
  date: Date;
  type: "pest" | "disease";
  name: string;
  severity: "low" | "medium" | "high" | "critical";
  affectedArea: number;
  treatment: string;
  notes?: string;
  createdAt: Date;
}

interface HarvestLog {
  id: string;
  userId: string;
  cropId: string;
  harvestDate: Date;
  quantity: number;
  unit: string;
  qualityGrade: string;
  notes?: string;
  createdAt: Date;
}
```

### Next.js API Route Handlers

#### Example API Route Structure

```typescript
// app/api/crops/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { CropCreateSchema } from "@/lib/validations/crop";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const crops = await prisma.crop.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: crops });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = CropCreateSchema.parse(body);

    const crop = await prisma.crop.create({
      data: {
        ...validatedData,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true, data: crop }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid data or server error" },
      { status: 400 }
    );
  }
}
```

### API Endpoints Design

#### Authentication Routes

```
POST /api/auth/register - User registration
POST /api/auth/login - User login
POST /api/auth/logout - User logout
GET /api/auth/profile - Get user profile
PUT /api/auth/profile - Update user profile
```

#### Crop Management Routes

```
GET /api/crops - Get all user crops
POST /api/crops - Create new crop
GET /api/crops/:id - Get specific crop
PUT /api/crops/:id - Update crop
DELETE /api/crops/:id - Delete crop
GET /api/crops/:id/activities - Get crop activity history
```

#### Task Management Routes

```
GET /api/tasks - Get all user tasks (with filtering)
POST /api/tasks - Create new task
GET /api/tasks/:id - Get specific task
PUT /api/tasks/:id - Update task
DELETE /api/tasks/:id - Delete task
PATCH /api/tasks/:id/complete - Mark task as complete
```

#### Activity Logging Routes

```
GET /api/activities/irrigation - Get irrigation logs
POST /api/activities/irrigation - Log irrigation activity
GET /api/activities/fertilizer - Get fertilizer logs
POST /api/activities/fertilizer - Log fertilizer application
GET /api/activities/pest-disease - Get pest/disease logs
POST /api/activities/pest-disease - Log pest/disease occurrence
GET /api/activities/harvest - Get harvest logs
POST /api/activities/harvest - Log harvest data
```

#### Analytics and Reporting Routes

```
GET /api/analytics/dashboard - Get dashboard data
GET /api/analytics/yields - Get yield analytics
GET /api/analytics/resource-usage - Get resource usage data
GET /api/reports/crop-summary - Generate crop summary report
GET /api/reports/activity-summary - Generate activity summary report
```

### Frontend Component Structure

#### Page Components

- **LoginPage**: User authentication interface
- **DashboardPage**: Main overview with KPIs and quick actions
- **CropsPage**: Crop management interface with CRUD operations
- **TasksPage**: Task planning and management with calendar view
- **ActivitiesPage**: Activity logging interface with tabs for different activity types
- **ReportsPage**: Analytics and reporting dashboard
- **ProfilePage**: User profile management

#### Shared Components

- **Navigation**: Main navigation bar with responsive menu
- **CropCard**: Reusable crop display component
- **TaskCard**: Task display with status indicators
- **ActivityForm**: Generic form for logging activities
- **Calendar**: Calendar component for task scheduling
- **Charts**: Reusable chart components for analytics
- **Modal**: Generic modal component for forms and confirmations

### Database Schema Design

#### Tables Structure

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crops table
CREATE TABLE crops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  variety VARCHAR(100),
  planting_date DATE NOT NULL,
  expected_harvest_date DATE NOT NULL,
  actual_harvest_date DATE,
  status VARCHAR(20) DEFAULT 'planted',
  area DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  crop_id UUID REFERENCES crops(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  due_date TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  priority VARCHAR(10) DEFAULT 'medium',
  category VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity logs tables
CREATE TABLE irrigation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  crop_id UUID REFERENCES crops(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  duration INTEGER NOT NULL,
  water_amount DECIMAL(10,2) NOT NULL,
  method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Similar structure for fertilizer_logs, pest_disease_logs, harvest_logs
```

## Error Handling

### API Error Response Format

```typescript
interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

interface ApiSuccess<T> {
  success: true;
  data: T;
  timestamp: string;
}
```

### Error Categories

- **Validation Errors (400)**: Invalid input data, missing required fields
- **Authentication Errors (401)**: Invalid credentials, expired tokens
- **Authorization Errors (403)**: Insufficient permissions
- **Not Found Errors (404)**: Resource not found
- **Server Errors (500)**: Database errors, unexpected server issues

### Error Handling Middleware

```typescript
const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const timestamp = new Date().toISOString();

  if (err instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: err.message,
        details: err.details,
      },
      timestamp,
    });
  }

  // Handle other error types...

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred",
    },
    timestamp,
  });
};
```

## Testing Strategy

### Unit Testing

- **Models**: Test data validation, business logic
- **Services**: Test business operations, data transformations
- **Controllers**: Test request handling, response formatting
- **Utilities**: Test helper functions, validators

### Integration Testing

- **API Endpoints**: Test complete request-response cycles
- **Database Operations**: Test CRUD operations, data integrity
- **Authentication Flow**: Test login, registration, token validation

### End-to-End Testing

- **User Workflows**: Test complete user journeys
- **Cross-browser Compatibility**: Test on different browsers
- **Mobile Responsiveness**: Test on various screen sizes

### Testing Tools and Configuration

```typescript
// Jest configuration for API testing
describe("Crop API", () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  test("should create new crop", async () => {
    const cropData = {
      name: "Tomatoes",
      variety: "Cherry",
      plantingDate: "2025-04-01",
      expectedHarvestDate: "2025-07-01",
      area: 100,
    };

    const response = await request(app)
      .post("/api/crops")
      .set("Authorization", `Bearer ${authToken}`)
      .send(cropData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe("Tomatoes");
  });
});
```

This design provides a solid foundation for building a scalable, maintainable farm management system that meets all the specified requirements while following modern web development best practices.
