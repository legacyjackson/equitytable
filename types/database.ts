// ============================================================
// Equity Table — Database Types
// Auto-generated from Supabase schema. Do not hand-edit.
// Regenerate with: npx supabase gen types typescript --local
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ----------------------------------------------------------------
// ENUMS
// ----------------------------------------------------------------
export type PlatformRoleType = 'super_admin' | 'content_admin' | 'support_admin'
export type TableRoleType = 'owner' | 'admin' | 'facilitator' | 'member'
export type MembershipStatusType = 'active' | 'invited' | 'pending' | 'removed' | 'suspended'
export type InvitationStatusType = 'pending' | 'accepted' | 'expired' | 'revoked'
export type VisibilityType = 'public' | 'private' | 'invite_only'
export type TableStatusType = 'active' | 'trial' | 'past_due' | 'canceled' | 'suspended'
export type SubscriptionStatusType =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'paused'
  | 'unpaid'
export type ContentStatusType = 'draft' | 'published' | 'archived'
export type CourseLevelType = 'beginner' | 'intermediate' | 'advanced'
export type ProgressStatusType = 'not_started' | 'in_progress' | 'completed'
export type AudioProviderType = 'kokoro' | 'piper' | 'xtts' | 'human_upload' | 'other'
export type AudioStatusType = 'pending' | 'processing' | 'ready' | 'failed'
export type EventType = 'class' | 'workshop' | 'meetup' | 'webinar' | 'cohort' | 'other'
export type LocationType = 'online' | 'in_person' | 'hybrid'
export type EventStatusType = 'draft' | 'published' | 'canceled' | 'completed'
export type RsvpStatusType = 'going' | 'maybe' | 'not_going' | 'waitlist'
export type StorageProviderType = 'supabase' | 'mux' | 'other'
export type RecordingStatusType = 'processing' | 'ready' | 'failed' | 'hidden'
export type GoalStatusType = 'active' | 'completed' | 'paused' | 'canceled'
export type ContributionType = 'none' | 'manual' | 'pledge' | 'stripe'
export type ContributionStatusType = 'pledged' | 'pending' | 'confirmed' | 'rejected' | 'refunded'
export type PayoutStatusType = 'pending' | 'approved' | 'paid' | 'rejected' | 'failed' | 'canceled'
export type ConversionSourceType = 'webhook' | 'manual' | 'csv'
export type PostType = 'announcement' | 'discussion' | 'resource' | 'reflection' | 'event_update' | 'goal_update'
export type ReactionTargetType = 'post' | 'comment' | 'goal_update' | 'event'

// ----------------------------------------------------------------
// LESSON CONTENT BLOCK TYPES
// These define the structure of lessons[].content jsonb
// ----------------------------------------------------------------
export type ContentBlockType =
  | 'heading'
  | 'paragraph'
  | 'bullet_list'
  | 'numbered_list'
  | 'callout'
  | 'image'
  | 'quote'
  | 'video'
  | 'divider'
  | 'quiz_prompt'

export interface ContentBlockHeading {
  type: 'heading'
  id?: string
  level?: 1 | 2 | 3
  text: string
}

export interface ContentBlockParagraph {
  type: 'paragraph'
  id: string
  text: string
}

export interface ContentBlockBulletList {
  type: 'bullet_list'
  id?: string
  items: string[]
}

export interface ContentBlockNumberedList {
  type: 'numbered_list'
  id?: string
  items: string[]
}

export interface ContentBlockCallout {
  type: 'callout'
  id?: string
  label?: string
  text: string
  variant?: 'info' | 'warning' | 'success' | 'tip'
}

export interface ContentBlockImage {
  type: 'image'
  id?: string
  url: string
  alt?: string
  caption?: string
}

export interface ContentBlockQuote {
  type: 'quote'
  id?: string
  text: string
  attribution?: string
}

export interface ContentBlockVideo {
  type: 'video'
  id?: string
  url: string
  title?: string
}

export interface ContentBlockDivider {
  type: 'divider'
}

export interface ContentBlockQuizPrompt {
  type: 'quiz_prompt'
  quiz_id: string
}

export type LessonContentBlock =
  | ContentBlockHeading
  | ContentBlockParagraph
  | ContentBlockBulletList
  | ContentBlockNumberedList
  | ContentBlockCallout
  | ContentBlockImage
  | ContentBlockQuote
  | ContentBlockVideo
  | ContentBlockDivider
  | ContentBlockQuizPrompt

// ----------------------------------------------------------------
// QUIZ TYPES
// ----------------------------------------------------------------
export interface QuizOption {
  id: string
  text: string
}

