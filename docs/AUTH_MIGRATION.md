# Authentication Migration Guide

## Overview

This migration replaces the localStorage-based authentication system with Supabase Auth for proper multi-tenant SaaS support.

## What Changed

### New Files

| File | Purpose |
|------|---------|
| `src/utils/supabaseAuth.js` | Supabase Auth wrapper service |
| `src/contexts/AuthContext.jsx` | React context for auth state |
| `src/components/ProtectedRoute.jsx` | Route guards (AdminRoute, etc.) |
| `src/components/Login.jsx` | New login page |
| `src/components/Register.jsx` | New registration page |
| `supabase/migrations/001_add_multi_tenancy.sql` | Database migration |

### Modified Files

| File | Change |
|------|--------|
| `src/main.jsx` | Added AuthProvider |
| `.env.example` | Added environment variables |

## Migration Steps

### 1. Set up Supabase (if not already done)

1. Create a new Supabase project at https://supabase.com
2. Enable Email auth in: Dashboard > Authentication > Providers > Email

### 2. Run Database Migration

1. Go to your Supabase Dashboard > SQL Editor
2. Copy and paste the contents of `supabase/migrations/001_add_multi_tenancy.sql`
3. Click "Run" to execute

This will:
- Create `organizations` table
- Create `organization_members` table
- Create `organization_invitations` table
- Add `organization_id` to all existing tables
- Enable Row Level Security (RLS)

### 3. Configure Environment Variables

```bash
# Copy example file
cp .env.example .env.local

# Edit with your values
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Get these values from: Supabase Dashboard > Settings > API

### 4. Update App Router

Add the new auth routes to your router:

```jsx
// AppRouter.jsx
import Login from './components/Login';
import Register from './components/Register';
import { ProtectedRoute, GuestRoute } from './components/ProtectedRoute';

// In your routes:
<Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
<Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
<Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
```

### 5. Migrate Existing Users

For existing localStorage users, you'll need to:

**Option A: Invite them (Recommended)**
1. Admin creates organization
2. Admin invites users via email

**Option B: Bulk migration script**
```javascript
// Run in browser console for each existing user
// This creates a Supabase user and organization
const migrateUser = async (localStorageUser) => {
  const { data, error } = await supabase.auth.admin.createUser({
    email: localStorageUser.username + '@your-domain.com',
    email_confirm: true,
    user_metadata: { name: localStorageUser.name }
  });
  // Then create org and membership...
};
```

## User Roles

| Role | Permissions |
|------|-------------|
| `owner` | Full access, can delete organization |
| `admin` | Manage users, settings, all data |
| `member` | Create/edit apps, tables, run production |
| `viewer` | Read-only access |

## Breaking Changes

### Old Auth (Removed)

```javascript
// OLD - No longer works
import { login, logout, getCurrentUser } from './utils/auth';
login('admin', '123');
```

### New Auth

```javascript
// NEW
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const { login, user, isAuthenticated } = useAuth();
  
  const handleLogin = async () => {
    await login(email, password);
  };
  
  if (!isAuthenticated) return <Login />;
  return <p>Welcome {user.email}</p>;
}
```

## Protecting Routes

```jsx
// Admin-only page
<AdminRoute>
  <AdminSettings />
</AdminRoute>

// Any logged-in user
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>

// Guest only (login, register)
<GuestRoute>
  <Login />
</GuestRoute>
```

## Demo Mode

If Supabase is not configured, the app will show a demo mode notice. Users can still browse but features requiring auth will be disabled.

## Troubleshooting

### "Supabase not configured"

Make sure `.env.local` exists with valid `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

### "RLS policy denied"

Check that:
1. The migration ran successfully
2. User has `organization_members` entry
3. Query includes `organization_id`

### "Email already exists"

User was likely created via a previous registration attempt. Check Supabase Dashboard > Authentication > Users.

## Rollback

To rollback the database migration:

```sql
-- In Supabase SQL Editor
DROP TABLE IF EXISTS public.organization_invitations;
DROP TABLE IF EXISTS public.organization_members;
DROP TABLE IF EXISTS public.organizations;

-- Remove organization_id columns (careful!)
ALTER TABLE public.manuals DROP COLUMN IF EXISTS organization_id;
-- ... repeat for other tables
```
