# Dashboard API Documentation

## Overview

The Dashboard API provides comprehensive farm management data for the dashboard view, including metrics, statistics, recent activities, and upcoming events.

**Base URL**: `/api/dashboard`

## Endpoints

### GET /api/dashboard/summary

Returns complete dashboard data including stats, resource usage, recent tasks, and upcoming harvests.

#### Authentication

**Required**: Yes (Clerk authentication)

Include authentication token in request headers or cookies.

#### Query Parameters

| Parameter         | Type              | Required | Description                                                        |
| ----------------- | ----------------- | -------- | ------------------------------------------------------------------ |
| `startDate`       | string (ISO 8601) | No       | Start date for filtering statistics (e.g., "2024-01-01T00:00:00Z") |
| `endDate`         | string (ISO 8601) | No       | End date for filtering statistics (e.g., "2024-12-31T23:59:59Z")   |
| `includeInactive` | string            | No       | Set to "true" to include inactive items (default: false)           |

#### Request Example

```bash
# Basic request
curl -X GET "https://your-domain.com/api/dashboard/summary" \
  -H "Authorization: Bearer YOUR_TOKEN"

# With date range
curl -X GET "https://your-domain.com/api/dashboard/summary?startDate=2024-01-01T00:00:00Z&endDate=2024-12-31T23:59:59Z" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Success Response

**Status Code**: `200 OK`

**Headers**:

- `Cache-Control: private, max-age=60` (cached for 1 minute)

**Body**:

```json
{
  "success": true,
  "data": {
    "dashboard": {
      "totalCrops": 6,
      "activeTasks": 4,
      "overdueTasks": 1,
      "recentHarvests": 5,
      "totalYield": 245.5,
      "waterUsage": 15000
    },
    "water": {
      "totalWater": 15000,
      "averagePerSession": 1000,
      "sessionCount": 15
    },
    "fertilizer": {
      "totalAmount": 250,
      "applicationCount": 10,
      "typeBreakdown": {
        "10-10-10 NPK": 100,
        "Urea": 75,
        "Compost": 75
      }
    },
    "yield": {
      "totalYield": 245.5,
      "harvestCount": 5,
      "cropBreakdown": {
        "Strawberries": 180.5,
        "Tomatoes": 65
      }
    },
    "pestDisease": {
      "totalIncidents": 8,
      "pestCount": 5,
      "diseaseCount": 3,
      "severityBreakdown": {
        "LOW": 3,
        "MEDIUM": 4,
        "HIGH": 1
      }
    },
    "financial": {
      "totalIncome": 15000.0,
      "totalExpenses": 8500.0,
      "balance": 6500.0,
      "transactionCount": 45
    },
    "recentTasks": [
      {
        "id": "task_123",
        "title": "Water tomatoes",
        "description": "Check soil moisture and water if needed",
        "dueDate": "2024-11-27T00:00:00Z",
        "priority": "HIGH",
        "status": "PENDING",
        "cropId": "crop_456",
        "cropName": "Tomatoes",
        "createdAt": "2024-11-20T10:30:00Z"
      }
    ],
    "upcomingHarvests": [
      {
        "id": "crop_789",
        "name": "Lettuce",
        "variety": "Romaine",
        "status": "FLOWERING",
        "plantingDate": "2024-10-25T00:00:00Z",
        "expectedHarvestDate": "2024-11-30T00:00:00Z",
        "actualHarvestDate": null,
        "area": 3.8
      }
    ],
    "location": {
      "latitude": 40.7128,
      "longitude": -74.006,
      "name": "North Field, Main Farm"
    }
  },
  "timestamp": "2024-11-25T15:30:00Z"
}
```

#### Error Responses

##### 401 Unauthorized

User is not authenticated.

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  },
  "timestamp": "2024-11-25T15:30:00Z"
}
```

##### 400 Bad Request - Invalid Query Parameters

Query parameters failed validation.