export interface QuizQuestion {
  id: string
  type: 'multiple_choice' | 'true_false'
  text: string
  options: QuizOption[]
  correct_option_id: string
  explanation?: string
}

// ----------------------------------------------------------------
// DATABASE ROW TYPES
// ----------------------------------------------------------------

export interface Profile {
  id: string
  email: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  banner_url: string | null
  bio: string | null
  location: string | null
  public_profile: boolean
  onboarding_completed: boolean
  social_links: Json
  financial_interests: string[] | null
  notification_prefs: Json
  created_at: string
  updated_at: string
}

export interface PlatformRole {
  id: string
  user_id: string
  role: PlatformRoleType
  granted_by: string | null
  created_at: string
}

export interface EquityTableType {
  id: string
  name: string
  slug: string
  description: string | null
  recommended_goals: Json
  default_course_categories: string[] | null
  religious_content_allowed: boolean
  sort_order: number
  active: boolean
  created_at: string
}

export interface EquityTable {
  id: string
  owner_id: string
  table_type_id: string
  name: string
  slug: string
  mission: string | null
  description: string | null
  logo_url: string | null
  banner_url: string | null
  visibility: VisibilityType
  member_count: number
  pathway_participant_count: number
  affiliate_code: string | null
  affiliate_default_url: string | null
  publish_affiliate_earnings: boolean
  public_message_board: boolean
  leaderboard_enabled: boolean
  allow_public_goals: boolean
  allow_public_events: boolean
  cta_override_text: string | null
  status: TableStatusType
  created_at: string
  updated_at: string
}

export interface TableMembership {
  id: string
  table_id: string
  user_id: string
  role: TableRoleType
  status: MembershipStatusType
  invited_by: string | null
  joined_at: string | null
  created_at: string
  updated_at: string
}

export interface TableInvitation {
  id: string
  table_id: string
  invited_email: string
  invited_by: string
  role: TableRoleType
  token: string
  status: InvitationStatusType
  expires_at: string
  created_at: string
  accepted_at: string | null
  accepted_by: string | null
}

export interface Subscription {
  id: string
  table_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  base_price_id: string | null
  extra_seat_price_id: string | null
  status: SubscriptionStatusType
  included_seats: number
  extra_seats: number
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  trial_end: string | null
  comped: boolean
  comp_reason: string | null
  comped_by: string | null
  created_at: string
  updated_at: string
}

export interface SeatUsageSnapshot {
  id: string
  table_id: string
  active_seats: number
  included_seats: number
  billable_extra_seats: number
  captured_at: string
}

export interface AffiliateSettings {
  id: string
  default_destination_url: string
  default_payout_amount: number
  payout_currency: string
  cta_default_text: string
  cta_default_text_event: string
  cta_default_text_course: string
  allow_table_cta_customization: boolean
  created_at: string
  updated_at: string
}

