// supabase/functions/rate-limiter/index.ts
// =====================================================
// Rate Limiter Edge Function
// Deploy to Supabase Edge Functions for server-side rate limiting
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Rate limit configuration
const RATE_LIMITS = {
  '/auth': { max: 10, window: 60 },      // 10 requests per minute
  '/api': { max: 100, window: 60 },       // 100 requests per minute
  '/api/ai': { max: 20, window: 60 },    // 20 AI requests per minute
  '/api/upload': { max: 10, window: 60 }, // 10 uploads per minute
};

// In-memory store for rate limiting (resets on cold start)
// For production, use Supabase database or Redis
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname;

  // Find matching rate limit rule
  let limit = RATE_LIMITS['/api']; // Default
  for (const [pattern, config] of Object.entries(RATE_LIMITS)) {
    if (path.startsWith(pattern)) {
      limit = config;
      break;
    }
  }

  // Get identifier (user ID or IP)
  let identifier = 'anonymous';

  try {
    // Try to get user ID from JWT
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const client = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );

      const { data: { user } } = await client.auth.getUser();
      if (user) {
        identifier = user.id;
      }
    }
  } catch {
    // Fallback to IP
    identifier = req.headers.get('x-forwarded-for')?.split(',')[0] ||
                 req.headers.get('cf-connecting-ip') ||
                 'anonymous';
  }

  // Check rate limit
  const key = `${identifier}:${path}`;
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (record && record.resetAt > now) {
    // Rate limit exceeded
    const remaining = limit.max - record.count;
    const resetIn = Math.ceil((record.resetAt - now) / 1000);

    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        limit: limit.max,
        remaining: 0,
        resetIn: `${resetIn}s`,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': String(limit.max),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(record.resetAt),
          'Retry-After': String(resetIn),
        },
      }
    );
  }

  // Update rate limit record
  const newCount = record ? record.count + 1 : 1;
  const resetAt = record ? record.resetAt : now + (limit.window * 1000);

  rateLimitStore.set(key, { count: newCount, resetAt });

  // Clean up expired entries periodically
  if (Math.random() < 0.1) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetAt < now) {
        rateLimitStore.delete(k);
      }
    }
  }

  // Return rate limit headers
  return new Response(
    JSON.stringify({ success: true }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': String(limit.max),
        'X-RateLimit-Remaining': String(limit.max - newCount),
        'X-RateLimit-Reset': String(resetAt),
      },
    }
  );
})
