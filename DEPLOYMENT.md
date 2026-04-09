# Vercel Deployment Guide

## Prerequisites
1. A Vercel account (sign up at vercel.com)
2. Your Convex deployment URL from `apps/mobile/.env.local`

## Deployment Steps

### 1. Connect Repository to Vercel
1. Push your monorepo to GitHub/GitLab/Bitbucket
2. Go to Vercel dashboard and import your repository
3. Select the root directory of your monorepo

### 2. Configure Build Settings
Vercel should auto-detect the `vercel.json` configuration, but you can verify:

- **Build Command**: `pnpm turbo build --filter=@camp/web`
- **Output Directory**: `apps/web/.next`
- **Install Command**: `pnpm install`

### 3. Environment Variables
Add these environment variables in Vercel dashboard:

```
NEXT_PUBLIC_CONVEX_URL=https://flexible-salamander-341.convex.cloud
CONVEX_DEPLOYMENT=dev:flexible-salamander-341
```

### 4. Deploy
Click "Deploy" and Vercel will:
1. Install dependencies using pnpm
2. Build only the web app using Turborepo
3. Deploy the Next.js application

## Local Testing
Before deploying, test the build locally:

```bash
# Install all dependencies
pnpm install

# Build the web app
pnpm build:web

# Start the production server
cd apps/web && pnpm start
```

## Performance Optimizations
The `vercel.json` configuration enables:
- Turborepo build caching for faster deployments
- Proper monorepo workspace resolution
- Environment variable management

## Troubleshooting
If deployment fails:
1. Check that all workspace dependencies are properly configured
2. Verify Convex environment variables are correct
3. Ensure `pnpm-workspace.yaml` is in the root directory