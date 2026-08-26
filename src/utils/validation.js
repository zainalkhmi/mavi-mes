/**
 * validation.js
 * =====================================================
 * Zod Schemas for Input Validation
 * Provides runtime validation for all user inputs
 * =====================================================
 */

import { z } from 'zod';

// ─── Auth Schemas ────────────────────────────────────────────────────────────

export const emailSchema = z.string()
  .email('Invalid email address')
  .min(5, 'Email too short')
  .max(255, 'Email too long')
  .transform(v => v.toLowerCase().trim());

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long')
    .trim(),
  email: emailSchema,
  password: passwordSchema,
  organizationName: z.string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name too long')
    .trim(),
});

// ─── User/Profile Schemas ─────────────────────────────────────────────────────

export const userMetadataSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatar_url: z.string().url().optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  current_organization_id: z.string().uuid().optional().nullable(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatar_url: z.string().url().optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
});

// ─── Organization Schemas ─────────────────────────────────────────────────────

export const organizationSchema = z.object({
  name: z.string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name too long')
    .trim(),
  slug: z.string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .optional(),
  plan: z.enum(['free', 'starter', 'professional', 'enterprise']).default('free'),
  settings: z.object({
    timezone: z.string().optional(),
    language: z.string().optional(),
    dateFormat: z.string().optional(),
  }).optional().default({}),
});

export const inviteMemberSchema = z.object({
  email: emailSchema,
  role: z.enum(['admin', 'member', 'viewer']),
});

// ─── App Builder Schemas ──────────────────────────────────────────────────────

export const appNameSchema = z.string()
  .min(1, 'App name is required')
  .max(100, 'App name too long')
  .trim();

export const appCategorySchema = z.enum([
  'Shop Floor',
  'Quality Control',
  'Inventory',
  'Production',
  'Maintenance',
  'Logistics',
  'Custom',
]);

export const componentTypeSchema = z.enum([
  'TEXT',
  'IMAGE',
  'BUTTON',
  'TEXT_INPUT',
  'TEXT_AREA',
  'DROPDOWN',
  'CHECKBOX',
  'RADIO_GROUP',
  'CHECKLIST',
  'SIGNATURE',
  'QUALITY_PASS_FAIL',
  'CAMERA_CAPTURE',
  'GAUGE',
  'INTERACTIVE_TABLE',
  'NUMBER_INPUT',
  'DATE_PICKER',
  'DATETIME_PICKER',
  'SLIDER',
  'SHAPE_RECTANGLE',
  'SHAPE_CIRCLE',
  'SHAPE_LINE',
  'VARIABLE_TEXT',
  'VIDEO_PLAYER',
  'QR_SCANNER',
  'BARCODE_SCANNER',
]);

export const componentPositionSchema = z.object({
  x: z.number().min(0).max(2000),
  y: z.number().min(0).max(2000),
  w: z.number().min(10).max(2000),
  h: z.number().min(10).max(2000),
});

export const componentPropsSchema = z.record(z.any());

export const componentSchema = z.object({
  id: z.string(),
  type: componentTypeSchema,
  x: z.number().min(0).max(2000),
  y: z.number().min(0).max(2000),
  w: z.number().min(10).max(2000),
  h: z.number().min(10).max(2000),
  props: componentPropsSchema.optional().default({}),
});

export const stepSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  stepType: z.enum(['Step', 'Form Step', 'Signature Form']),
  cycleTimeSeconds: z.number().int().min(0).optional().default(60),
  components: z.array(componentSchema).optional().default([]),
});

export const appBuilderConfigSchema = z.object({
  name: appNameSchema,
  category: appCategorySchema.optional().default('Custom'),
  steps: z.array(stepSchema).min(1, 'App must have at least one step'),
  variables: z.array(z.object({
    id: z.string(),
    name: z.string().min(1).max(50),
    type: z.enum(['TEXT', 'NUMBER', 'BOOLEAN', 'DATE', 'DATETIME']),
    defaultValue: z.any().optional(),
    persisted: z.boolean().optional().default(true),
  })).optional().default([]),
  settings: z.object({
    allowSkip: z.boolean().optional().default(false),
    showProgressBar: z.boolean().optional().default(true),
    requireSignature: z.boolean().optional().default(false),
    autoAdvance: z.boolean().optional().default(false),
  }).optional().default({}),
});

export const saveAppSchema = z.object({
  id: z.string().uuid().optional(),
  name: appNameSchema,
  category: appCategorySchema.optional().default('Custom'),
  config: appBuilderConfigSchema,
});

