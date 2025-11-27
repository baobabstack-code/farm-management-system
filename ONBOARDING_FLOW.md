# Mandatory Onboarding Flow - Implementation Guide

## Overview

This document describes the mandatory onboarding flow implemented in FarmerFlow AI. Every new authenticated user **MUST** complete onboarding before accessing any other part of the application.

## Features

### 1. **Interactive Map Interface**

- Users can select their farm location using an interactive Leaflet map
- Three methods to set location:
  - **Click on map**: Drop a pin anywhere on the map
  - **Search**: Search for an address using the search bar
  - **Auto-detect**: Use browser geolocation to automatically detect location

### 2. **Location Data Capture**

- Captures precise GPS coordinates (latitude/longitude)
- Performs reverse geocoding to get human-readable address
- Stores city and country information
- Creates a "Main Farm" field in the database

### 3. **Platform Personalization**

The saved farm location is used throughout the platform for:

- **Weather reports**: Real-time weather data for the farm location
- **Rainfall data**: Historical and current rainfall information
- **Forecasts**: 7-day weather forecasts
- **Climate alerts**: Location-specific weather alerts
- **AI insights**: Farm-specific recommendations based on local conditions

## Implementation Details

### Routing Logic

#### Global Enforcement (Middleware)

```typescript
// src/middleware.ts
- Checks if user is authenticated
- If authenticated and NOT on /onboarding:
  - Calls /api/onboarding/status
  - If not completed → redirect to /onboarding
  - If completed → allow access
```

#### Client-Side Hook

```typescript
// src/hooks/use-onboarding.ts
- useOnboarding() hook called in LayoutContent
- Provides additional client-side enforcement
- Prevents race conditions
```

### Onboarding Status Check

**API Endpoint**: `GET /api/onboarding/status`

**Logic**: User has completed onboarding if they have at least one field in the database.

```typescript
// Checks: fieldCount > 0
{
  "completed": true,
  "hasFields": true,
  "fieldCount": 1
}
```

### Database Schema

When onboarding is completed, a `Field` record is created:

```prisma
model Field {
  id        String   @id @default(cuid())
  userId    String
  name      String   // "Main Farm"
  address   String?  // Full address from reverse geocoding
  latitude  Float?   // GPS latitude
  longitude Float?   // GPS longitude
  area      Float    // Initially 0, user can update later
  soilType  String?  // Default: "LOAMY"
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## User Flow

### New User Journey

1. **Sign Up** → User creates account via Clerk
2. **Auto-redirect** → Immediately redirected to `/onboarding`
3. **Map Interface** → User sees interactive map with 3 location options
4. **Select Location** → User chooses farm location
5. **Confirm** → User confirms the selected location
6. **Save** → System creates Field record with location data
7. **Dashboard** → User is redirected to dashboard
8. **Future Access** → User can now access all protected routes

### Returning User Journey

1. **Sign In** → User logs in via Clerk
2. **Onboarding Check** → Middleware checks `/api/onboarding/status`
3. **If Completed** → User goes to dashboard
4. **If Not Completed** → User redirected to `/onboarding`

## Protected Routes

All routes except the following require completed onboarding:

- `/` (landing page)
- `/sign-in`
- `/sign-up`
- `/onboarding`
- `/_next` (Next.js internals)
- `/api/webhook` (webhooks)

## Components

### 1. Onboarding Page

**File**: `src/app/onboarding/page.tsx`

- 2-step wizard interface
- Step 1: Map selection
- Step 2: Confirmation
- Progress indicator
- Loading states

### 2. Map Selector

**File**: `src/components/map/MapSelector.tsx`

- Leaflet map integration
- Search functionality (OpenStreetMap Nominatim)
- Auto-detect geolocation
- Reverse geocoding
- Custom marker icons

### 3. Onboarding Hook

**File**: `src/hooks/use-onboarding.ts`

- Client-side onboarding enforcement
- Automatic redirect if not completed
- Prevents access to protected routes

## API Routes

### Check Onboarding Status

```
GET /api/onboarding/status
```

**Response**:

```json
{
  "completed": boolean,
  "hasFields": boolean,
  "fieldCount": number
}
```

### Create Field (Complete Onboarding)

```
POST /api/fields
```

**Request Body**:

```json
{
  "name": "Main Farm",
  "address": "123 Farm Road, City, Country",
  "latitude": 40.7128,
  "longitude": -74.006,
  "area": 0,
  "soilType": "LOAMY",
  "isActive": true
}
```

## Dependencies

### NPM Packages

```json
{
  "react-leaflet": "^4.x",
  "leaflet": "^1.9.x",
  "@types/leaflet": "^1.9.x"
}
```

### External Services

- **OpenStreetMap Nominatim**: Geocoding and reverse geocoding
- **OpenStreetMap Tiles**: Map tiles for Leaflet

## Configuration

### Clerk Provider

```tsx
// src/app/layout.tsx
<ClerkProvider
  signInForceRedirectUrl="/onboarding"
  signUpForceRedirectUrl="/onboarding"
>
```

### Middleware

```typescript
// src/middleware.ts
export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

## Testing

### Manual Testing Checklist

1. **New User Flow**
   - [ ] Sign up creates new account
   - [ ] Immediately redirected to `/onboarding`
   - [ ] Map loads correctly
   - [ ] Can search for location
   - [ ] Can click on map to select location
   - [ ] Auto-detect works (if browser supports)
   - [ ] Confirmation shows correct address
   - [ ] Completing onboarding redirects to dashboard
   - [ ] Can access all protected routes after completion

2. **Existing User Flow**
   - [ ] User with completed onboarding goes directly to dashboard
   - [ ] User without completed onboarding redirected to `/onboarding`

3. **Edge Cases**
   - [ ] Trying to access `/dashboard` directly redirects to `/onboarding`
   - [ ] Trying to access `/crops` directly redirects to `/onboarding`
   - [ ] Can still access landing page while authenticated
   - [ ] Can sign out from onboarding page

## Troubleshooting

### Issue: Map not loading

**Solution**: Check that Leaflet CSS is imported and map container has explicit height

### Issue: Marker not showing

**Solution**: Verify custom icon URLs are accessible

### Issue: Redirect loop

**Solution**: Check that `/onboarding` is excluded from onboarding check in middleware

### Issue: Geolocation not working

**Solution**: Ensure site is served over HTTPS (required for geolocation API)

## Future Enhancements

1. **Multiple Fields**: Allow users to add multiple farm locations
2. **Field Boundaries**: Draw polygon boundaries on map
3. **Soil Testing**: Integrate soil data during onboarding
4. **Crop Selection**: Pre-select crops during onboarding
5. **Farm Size**: Capture farm area during onboarding
6. **Offline Support**: Cache map tiles for offline use

## Security Considerations

1. **Authentication**: All onboarding routes require authentication
2. **Authorization**: Users can only create fields for themselves
3. **Rate Limiting**: Consider rate limiting geocoding API calls
4. **Data Validation**: Validate coordinates are within valid ranges
5. **XSS Protection**: Sanitize user-provided addresses

## Performance

1. **Dynamic Import**: Map component is dynamically imported to reduce initial bundle size
2. **SSR Disabled**: Map component has `ssr: false` to avoid hydration issues
3. **Lazy Loading**: Map tiles load on demand
4. **Caching**: Consider caching geocoding results

---

**Last Updated**: 2025-11-27
**Version**: 1.0.0
**Author**: FarmerFlow AI Team
