/**
 * TYPES.md - TypeScript Migration Guide
 * =====================================================
 * Incremental TypeScript migration strategy
 * =====================================================
 */

# TypeScript Migration Guide

## Overview

This guide provides an incremental approach to migrating Mavi MES from JavaScript to TypeScript.

## Why TypeScript?

- **Type Safety**: Catch errors at compile time
- **Better IDE Support**: Autocomplete, refactoring
- **Documentation**: Types as documentation
- **Scalability**: Better for large codebases
- **Maintainability**: Self-documenting code

## Migration Strategy

### Phase 1: Add TypeScript Support (No Code Changes)

1. Install TypeScript dependencies:
```bash
npm install -D typescript @types/react @types/react-dom @types/node
```

2. Add `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "allowJs": true,
    "checkJs": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "types": ["vitest/globals", "node"]
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

### Phase 2: Rename Files (.js → .tsx/.ts)

1. **Start with critical files**:
```
src/utils/auth.ts
src/utils/supabaseAuth.ts
src/contexts/AuthContext.tsx
src/utils/securityService.ts
```

2. **Then move to components**:
```
src/components/Login.tsx
src/components/Register.tsx
src/components/ProtectedRoute.tsx
```

3. **Finally, utilities**:
```
src/utils/*.ts
src/hooks/*.ts
src/store/*.ts
```

### Phase 3: Add Types Gradually

Start with `strict: false`, then enable strict options one by one:

```json
{
  "compilerOptions": {
    "strict": false,
    "noImplicitAny": true,        // Phase 1
    "strictNullChecks": true,     // Phase 2
    "strictFunctionTypes": true,   // Phase 3
    "strict": true                // Phase 4 (final)
  }
}
```

## Type Definitions

### Existing Patterns

```typescript
// Current JS pattern
export function login(email, password) { ... }

// TypeScript migration
export interface LoginCredentials {
  email: string;
  password: string;
}

export async function login(credentials: LoginCredentials): Promise<User> { ... }
```

### Common Types to Define

```typescript
// src/types/index.ts

// User types
export interface User {
  id: string;
  email: string;
  user_metadata?: UserMetadata;
  created_at?: string;
  updated_at?: string;
}

export interface UserMetadata {
  name?: string;
  avatar_url?: string;
  organization_id?: string;
}

// Organization types
export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// App Builder types
export interface AppConfig {
  id: string;
  name: string;
  category: string;
  steps: Step[];
  variables: Variable[];
}

export interface Step {
  id: string;
  title: string;
  stepType: 'Step' | 'Form Step' | 'Signature Form';
  cycleTimeSeconds: number;
  components: Component[];
}

export interface Component {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  w: number;
  h: number;
  props: Record<string, any>;
}

// Database types
export interface TableDefinition {
  id: string;
  name: string;
  fields: TableField[];
}

export interface TableField {
  id: string;
  name: string;
  type: FieldType;
  required: boolean;
  defaultValue?: any;
}
```

## Migration Checklist

### Priority 1: Critical (Security/Auth)

- [ ] `src/utils/auth.ts`
- [ ] `src/utils/supabaseAuth.ts`
- [ ] `src/contexts/AuthContext.tsx`
- [ ] `src/components/Login.tsx`
- [ ] `src/components/Register.tsx`
- [ ] `src/utils/securityService.ts`

### Priority 2: High (Core Functionality)

- [ ] `src/utils/n8nWebhookService.ts`
- [ ] `src/utils/validation.ts`
- [ ] `src/utils/sanitize.ts`
- [ ] `src/store/*.ts`

### Priority 3: Medium (UI Components)

- [ ] `src/components/ProtectedRoute.tsx`
- [ ] `src/components/ErrorBoundary.tsx`
- [ ] `src/components/HealthDashboard.tsx`

### Priority 4: Low (Utilities)

- [ ] `src/utils/*.ts` (remaining)
- [ ] `src/hooks/*.ts`
- [ ] `src/components/*.tsx` (remaining)

## TypeScript Configuration

### Strict Mode Checklist

When enabling strict mode, fix these common issues:

```typescript
// Before
function processData(data) {
  return data.id; // Error: 'data' is implicitly 'any'
}

// After
function processData(data: { id: string }) {
  return data.id;
}
```

### Null/Undefined Handling

```typescript
// Before
const name = user.profile?.name; // Could be undefined

// After
const name: string = user.profile?.name ?? 'Anonymous';
```

## Benefits After Migration

1. **IDE Autocomplete**: Better suggestions
2. **Refactoring Safety**: Rename types safely
3. **Documentation**: Hover for type info
4. **Bug Prevention**: Catch issues early
5. **Code Review**: Clearer intent

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