```json
{
  "success": false,
  "error": {
    "code": "INVALID_QUERY_PARAMS",
    "message": "Invalid query parameters",
    "details": {
      "startDate": ["Invalid date format. Expected ISO 8601 datetime string."]
    }
  },
  "timestamp": "2024-11-25T15:30:00Z"
}
```

##### 400 Bad Request - Invalid Date Range

Start date is after end date.

```json
{
  "success": false,
  "error": {
    "code": "INVALID_DATE_RANGE",
    "message": "Start date must be before end date"
  },
  "timestamp": "2024-11-25T15:30:00Z"
}
```

##### 500 Internal Server Error

Unexpected server error occurred.

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred"
  },
  "timestamp": "2024-11-25T15:30:00Z"
}
```

##### 503 Service Unavailable

Database connection failed.

```json
{
  "success": false,
  "error": {
    "code": "DATABASE_ERROR",
    "message": "Unable to connect to database"
  },
  "timestamp": "2024-11-25T15:30:00Z"
}
```

## Response Schema

### DashboardStats

Core dashboard metrics.

| Field            | Type   | Description                                    |
| ---------------- | ------ | ---------------------------------------------- |
| `totalCrops`     | number | Total number of crops                          |
| `activeTasks`    | number | Number of active tasks (pending + in progress) |
| `overdueTasks`   | number | Number of overdue tasks                        |
| `recentHarvests` | number | Number of harvests in last 30 days             |
| `totalYield`     | number | Total yield in kg                              |
| `waterUsage`     | number | Total water usage in liters                    |

### WaterUsageStats

Water usage statistics.

| Field               | Type   | Description                          |
| ------------------- | ------ | ------------------------------------ |
| `totalWater`        | number | Total water used in liters           |
| `averagePerSession` | number | Average water per irrigation session |
| `sessionCount`      | number | Number of irrigation sessions        |

### FertilizerUsageStats

Fertilizer application statistics.

| Field              | Type   | Description                   |
| ------------------ | ------ | ----------------------------- |
| `totalAmount`      | number | Total fertilizer amount in kg |
| `applicationCount` | number | Number of applications        |
| `typeBreakdown`    | object | Amount per fertilizer type    |

### YieldStats

Harvest yield statistics.

| Field           | Type   | Description                |
| --------------- | ------ | -------------------------- |
| `totalYield`    | number | Total yield in kg          |
| `harvestCount`  | number | Number of harvest sessions |
| `cropBreakdown` | object | Yield per crop type        |

### PestDiseaseStats

Pest and disease incident statistics.

| Field               | Type   | Description                                  |
| ------------------- | ------ | -------------------------------------------- |
| `totalIncidents`    | number | Total number of incidents                    |
| `pestCount`         | number | Number of pest incidents                     |
| `diseaseCount`      | number | Number of disease incidents                  |
| `severityBreakdown` | object | Count per severity level (LOW, MEDIUM, HIGH) |

### FinancialSummary

Financial transaction summary.

| Field              | Type   | Description                            |
| ------------------ | ------ | -------------------------------------- |
| `totalIncome`      | number | Total income/revenue in currency units |
| `totalExpenses`    | number | Total expenses in currency units       |
| `balance`          | number | Net balance (income - expenses)        |
| `transactionCount` | number | Total number of transactions           |

### TaskSummary

Simplified task information.

| Field         | Type           | Description                                         |
| ------------- | -------------- | --------------------------------------------------- |
| `id`          | string         | Task ID                                             |
| `title`       | string         | Task title                                          |
| `description` | string \| null | Task description                                    |
| `dueDate`     | string         | Due date (ISO 8601)                                 |
| `priority`    | string         | Priority (LOW, MEDIUM, HIGH, URGENT)                |
| `status`      | string         | Status (PENDING, IN_PROGRESS, COMPLETED, CANCELLED) |
| `cropId`      | string \| null | Associated crop ID                                  |
| `cropName`    | string \| null | Associated crop name                                |
| `createdAt`   | string         | Creation date (ISO 8601)                            |

### CropSummary

Simplified crop information.

| Field                 | Type           | Description                                                          |
| --------------------- | -------------- | -------------------------------------------------------------------- |
| `id`                  | string         | Crop ID                                                              |
| `name`                | string         | Crop name                                                            |
| `variety`             | string \| null | Crop variety                                                         |
| `status`              | string         | Status (PLANTED, GROWING, FLOWERING, FRUITING, HARVESTED, COMPLETED) |
| `plantingDate`        | string         | Planting date (ISO 8601)                                             |
| `expectedHarvestDate` | string         | Expected harvest date (ISO 8601)                                     |
| `actualHarvestDate`   | string \| null | Actual harvest date (ISO 8601)                                       |
| `area`                | number \| null | Area in square meters                                                |

### Location

Farm location data.

| Field       | Type   | Description              |
| ----------- | ------ | ------------------------ |
| `latitude`  | number | Latitude (-90 to 90)     |
| `longitude` | number | Longitude (-180 to 180)  |
| `name`      | string | Location name or address |

## Usage Examples

### JavaScript/TypeScript (Fetch API)

```typescript
async function fetchDashboardSummary() {
  try {
    const response = await fetch("/api/dashboard/summary");
    const result = await response.json();

    if (result.success) {
      console.log("Dashboard data:", result.data);
      return result.data;
    } else {
      console.error("Error:", result.error.message);
      throw new Error(result.error.message);
    }
  } catch (error) {
    console.error("Failed to fetch dashboard:", error);
    throw error;
  }
}
```

### JavaScript/TypeScript (with Date Range)

```typescript
async function fetchDashboardWithDateRange(startDate: Date, endDate: Date) {
  const params = new URLSearchParams({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });

  const response = await fetch(`/api/dashboard/summary?${params}`);
  const result = await response.json();

  return result;
}
```

### React Hook

```typescript
import { useEffect, useState } from "react";

