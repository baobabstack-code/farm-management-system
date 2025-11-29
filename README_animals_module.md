# Animal Production Module

This module enables farmers to manage animal groups (flocks/herds), track production (eggs, weight), feed, health, and expenses, and generate AI-powered forecasts.

## Features

- **Group Management**: Create and manage animal groups (e.g., Chicken Flocks).
- **Production Tracking**: Record daily egg collection and weight.
- **Feed & Health**: Track feed consumption and health issues.
- **AI Forecasting**: Predict future production using historical data.
- **Dashboard**: Visual charts and summaries.

## Setup

1.  **Environment Variables**:
    Ensure the following are set in your `.env` file:

    ```env
    DATABASE_URL="postgresql://..."
    REDIS_HOST="localhost"
    REDIS_PORT="6379"
    REDIS_PASSWORD=""
    # ML_SERVICE_URL="http://..." (Optional for mock)
    ```

2.  **Database**:
    Run migrations to update the schema:

    ```bash
    npx prisma migrate dev
    ```

3.  **Seed Data**:
    Seed initial species (e.g., Chicken):

    ```bash
    npx prisma db seed
    ```

4.  **Dependencies**:
    Install required packages:
    ```bash
    npm install bullmq ioredis recharts
    ```

## Running the Worker

The forecasting worker processes background jobs. Run it using:

```bash
# In development (requires ts-node or similar)
npx ts-node src/workers/forecastWorker.ts
```

## API Endpoints

- `GET /api/animals/species`: List species
- `GET /api/animals/groups`: List groups
- `POST /api/animals/groups`: Create group
- `POST /api/animals/production`: Record production
- `POST /api/animals/forecast/:groupId`: Request forecast

## Testing

Run tests with:

```bash
npm test
```
