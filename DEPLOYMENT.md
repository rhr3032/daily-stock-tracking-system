# Deployment Guide

## Problem
The app isn't working in production because the backend API server is not deployed. The frontend (on Vercel) cannot reach the backend API.

## Solution

The app has been configured to support environment-based API URLs. Follow these steps:

### 1. Deploy the Backend

You need to deploy the Express backend to a service. **Render.com** has a free tier that works great:

#### Option A: Deploy to Render.com (Recommended - Free)

1. Go to [render.com](https://render.com) and sign up (free)
2. Connect your GitHub repository
3. Create a new "Web Service"
4. Configure it with these settings:
   - **Name**: `daily-stock-tracking-backend`
   - **Environment**: Node
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npm start`
5. Add environment variable:
   - **Key**: `DATABASE_URL`
   - **Value**: (Copy from your .env.local file - the PostgreSQL URL)
6. Deploy!
7. Once deployed, copy the URL (e.g., `https://daily-stock-tracking-backend.onrender.com`)

#### Option B: Deploy to Railway.app (Also Free)

1. Go to [railway.app](https://railway.app)
2. Connect your GitHub repo
3. Railway will auto-detect the Node backend
4. Add the `DATABASE_URL` environment variable
5. Deploy and get the API URL

### 2. Update the Frontend

The frontend is already configured to use environment variables. You just need to set the backend URL in Vercel:

1. Go to your Vercel project settings: https://vercel.com/dashboard
2. Find your project `daily-stock-tracking-system`
3. Go to **Settings** → **Environment Variables**
4. Add a new variable:
   - **Name**: `VITE_API_BASE`
   - **Value**: Your backend URL (e.g., `https://daily-stock-tracking-backend.onrender.com`)
   - **Environments**: Select "Production"
5. Redeploy your frontend (or trigger a new deployment by pushing to GitHub)

### 3. Verify

After deployment:
- Visit https://dailystock3032.vercel.app/
- Click "Add Product"
- Try adding a product - it should work now!

## Local Development

For local development, the app will automatically use `http://localhost:4000` (as defined in vite.config.ts).

Run:
```bash
npm run dev:full
```

This starts both the frontend and backend together.

## Files Modified

- `src/app/utils/storage.ts` - Updated to use environment variable for API base URL
- `.env.production` - Created with the backend API URL placeholder
- `package.json` - Added `start` script for production
- `Procfile` - Created for easy deployment to services like Render

## Environment Variables Summary

| Environment | Variable | Value |
|---|---|---|
| Development | (None needed) | Uses local proxy to `http://localhost:4000` |
| Production (Vercel) | `VITE_API_BASE` | URL of deployed backend (e.g., `https://daily-stock-tracking-backend.onrender.com`) |
| Backend Database | `DATABASE_URL` | PostgreSQL URL (already set in Render/Railway) |
