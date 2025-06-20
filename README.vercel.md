# MitraAI - Vercel Deployment

## Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/mitraai&env=DATABASE_URL,SESSION_SECRET,OPENROUTER_API_KEY)

## Manual Deployment Steps

### 1. Fork/Clone Repository
```bash
git clone https://github.com/your-username/mitraai
cd mitraai
```

### 2. Install Vercel CLI
```bash
npm i -g vercel
```

### 3. Login to Vercel
```bash
vercel login
```

### 4. Deploy
```bash
vercel --prod
```

### 5. Set Environment Variables

After deployment, go to your Vercel dashboard and add these environment variables:

**Required:**
- `DATABASE_URL` - Your Neon PostgreSQL connection string
- `SESSION_SECRET` - Random string for session encryption
- `NODE_ENV` - Set to "production"

**Optional:**
- `OPENROUTER_API_KEY` - For AI functionality

### 6. Redeploy
After setting environment variables, redeploy:
```bash
vercel --prod
```

## Environment Variables

```bash
DATABASE_URL=postgresql://user:pass@host:5432/database?sslmode=require
SESSION_SECRET=your-super-secret-session-key-here
NODE_ENV=production
OPENROUTER_API_KEY=your-openrouter-api-key
```

## Project Structure for Vercel

```
/
├── api/              # Vercel serverless functions
│   └── index.ts      # Main API entry point
├── client/           # React frontend
├── server/           # Express backend code
├── shared/           # Shared types and schemas
├── dist/             # Built frontend (auto-generated)
├── vercel.json       # Vercel configuration
└── package.json      # Dependencies and scripts
```

## Features

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express (serverless)
- **Database**: External Neon PostgreSQL
- **Authentication**: Session-based with Passport.js
- **AI Integration**: OpenRouter API for multiple LLM models

## Admin Access

After deployment, access the admin panel at:
```
https://your-domain.vercel.app/admin
```

Default admin credentials are set during database initialization.

## Database Setup

The application uses an external Neon PostgreSQL database. All tables and sample data are automatically created when the application starts.

## Support

For deployment issues:
1. Check Vercel build logs
2. Verify environment variables
3. Ensure database connectivity
4. Review CORS settings for your domain

## Custom Domain

To use a custom domain:
1. Go to Vercel Dashboard → Project → Settings → Domains
2. Add your domain
3. Configure DNS records as instructed
4. Update CORS settings in the code if needed