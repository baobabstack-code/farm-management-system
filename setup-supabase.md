# Supabase Setup Instructions

## 1. Get Supabase Credentials from Vercel

1. Go to your Vercel dashboard
2. Select your farm-management-system project
3. Go to Settings → Environment Variables
4. Look for Supabase-related variables or go to Integrations → Supabase

You should find these variables:

- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public API key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for admin operations)

## 2. Update Your .env File

Replace the placeholder values in your `.env` file with the actual values from Vercel.

## 3. Run Database Migration

Once you have the correct DATABASE_URL, run:

```bash
npx prisma db push
```

This will create all the necessary tables in your Supabase database.

## 4. Generate Prisma Client

```bash
npx prisma generate
```

## 5. Test the Connection

Start your development server:

```bash
npm run dev
```

Your APIs should now work with the Supabase database!

## Troubleshooting

If you get connection errors:

1. Verify the DATABASE_URL is correct
2. Check that your Supabase project is active
3. Ensure the database password is correct
4. Make sure your IP is allowed (Supabase usually allows all IPs by default)
