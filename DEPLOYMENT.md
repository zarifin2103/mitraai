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
SESSION_SECRET=your-session-secret-key
OPENROUTER_API_KEY=your-openrouter-api-key
```

## Deployment Steps

### 1. Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Select the repository containing MitraAI

### 2. Configure Build Settings

Vercel will automatically detect the settings from `vercel.json`:

- **Framework Preset**: None (custom configuration)
- **Build Command**: `npm run vercel-build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

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

- **Build Errors**: Check build logs in Vercel dashboard
- **Database Connection**: Verify DATABASE_URL environment variable
- **API Routes**: Ensure routes start with `/api/`
- **Static Files**: Check if files are in `/dist` directory

## Architecture on Vercel

- **Frontend**: Static files served from CDN
- **Backend**: Serverless functions (each API route)
- **Database**: External Neon PostgreSQL
- **Sessions**: In-memory (note: will reset on function cold starts)

For production, consider upgrading session storage to Redis or database-backed sessions.