# =====================================================
# Mavi MES Deployment Guide
# =====================================================

## Overview

This document covers the complete deployment pipeline for Mavi MES, including:
- Local development setup
- Vercel deployment (Frontend)
- Supabase setup (Database & Auth)
- Environment configuration
- CI/CD automation

---

## Prerequisites

1. Node.js 20+
2. npm or yarn
3. Git
4. Supabase account
5. Vercel account (optional for self-hosting)
6. Sentry account (optional for error tracking)

---

## 1. Local Development Setup

### Clone and Install

```bash
git clone https://github.com/your-org/mavi-mes.git
cd mavi-mes
npm install
```

### Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```bash
# Supabase (required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Sentry (optional)
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project

# AI Services (optional)
VITE_GEMINI_API_KEY=
```

### Run Development Server

```bash
npm run dev
```

---

## 2. Supabase Setup

### Create Supabase Project

1. Go to https://supabase.com
2. Create new project
3. Note your project URL and anon key

### Run Initial Migration

1. Go to Supabase Dashboard > SQL Editor
2. Copy contents of `supabase/migrations/001_add_multi_tenancy.sql`
3. Run the migration

### Enable Authentication

1. Go to Authentication > Providers
2. Enable Email/Password
3. (Optional) Enable Google OAuth

### Configure Row Level Security (RLS)

The migration script enables RLS on all tables. Test that:
- Users can only see their organization's data
- Users can only modify their own data

---

## 3. Vercel Deployment

### Connect Repository

1. Go to https://vercel.com
2. Import your GitHub repository
3. Configure build settings:

| Setting | Value |
|---------|-------|
| Framework | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

### Environment Variables

Add these in Vercel dashboard > Settings > Environment Variables:

```bash
# Production
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_ENV=production
VITE_APP_VERSION=$VERCEL_GIT_COMMIT_SHA

# (Optional) Production Sentry
VITE_SENTRY_DSN=your-sentry-dsn
```

### Custom Domain (Optional)

1. Go to Settings > Domains
2. Add your domain (e.g., mavi.mes)
3. Configure DNS records as instructed

---

## 4. CI/CD Pipeline

### GitHub Actions Secrets

Add these in GitHub > Settings > Secrets:

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Vercel API token |
| `VERCEL_ORG_ID` | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon key |
| `CODECOV_TOKEN` | Codecov upload token (optional) |

### Pipeline Overview

```
┌─────────────────────────────────────────────────────────────┐
│  PUSH / PR                                                    │
│    │                                                          │
│    ▼                                                          │
│  ┌──────────┐                                                │
│  │   LINT   │  ESLint + Prettier                            │
│  └─────┬────┘                                                │
│        │                                                     │
│        ▼                                                     │
│  ┌──────────┐                                                │
│  │   TEST   │  Vitest + Coverage                            │
│  └─────┬────┘                                                │
│        │                                                     │
│        ▼                                                     │
│  ┌──────────┐                                                │
│  │  BUILD   │  Vite production build                        │
│  └─────┬────┘                                                │
│        │                                                     │
│        ├──────────────────────────────────────┐               │
│        │                                      │               │
│        ▼                                      ▼               │
│  ┌──────────────┐                     ┌──────────────┐        │
│  │   PR PREVIEW │                    │  MAIN DEPLOY │        │
│  │  (Vercel)   │                    │  (Vercel)    │        │
│  └──────────────┘                    └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### Branch Strategy

- `main` - Production deployment
- `develop` - Staging/development
- `feature/*` - Feature branches
- `fix/*` - Bug fix branches

---

## 5. Database Migrations

### Migration Files

Place migration files in `supabase/migrations/` with sequential names:

```
supabase/
└── migrations/
    ├── 001_add_multi_tenancy.sql
    ├── 002_add_audit_fields.sql
    └── 003_...
```

### Apply Migrations Locally

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

### Apply Migrations via CI

The CI pipeline automatically applies migrations on deployment using Supabase CLI.

---

## 6. Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Build succeeds locally
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] RLS policies tested

### Post-Deployment

- [ ] Health dashboard accessible
- [ ] Login/registration working
- [ ] API calls succeeding
- [ ] Error tracking receiving data
- [ ] No console errors

### Monitoring

- [ ] Vercel analytics enabled
- [ ] Sentry receiving errors
- [ ] Health dashboard metrics updating
- [ ] Log viewer showing logs

---

## 7. Rollback Procedure

### Vercel Rollback

```bash
# Via CLI
vercel rollback

# Via Dashboard
# Deployments > Select previous deployment > ...
```

### Database Rollback

```bash
# Reset to specific migration
supabase db reset --backup

# Or manually restore from backup
# Supabase Dashboard > Database > Backups
```

---

## 8. Troubleshooting

### Build Fails

1. Check Vercel build logs
2. Verify environment variables
3. Run `npm run build` locally

### Tests Failing in CI

1. Check if tests pass locally: `npm test`
2. Verify environment variables in CI
3. Check for flaky tests

### Database Connection Issues

1. Verify Supabase URL and anon key
2. Check RLS policies allow access
3. Test in Supabase SQL Editor

### Deployment Stuck

1. Cancel current deployment
2. Check GitHub Actions logs
3. Retry deployment

---

## 9. Support

For issues:
1. Check GitHub Actions logs
2. Check Vercel deployment logs
3. Check Sentry for errors
4. Open GitHub issue
