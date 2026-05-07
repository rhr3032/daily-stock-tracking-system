# Deployment Guide

This app deploys to Vercel as a Vite frontend plus Vercel serverless API routes.
The frontend calls the backend at `/api`, so no separate Render/Railway backend is required.

## Vercel Environment Variables

Set these in the Vercel project dashboard:

| Name | Value |
|---|---|
| `DATABASE_URL` | Your PostgreSQL connection string |
| `VITE_API_BASE` | `/api` |

If `VITE_API_BASE` is currently set to an external URL such as `https://daily-stock-tracking-backend.onrender.com`, change it to `/api` or remove it so `.env.production` can provide `/api`.

## Deploy

1. Push the latest code to GitHub.
2. Redeploy the Vercel project.
3. Visit `https://dailystock3032.vercel.app/api/health`.

The health endpoint should return JSON like:

```json
{
  "status": "ok",
  "database": "connected",
  "productCount": 0
}
```

## Database Schema

If the database is new or empty, push the Prisma schema before using the app:

```bash
npx prisma db push
```

For local development, run both frontend and backend:

```bash
npm run dev:full
```
