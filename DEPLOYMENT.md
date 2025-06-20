# Deployment Guide - Vercel

## Prerequisites

1. Vercel account
2. External Neon PostgreSQL database
3. Environment variables configured

## Environment Variables

Add these environment variables in your Vercel dashboard:

```bash
DATABASE_URL=postgresql://mitraai_owner:npg_sg0DNjWy8XJf@ep-odd-credit-a14feb62-pooler.ap-southeast-1.aws.neon.tech/mitraai?sslmode=require
NODE_ENV=production
SESSION_SECRET=your-session-secret-key-here-make-it-long-and-random
OPENROUTER_API_KEY=your-openrouter-api-key
```

**Important**: Replace `your-session-secret-key-here-make-it-long-and-random` with a secure random string for production use.

## Deployment Steps

### 1. Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Select the repository containing MitraAI

### 2. Configure Build Settings

Vercel will automatically detect the settings from `vercel.json`:

- **Framework Preset**: Vite (configured in vercel.json)
- **Build Command**: `cd client && npx vite build --emptyOutDir --outDir ../dist`
- **Output Directory**: `dist` (configured in vercel.json)
- **Install Command**: `npm install` (configured in vercel.json)

### 3. Environment Variables

In Vercel dashboard → Project Settings → Environment Variables, add:

```
DATABASE_URL = postgresql://mitraai_owner:npg_sg0DNjWy8XJf@ep-odd-credit-a14feb62-pooler.ap-southeast-1.aws.neon.tech/mitraai?sslmode=require
NODE_ENV = production
SESSION_SECRET = your-session-secret-here
```

### 4. Deploy

Click "Deploy" and Vercel will:
- Install dependencies
- Build the frontend
- Deploy serverless functions
- Provide a production URL

## Post-Deployment

1. **Database**: Your external Neon database will be used automatically
2. **Admin Access**: Use `/admin` route with admin credentials
3. **Testing**: Test with dummy users created during development

## Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed

## Monitoring

- Check Vercel dashboard for deployment logs
- Monitor database connections in Neon dashboard
- Use Vercel Analytics for performance insights

## Troubleshooting

### Common Issues and Solutions

1. **Raw Code Instead of Website**
   - Missing toaster component: Create `client/src/components/ui/toaster.tsx`
   - Incorrect build output: Ensure build outputs to root `/dist` directory
   - Verify `dist/index.html` exists after build
   - Check framework is set to "vite" in vercel.json

2. **404 Error on Main Page**
   - Ensure `vercel.json` has correct rewrites configuration
   - Verify build output directory is set to `dist`
   - Confirm SPA routing with catch-all route works

2. **API Routes Not Working**
   - Confirm API routes start with `/api/`
   - Check environment variables are set in Vercel dashboard
   - Verify database connection string is correct

3. **Build Errors**
   - Check build logs in Vercel dashboard
   - Ensure all dependencies are in `package.json`
   - Verify TypeScript compilation succeeds

4. **Database Connection Issues**
   - Verify `DATABASE_URL` environment variable
   - Check Neon database is accessible from external connections
   - Ensure SSL mode is enabled in connection string

## Architecture on Vercel

- **Frontend**: Static files served from CDN
- **Backend**: Serverless functions (each API route)
- **Database**: External Neon PostgreSQL
- **Sessions**: In-memory (note: will reset on function cold starts)

For production, consider upgrading session storage to Redis or database-backed sessions.