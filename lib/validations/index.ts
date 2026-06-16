import { z } from 'zod'

// ── Profile ───────────────────────────────────────────────────
export const updateProfileSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(80, 'Name must be under 80 characters'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be under 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and dashes'),
  bio: z.string().max(500, 'Bio must be under 500 characters').optional(),
  location: z.string().max(100).optional(),
  public_profile: z.boolean(),
  financial_interests: z.array(z.string()).optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

// ── Auth ──────────────────────────────────────────────────────
export const signUpSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be under 72 characters'),
  full_name: z
    .string()
    .min(2, 'Enter your full name')
    .max(80, 'Name must be under 80 characters'),
})

export type SignUpInput = z.infer<typeof signUpSchema>

export const signInSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
})

export type SignInInput = z.infer<typeof signInSchema>

// ── Equity Table ──────────────────────────────────────────────
export const createTableSchema = z.object({
  name: z
    .string()
    .min(2, 'Table name must be at least 2 characters')
    .max(100, 'Table name must be under 100 characters'),
  table_type_id: z.string().uuid('Select a table type'),
  mission: z
    .string()
    .min(10, 'Mission must be at least 10 characters')
    .max(300, 'Mission must be under 300 characters'),
  description: z.string().max(2000).optional(),
  visibility: z.enum(['public', 'private', 'invite_only']).default('public'),
})

export type CreateTableInput = z.infer<typeof createTableSchema>

export const updateTableSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  mission: z.string().min(10).max(300).optional(),
  description: z.string().max(2000).optional(),
  visibility: z.enum(['public', 'private', 'invite_only']).optional(),
  public_message_board: z.boolean().optional(),
  leaderboard_enabled: z.boolean().optional(),
  allow_public_goals: z.boolean().optional(),
  allow_public_events: z.boolean().optional(),
  publish_affiliate_earnings: z.boolean().optional(),
})

export type UpdateTableInput = z.infer<typeof updateTableSchema>

// ── Invite member ─────────────────────────────────────────────
export const inviteMemberSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  role: z
    .enum(['admin', 'facilitator', 'member'])
    .default('member'),
})

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>

// ── Event ─────────────────────────────────────────────────────
export const createEventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().max(5000).optional(),
  event_type: z.enum(['class', 'workshop', 'meetup', 'webinar', 'cohort', 'other']).default('class'),
  visibility: z.enum(['public', 'table_only', 'invite_only']).default('table_only'),
  starts_at: z.string().datetime('Enter a valid start date and time'),
  ends_at: z.string().datetime('Enter a valid end date and time'),
  timezone: z.string().default('America/Los_Angeles'),
  location_type: z.enum(['online', 'in_person', 'hybrid']).default('online'),
  meeting_url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  address: z.string().max(500).optional(),
  capacity: z.number().int().min(1).max(10000).optional(),
  attached_course_id: z.string().uuid().optional(),
  attached_lesson_id: z.string().uuid().optional(),
}).refine(
  (data) => new Date(data.ends_at) > new Date(data.starts_at),
  { message: 'End time must be after start time', path: ['ends_at'] }
)

export type CreateEventInput = z.infer<typeof createEventSchema>

// ── Goal ──────────────────────────────────────────────────────
export const createGoalSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().max(2000).optional(),
  goal_type: z.string().min(1, 'Select a goal type'),
  target_metric: z.string().optional(),
  target_value: z.number().positive('Target must be a positive number'),
  currency: z.string().optional(),
  start_date: z.string().optional(),
  target_date: z.string().optional(),
  visibility: z.enum(['public', 'table_only', 'admin_only']).default('table_only'),
  accept_contributions: z.boolean().default(false),
  contribution_type: z.enum(['none', 'manual', 'pledge', 'stripe']).default('none'),
  suggested_amounts: z.array(z.number().positive()).optional(),
  featured: z.boolean().default(false),
})

export type CreateGoalInput = z.infer<typeof createGoalSchema>

export const goalUpdateSchema = z.object({
  update_value: z.number().optional(),
  update_text: z.string().min(1, 'Add a note about this update').max(1000),
  evidence_url: z.string().url().optional().or(z.literal('')),
})

export type GoalUpdateInput = z.infer<typeof goalUpdateSchema>

// ── Post ──────────────────────────────────────────────────────
export const createPostSchema = z.object({
  title: z.string().max(200).optional(),
  body: z.string().min(1, 'Write something').max(10000),
  post_type: z
    .enum(['announcement', 'discussion', 'resource', 'reflection', 'event_update', 'goal_update'])
    .default('discussion'),
  visibility: z.enum(['public', 'table_only', 'admin_only']).default('table_only'),
  pinned: z.boolean().default(false),
})

export type CreatePostInput = z.infer<typeof createPostSchema>

// ── Comment ───────────────────────────────────────────────────
export const createCommentSchema = z.object({
  body: z.string().min(1, 'Write a comment').max(2000),
})

export type CreateCommentInput = z.infer<typeof createCommentSchema>
