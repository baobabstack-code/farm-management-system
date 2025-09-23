# API Testing Guide

Your farm management system APIs are now set up! Here's how to test them:

## 1. Health Check

Visit: `http://localhost:3001/api/health`
This should return database connection status.

## 2. Authentication Required APIs

All other APIs require authentication via Clerk. You need to:

1. Sign in to your app first at `http://localhost:3001/sign-in`
2. Then test the APIs from the frontend pages:
   - Crops: `http://localhost:3001/crops`
   - Tasks: `http://localhost:3001/tasks`
   - Activities: `http://localhost:3001/activities`
   - Reports: `http://localhost:3001/reports`

## 3. API Endpoints Available

### Crops API

- `GET /api/crops` - Get all crops
- `POST /api/crops` - Create new crop
- `GET /api/crops/[id]` - Get specific crop
- `PUT /api/crops/[id]` - Update crop
- `DELETE /api/crops/[id]` - Delete crop

### Tasks API

- `GET /api/tasks` - Get all tasks (with filters)
- `POST /api/tasks` - Create new task
- `GET /api/tasks/[id]` - Get specific task
- `PUT /api/tasks/[id]` - Update task
- `PATCH /api/tasks/[id]` - Mark task complete
- `DELETE /api/tasks/[id]` - Delete task
- `PATCH /api/tasks/[id]/complete` - Complete task

### Activity APIs

- `GET/POST /api/irrigation` - Irrigation logs
- `GET/POST /api/fertilizer` - Fertilizer logs
- `GET/POST /api/harvest` - Harvest logs
- `GET/POST /api/pest-disease` - Pest/disease logs

### Analytics API

- `GET /api/analytics` - Get dashboard analytics

## 4. Fix Prisma Client Issue

To fix the Prisma client generation issue:

1. Stop the dev server (Ctrl+C)
2. Run: `npx prisma generate`
3. If that fails, restart your computer and try again
4. Start dev server: `npm run dev`

## 5. Database Tables Created

Your Supabase database now has these tables:

- users
- crops
- tasks
- irrigation_logs
- fertilizer_logs
- harvest_logs
- pest_disease_logs

All APIs are ready to use once the Prisma client is properly generated!