// ─── Table/DB Schemas ────────────────────────────────────────────────────────

export const fieldTypeSchema = z.enum([
  'TEXT',
  'NUMBER',
  'BOOLEAN',
  'DATE',
  'DATETIME',
  'TIME',
  'SELECT',
  'MULTISELECT',
  'EMAIL',
  'PHONE',
  'URL',
  'FILE',
  'IMAGE',
  'JSON',
]);

export const tableFieldSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(50).trim(),
  type: fieldTypeSchema,
  required: z.boolean().optional().default(false),
  defaultValue: z.any().optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    options: z.array(z.string()).optional(),
  }).optional().default({}),
});

export const createTableSchema = z.object({
  name: z.string()
    .min(1)
    .max(50)
    .regex(/^[a-z][a-z0-9_]*$/, 'Table name must start with letter and contain only lowercase letters, numbers, underscores'),
  description: z.string().max(500).optional().default(''),
  fields: z.array(tableFieldSchema).min(1, 'Table must have at least one field'),
});

export const tableRecordSchema = z.record(z.any());

// ─── Variable Schemas ────────────────────────────────────────────────────────

export const variableTypeSchema = z.enum(['TEXT', 'NUMBER', 'BOOLEAN', 'DATE', 'DATETIME', 'SELECT']);

export const variableSchema = z.object({
  id: z.string(),
  name: z.string()
    .min(1)
    .max(50)
    .regex(/^[A-Z][A-Z0-9_]*$/, 'Variable name must start with uppercase letter and contain only uppercase letters, numbers, underscores'),
  type: variableTypeSchema,
  defaultValue: z.any().optional(),
  persisted: z.boolean().optional().default(true),
  validationRules: z.object({
    required: z.boolean().optional().default(false),
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    options: z.array(z.string()).optional(),
  }).optional().default({}),
});

// ─── Webhook Schemas ─────────────────────────────────────────────────────────

export const webhookConfigSchema = z.object({
  url: z.string().url('Invalid webhook URL'),
  secretKey: z.string().max(256).optional(),
  enabled: z.boolean().optional().default(true),
  subscriptions: z.record(z.boolean()).optional().default({}),
});

export const testWebhookSchema = z.object({
  event: z.enum([
    'work_order.created',
    'work_order.started',
    'work_order.completed',
    'cycle.completed',
    'inspection.passed',
    'inspection.failed',
    'andon.triggered',
    'andon.resolved',
    'test.connection',
  ]),
  data: z.record(z.any()).optional().default({}),
  metadata: z.object({
    station: z.string().optional(),
    operator: z.string().optional(),
    app_id: z.string().uuid().optional().nullable(),
  }).optional().default({}),
});

// ─── n8n Event Types ─────────────────────────────────────────────────────────

export const n8nEventTypeSchema = z.enum([
  'work_order.created',
  'work_order.started',
  'work_order.completed',
  'cycle.completed',
  'inspection.passed',
  'inspection.failed',
  'andon.triggered',
  'andon.resolved',
  'production.job_created',
  'machine.status_changed',
  'inventory.low_stock',
  'app.published',
  'chat.message_sent',
]);

// ─── Utility Functions ───────────────────────────────────────────────────────

/**
 * Validate data against a schema
 * @param {z.ZodSchema} schema
 * @param {any} data
 * @returns {{ valid: boolean, data?: any, errors?: string[] }}
 */
export function validate(schema, data) {
  try {
    const result = schema.parse(data);
    return { valid: true, data: result };
  } catch (err) {
    // Zod v4 uses `issues`, older versions use `errors`
    const issues = err.issues || err.errors;
    if (issues) {
      const errors = issues.map(e => `${e.path.join('.')}: ${e.message}`);
      return { valid: false, errors };
    }
    return { valid: false, errors: ['Validation error'] };
  }
}

/**
 * Validate and throw on error
 * @param {z.ZodSchema} schema
 * @param {any} data
 * @returns {any} Parsed data
 */
export function validateOrThrow(schema, data) {
  return schema.parse(data);
}

/**
 * Safe validate - doesn't throw, returns result
 * @param {z.ZodSchema} schema
 * @param {any} data
 * @returns {any} Parsed data or original data if invalid
 */
export function safeValidate(schema, data) {
  try {
    return schema.parse(data);
  } catch {
    return data;
  }
}

/**
 * Create a sanitized schema that strips unknown keys
 * @param {z.ZodSchema} schema
 * @returns {z.ZodSchema}
 */
export function strictSchema(schema) {
  return schema.strict();
}