export interface AffiliateLink {
  id: string
  table_id: string
  code: string
  destination_url: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface AffiliateClick {
  id: string
  table_id: string | null
  user_id: string | null
  affiliate_link_id: string | null
  course_id: string | null
  lesson_id: string | null
  event_id: string | null
  cta_text: string | null
  cta_placement: string | null
  destination_url: string
  ip_hash: string | null
  user_agent: string | null
  clicked_at: string
}

export interface AffiliateConversion {
  id: string
  table_id: string | null
  user_id: string | null
  affiliate_click_id: string | null
  purchaser_email: string
  external_order_id: string | null
  amount: number
  payout_amount: number
  payout_status: PayoutStatusType
  source: ConversionSourceType
  notes: string | null
  converted_at: string
  created_at: string
  updated_at: string
}

export interface AffiliatePayout {
  id: string
  table_id: string
  amount: number
  status: PayoutStatusType
  payment_method: string | null
  notes: string | null
  processed_by: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
}

export interface CourseCategory {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  religious_context: string | null
  sort_order: number
  active: boolean
  created_at: string
}

export interface Course {
  id: string
  title: string
  slug: string
  description: string | null
  category_id: string
  level: CourseLevelType
  estimated_minutes: number | null
  thumbnail_url: string | null
  status: ContentStatusType
  table_type_recommendations: string[] | null
  religious_context: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface CourseModule {
  id: string
  course_id: string
  title: string
  description: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Lesson {
  id: string
  course_id: string
  module_id: string | null
  title: string
  slug: string
  summary: string | null
  content: LessonContentBlock[]
  transcript_text: string | null
  estimated_minutes: number | null
  sort_order: number
  status: ContentStatusType
  cta_override_text: string | null
  reflection_prompt: string | null
  next_lesson_id: string | null
  created_at: string
  updated_at: string
}

export interface LessonAudio {
  id: string
  lesson_id: string
  audio_url: string | null
  audio_provider: AudioProviderType
  voice_name: string | null
  language: string
  duration_seconds: number | null
  status: AudioStatusType
  error_message: string | null
  generated_at: string | null
  created_at: string
  updated_at: string
}

export interface LessonAudioSegment {
  id: string
  lesson_audio_id: string
  lesson_id: string
  segment_index: number
  start_time: number
  end_time: number
  text: string
  block_id: string | null
  created_at: string
}

export interface LessonProgress {
  id: string
  user_id: string
  lesson_id: string
  table_id: string | null
  status: ProgressStatusType
  progress_percent: number
  last_position_seconds: number
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface CourseProgress {
  id: string
  user_id: string
  course_id: string
  table_id: string | null
  completed_lessons: number
  total_lessons: number
  progress_percent: number
  completed_at: string | null
  updated_at: string
}

export interface Quiz {
  id: string
  lesson_id: string
  title: string | null
  questions: QuizQuestion[]
  passing_score: number
  created_at: string
  updated_at: string
}

export interface QuizAttempt {
  id: string
  quiz_id: string
  user_id: string
  score: number
  answers: Record<string, string>  // question_id -> selected_option_id
  passed: boolean
  created_at: string
}

export interface EquityEvent {
  id: string
  table_id: string
  created_by: string
  title: string
  slug: string
  description: string | null
  event_type: EventType
  visibility: VisibilityType
  starts_at: string
  ends_at: string
  timezone: string
  location_type: LocationType
  meeting_url: string | null
  address: string | null
  capacity: number | null
  image_url: string | null
  attached_course_id: string | null
  attached_lesson_id: string | null
  agenda: EventAgendaItem[]
  post_event_reflection_enabled: boolean
  cta_after_event: boolean
  status: EventStatusType
  created_at: string
  updated_at: string
}

export interface EventAgendaItem {
  time: string
  title: string
  description?: string
  duration_minutes?: number
}

export interface EventRsvp {
  id: string
  event_id: string
  user_id: string
  status: RsvpStatusType
  checked_in: boolean
  checked_in_at: string | null
  created_at: string
  updated_at: string
}

export interface RecordingConsent {
  id: string
  event_id: string
  user_id: string
  consented: boolean
  consent_text: string
  consented_at: string
}

export interface EventRecording {
  id: string
  event_id: string | null
  table_id: string
  uploaded_by: string
  title: string
  description: string | null
  video_url: string | null
  audio_url: string | null
  thumbnail_url: string | null
  storage_provider: StorageProviderType
  storage_path: string | null
  mux_asset_id: string | null
  duration_seconds: number | null
  visibility: VisibilityType
  status: RecordingStatusType
  tags: string[] | null
  created_at: string
  updated_at: string
}

export interface Goal {
  id: string
  table_id: string
  created_by: string
  title: string
  description: string | null
  goal_type: string
  target_metric: string | null
  current_value: number
  target_value: number
  currency: string | null
  start_date: string | null
  target_date: string | null
  visibility: VisibilityType
  accept_contributions: boolean
  contribution_type: ContributionType
  suggested_amounts: number[] | null
  featured: boolean
  status: GoalStatusType
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface GoalUpdate {
  id: string
  goal_id: string
  user_id: string
  update_value: number | null
  update_text: string | null
  evidence_url: string | null
  created_at: string
}

export interface GoalContribution {
  id: string
  goal_id: string
  user_id: string | null
  amount: number
  contribution_type: ContributionType
  stripe_payment_intent_id: string | null
  note: string | null
  status: ContributionStatusType
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  table_id: string
  user_id: string
  title: string | null
  body: string
  post_type: PostType
  visibility: VisibilityType
  pinned: boolean
  attached_file_url: string | null
  attached_goal_id: string | null
  attached_event_id: string | null
  created_at: string
  updated_at: string
}

export interface Comment {
  id: string
  post_id: string
  user_id: string
  body: string
  created_at: string
  updated_at: string
}

export interface Reaction {
  id: string
  user_id: string
  target_type: ReactionTargetType
  target_id: string
  reaction: string
  created_at: string
}

export interface Badge {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  icon_url: string | null
  points: number
  criteria: Json
  active: boolean
  created_at: string
}

export interface UserBadge {
  id: string
  user_id: string
  badge_id: string
  table_id: string | null
  earned_at: string
}

export interface PointsLedgerEntry {
  id: string
  user_id: string
  table_id: string | null
  points: number
  reason: string
  source_type: string
  source_id: string | null
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  body: string
  link_url: string | null
  icon: string | null
  read_at: string | null
  created_at: string
}

export interface FileRecord {
  id: string
  table_id: string | null
  event_id: string | null
  uploaded_by: string
  file_url: string
  storage_path: string | null
  file_type: string
  file_name: string
  mime_type: string | null
  size_bytes: number | null
  visibility: VisibilityType
  created_at: string
}

export interface SystemSetting {
  key: string
  value: Json
  description: string | null
  updated_by: string | null
  updated_at: string
}

export interface FeatureFlag {
  id: string
  name: string
  slug: string
  description: string | null
  enabled: boolean
  enabled_for: Json
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: string
  actor_user_id: string | null
  action: string
  target_type: string | null
  target_id: string | null
  metadata: Json
  ip_hash: string | null
  user_agent: string | null
  created_at: string
}

export interface LegalPage {
  id: string
  slug: string
  title: string
  content: string
  published: boolean
  updated_by: string | null
  created_at: string
  updated_at: string
}

// ----------------------------------------------------------------
// COMPOSITE / JOIN TYPES
// Commonly needed joined shapes for the UI layer
// ----------------------------------------------------------------

/** Profile + their platform role */
export interface ProfileWithRole extends Profile {
  platform_roles: PlatformRole[]
}

/** Membership + joined profile data */
export interface MembershipWithProfile extends TableMembership {
  profile: Pick<Profile, 'id' | 'email' | 'username' | 'full_name' | 'avatar_url'>
}

/** Equity Table + type + membership + affiliate link */
export interface EquityTableWithDetails extends EquityTable {
  table_type: EquityTableType
  membership?: TableMembership
  affiliate_link?: AffiliateLink
  subscription?: Subscription
}

/** Course + category + user progress */
export interface CourseWithProgress extends Course {
  category: CourseCategory
  progress?: CourseProgress
  lesson_count?: number
}

/** Lesson + audio + user progress */
export interface LessonWithAudio extends Lesson {
  audio?: LessonAudio
  segments?: LessonAudioSegment[]
  progress?: LessonProgress
}

/** Event + RSVP status for current user */
export interface EventWithRsvp extends EquityEvent {
  user_rsvp?: EventRsvp
  rsvp_count?: number
  recording?: EventRecording
}

/** Goal + progress + contribution totals */
export interface GoalWithProgress extends Goal {
  updates?: GoalUpdate[]
  contribution_total?: number
  contributor_count?: number
}

/** Post + comment count + reaction counts */
export interface PostWithEngagement extends Post {
  author: Pick<Profile, 'id' | 'username' | 'full_name' | 'avatar_url'>
  comment_count: number
  reaction_counts: Record<string, number>
  user_reactions: string[]
}

// ----------------------------------------------------------------
// RESPONSE TYPES for API / Server Actions
// ----------------------------------------------------------------

export interface ActionResult<T = void> {
  data?: T
  error?: string
}

export interface PaginatedResult<T> {
  data: T[]
  count: number
  page: number
  per_page: number
  total_pages: number
}

// ----------------------------------------------------------------
// FORM INPUT TYPES (used with React Hook Form + Zod)
// ----------------------------------------------------------------

export interface CreateTableFormInput {
  name: string
  table_type_id: string
  mission: string
  description?: string
  visibility: VisibilityType
}

export interface CreateEventFormInput {
  title: string
  description?: string
  event_type: EventType
  visibility: VisibilityType
  starts_at: string
  ends_at: string
  timezone: string
  location_type: LocationType
  meeting_url?: string
  address?: string
  capacity?: number
  attached_course_id?: string
  attached_lesson_id?: string
}

export interface CreateGoalFormInput {
  title: string
  description?: string
  goal_type: string
  target_metric?: string
  target_value: number
  currency?: string
  start_date?: string
  target_date?: string
  visibility: VisibilityType
  accept_contributions: boolean
  contribution_type: ContributionType
  suggested_amounts?: number[]
  featured: boolean
}

export interface InviteMemberFormInput {
  email: string
  role: TableRoleType
}

export interface UpdateProfileFormInput {
  full_name?: string
  username?: string
  bio?: string
  location?: string
  public_profile: boolean
  financial_interests?: string[]
  social_links?: Record<string, string>
}

// ----------------------------------------------------------------
// SEAT USAGE (computed, not stored)
// ----------------------------------------------------------------
export interface SeatUsage {
  active_seats: number
  included_seats: number
  extra_seats_needed: number
  extra_monthly_cost: number
  can_invite: boolean
  will_add_seat: boolean
}

// ----------------------------------------------------------------
// CTA / AFFILIATE CONTEXT
// ----------------------------------------------------------------
export interface CTAContext {
  cta_text: string
  destination_url: string
  table_id: string | null
  affiliate_link_id: string | null
  lesson_id?: string
  course_id?: string
  event_id?: string
  placement: string
}