function useDashboardData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/dashboard/summary");
        const result = await response.json();

        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error.message);
        }
      } catch (err) {
        setError("Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return { data, loading, error };
}
```

### Python (requests)

```python
import requests

def get_dashboard_summary(token):
    url = "https://your-domain.com/api/dashboard/summary"
    headers = {"Authorization": f"Bearer {token}"}

    response = requests.get(url, headers=headers)
    data = response.json()

    if data["success"]:
        return data["data"]
    else:
        raise Exception(data["error"]["message"])
```

## Performance

### Response Time

- **Target**: < 300ms for typical datasets
- **Actual**: ~50-150ms with database indexes
- **Factors**: Number of records, date range, database load

### Caching

- **Client-side**: Responses are cached for 1 minute (`Cache-Control: private, max-age=60`)
- **Recommendation**: Implement client-side caching for additional performance

### Optimization Tips

1. **Use date ranges**: Limit data to relevant time periods
2. **Cache responses**: Store results client-side for 1-5 minutes
3. **Pagination**: For large datasets, consider fetching data in chunks
4. **Selective loading**: Load only needed sections initially

## Rate Limiting

Currently no rate limiting is enforced, but best practices:

- Maximum 60 requests per minute per user
- Implement exponential backoff on errors
- Cache responses to reduce API calls

## Changelog

### Version 1.0.0 (2024-11-25)

- Initial release
- Complete dashboard summary endpoint
- Zod validation
- Comprehensive error handling
- Date range filtering
- Response caching

## Support

For issues or questions:

1. Check error response codes and messages
2. Verify authentication token is valid
3. Ensure query parameters are properly formatted
4. Check database connectivity
5. Review server logs for detailed error information

## Related Endpoints

- `GET /api/crops` - Detailed crop information
- `GET /api/tasks` - Detailed task information
- `GET /api/analytics` - Legacy analytics endpoint (deprecated)
- `GET /api/weather/current` - Current weather data

---

**Last Updated**: November 25, 2025  
**API Version**: 1.0.0  
**Status**: Production Ready
