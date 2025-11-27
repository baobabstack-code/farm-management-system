# Geolocation Fix - Quick Guide

## Issue Fixed ✅

**Error**: `Permissions policy violation: Geolocation access has been blocked`

**Solution**: Updated the Permissions-Policy header in `next.config.ts` to allow geolocation for the same origin.

## What Changed

### File: `next.config.ts`

**Before:**

```typescript
{
  key: "Permissions-Policy",
  value: "camera=(), microphone=(), geolocation=()"
}
```

**After:**

```typescript
{
  key: "Permissions-Policy",
  value: "camera=(), microphone=(), geolocation=(self)"
}
```

## What This Means

- **`geolocation=()`**: Blocks geolocation completely
- **`geolocation=(self)`**: Allows geolocation for the same origin (your app)

## Additional Improvements

### Enhanced Error Messages

Updated `MapSelector.tsx` to provide specific error messages based on the geolocation error type:

- **Permission Denied**: "Please allow location access in your browser settings and try again."
- **Position Unavailable**: "Location information is unavailable. Please select manually on the map."
- **Timeout**: "Location request timed out. Please try again or select manually on the map."

## Testing the Fix

1. **Restart the dev server** (if running):

   ```bash
   npm run dev
   ```

2. **Clear browser cache** or use incognito mode

3. **Navigate to `/onboarding`**

4. **Click "📍 Auto-detect"**

5. **Allow location access** when prompted by the browser

6. **Expected result**: Your location should be detected and a pin should appear on the map

## Browser Permissions

### Chrome/Edge

1. Click the lock icon in the address bar
2. Click "Site settings"
3. Find "Location" and set to "Allow"

### Firefox

1. Click the lock icon in the address bar
2. Click the arrow next to "Blocked" or "Allowed"
3. Find "Access Your Location" and select "Allow"

### Safari

1. Safari → Settings → Websites → Location
2. Find your site and set to "Allow"

## Important Notes

⚠️ **HTTPS Required**: Geolocation API only works on:

- `localhost` (development)
- HTTPS sites (production)

⚠️ **User Permission**: Users must explicitly grant location access when prompted by the browser

⚠️ **Fallback Options**: If geolocation fails, users can still:

- Search for their location using the search bar
- Click directly on the map to drop a pin

## Production Deployment

When deploying to production, ensure:

1. ✅ Site is served over HTTPS
2. ✅ Permissions-Policy header is correctly configured
3. ✅ Users are informed about why location access is needed
4. ✅ Fallback methods (search, manual selection) are available

---

**Status**: ✅ **FIXED**
**Restart Required**: ✅ **Yes** (restart dev server to apply config changes)
