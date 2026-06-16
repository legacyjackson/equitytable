// ============================================================
// Equity Table — Project Structure
// This file documents every file and directory in the project.
// Use this as a reference while scaffolding the Next.js app.
// ============================================================

/*
equity-table/
├── .env.local                          # Local env vars (never commit)
├── .env.example                        # Example env vars (commit this)
├── .gitignore
├── next.config.ts
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── middleware.ts                        # Auth + route protection
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_enums_and_profiles.sql
│   │   ├── 002_equity_tables.sql
│   │   ├── 003_affiliate_system.sql
│   │   ├── 004_learning_portal.sql
│   │   ├── 005_events_goals_board.sql
│   │   └── 006_gamification_system.sql
│   ├── seeds/
│   │   └── 001_seed_data.sql
│   └── config.toml
│
├── types/
│   ├── database.ts                     # Row types, enums, composites
│   └── index.ts                        # Re-exports
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # Browser Supabase client
│   │   ├── server.ts                   # Server Supabase client (cookies)
│   │   └── middleware.ts               # Supabase middleware helper
│   ├── stripe/
│   │   ├── client.ts                   # Stripe client init
│   │   └── plans.ts                    # Price IDs + plan constants
│   ├── utils/
│   │   ├── affiliate.ts                # Affiliate code generation + URL builder
│   │   ├── seats.ts                    # Seat calculation helpers
│   │   ├── slugify.ts                  # Slug generation
│   │   ├── format.ts                   # Currency, date, number formatting
│   │   ├── audio.ts                    # Audio player helpers
│   │   └── badges.ts                   # Badge award logic
│   └── validations/
│       ├── table.ts                    # Zod schemas for equity table forms
│       ├── event.ts                    # Zod schemas for event forms
│       ├── goal.ts                     # Zod schemas for goal forms
│       ├── profile.ts                  # Zod schemas for profile forms
│       └── invite.ts                   # Zod schemas for invite forms
│
├── app/
│   ├── layout.tsx                      # Root layout (fonts, providers)
│   ├── globals.css                     # Tailwind base + brand tokens
│   ├── not-found.tsx
│   ├── error.tsx
│   │
│   ├── (marketing)/                    # Public marketing pages
│   │   ├── layout.tsx                  # Marketing layout (top nav + footer)
│   │   ├── page.tsx                    # / — Landing page
│   │   ├── pricing/page.tsx            # /pricing
│   │   ├── how-it-works/page.tsx       # /how-it-works
│   │   ├── table-types/page.tsx        # /table-types
│   │   ├── equity-tables/
│   │   │   ├── page.tsx                # /equity-tables — Public directory
│   │   │   └── [slug]/page.tsx         # /equity-tables/[slug] — Public table profile
│   │   └── events/
│   │       └── [eventId]/page.tsx      # /events/[eventId] — Public event page
│   │
│   ├── (auth)/                         # Auth pages
│   │   ├── layout.tsx
│   │   ├── sign-in/page.tsx
│   │   ├── sign-up/page.tsx
│   │   └── callback/route.ts           # Supabase auth callback
│   │
│   ├── (legal)/                        # Legal pages
│   │   ├── layout.tsx
│   │   └── legal/
│   │       ├── privacy/page.tsx
│   │       ├── terms/page.tsx
│   │       ├── affiliate-disclosure/page.tsx
│   │       ├── financial-education-disclaimer/page.tsx
│   │       └── recording-consent/page.tsx
│   │
│   ├── invite/[token]/page.tsx         # /invite/[token] — Accept invitation
│   │
│   ├── app/                            # Authenticated app shell
│   │   ├── layout.tsx                  # App layout (sidebar, top nav, table switcher)
│   │   ├── page.tsx                    # /app — User dashboard
│   │   │
│   │   ├── profile/
│   │   │   ├── page.tsx                # /app/profile — Edit own profile
│   │   │   └── [username]/page.tsx     # /app/profile/[username] — View user profile
│   │   │
│   │   ├── my-tables/page.tsx          # /app/my-tables — Tables user belongs to
│   │   ├── notifications/page.tsx      # /app/notifications
│   │   ├── badges/page.tsx             # /app/badges — User's badge collection
│   │   │
│   │   └── tables/
│   │       └── [tableId]/
│   │           ├── layout.tsx          # Table layout (passes table context)
│   │           ├── page.tsx            # /app/tables/[tableId] — Table dashboard
│   │           ├── profile/page.tsx    # Manage table profile
│   │           ├── members/page.tsx    # Member management + invites
│   │           ├── billing/page.tsx    # Subscription + seats
│   │           ├── settings/page.tsx   # Table settings
│   │           ├── affiliate/page.tsx  # Affiliate dashboard
│   │           ├── message-board/page.tsx
│   │           ├── recordings/page.tsx
│   │           │
│   │           ├── courses/
│   │           │   ├── page.tsx        # Course library
│   │           │   └── [courseId]/page.tsx
│   │           │
│   │           ├── lessons/
│   │           │   └── [lessonId]/page.tsx  # Lesson player
│   │           │
│   │           ├── events/
│   │           │   ├── page.tsx        # Events list/calendar
│   │           │   ├── new/page.tsx    # Create event
│   │           │   └── [eventId]/
│   │           │       ├── page.tsx    # Event dashboard
│   │           │       └── record/page.tsx  # Recording studio
│   │           │
│   │           └── goals/
│   │               ├── page.tsx        # Goals dashboard
│   │               ├── new/page.tsx    # Create goal
│   │               └── [goalId]/page.tsx
│   │
│   ├── admin/                          # Super Admin pages
│   │   ├── layout.tsx                  # Admin layout
│   │   ├── page.tsx                    # Platform overview
│   │   ├── users/page.tsx
│   │   ├── equity-tables/page.tsx
│   │   ├── subscriptions/page.tsx
│   │   ├── affiliate/
│   │   │   ├── page.tsx
│   │   │   ├── conversions/page.tsx
│   │   │   └── payouts/page.tsx
│   │   ├── courses/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [courseId]/
│   │   │       ├── page.tsx
│   │   │       └── lessons/[lessonId]/page.tsx
│   │   ├── audio-jobs/page.tsx
│   │   ├── events/page.tsx
│   │   ├── recordings/page.tsx
│   │   ├── goals/page.tsx
│   │   ├── content-categories/page.tsx
│   │   ├── table-types/page.tsx
│   │   ├── feature-flags/page.tsx
│   │   ├── system-settings/page.tsx
│   │   └── audit-logs/page.tsx
│   │
│   └── api/
│       ├── auth/
│       │   └── callback/route.ts
│       ├── stripe/
│       │   ├── checkout/route.ts       # Create checkout session
│       │   └── webhooks/route.ts       # Handle Stripe events
│       ├── affiliate/
│       │   └── click/route.ts          # Record CTA click
│       ├── upload/
│       │   └── sign/route.ts           # Generate signed upload URL
│       └── audio/
│           └── generate/route.ts       # Queue TTS generation job
│
├── components/
│   ├── ui/                             # shadcn/ui components (auto-generated)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── textarea.tsx
│   │   ├── toast.tsx
│   │   ├── progress.tsx
│   │   ├── badge.tsx
│   │   ├── avatar.tsx
│   │   ├── separator.tsx
│   │   ├── tabs.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── tooltip.tsx
│   │   └── ...
│   │
│   ├── brand/
│   │   ├── Logo.tsx                    # ET logo component (white + color variants)
│   │   ├── LogoMark.tsx                # Icon only
│   │   └── BrandColors.ts              # Brand color constants
│   │
│   ├── layout/
│   │   ├── Sidebar.tsx                 # Main app sidebar
│   │   ├── TopNav.tsx                  # Top navigation + table switcher
│   │   ├── TableSwitcher.tsx           # Active table context switcher
│   │   ├── UserMenu.tsx                # User dropdown
│   │   ├── MarketingNav.tsx            # Public marketing navigation
│   │   └── Footer.tsx                  # Marketing footer
│   │
│   ├── tables/
│   │   ├── TableCard.tsx               # Directory card for equity tables
│   │   ├── TableProfileHero.tsx        # Public profile hero section
│   │   ├── CreateTableWizard.tsx       # Multi-step table creation
│   │   ├── TableTypeSelector.tsx       # Type picker with descriptions
│   │   └── TableDashboard.tsx          # Table dashboard layout
│   │
│   ├── members/
│   │   ├── MemberTable.tsx             # Datatable of members with role
│   │   ├── InviteModal.tsx             # Invite by email modal
│   │   ├── SeatUsageBanner.tsx         # Seat limit warning/info
│   │   └── MemberCard.tsx              # Member profile card
│   │
│   ├── courses/
│   │   ├── CourseCard.tsx              # Course card with progress
│   │   ├── CourseGrid.tsx              # Responsive grid of courses
│   │   ├── LessonPlayer.tsx            # Full lesson viewer
│   │   ├── AudioPlayer.tsx             # Read-along audio player
│   │   ├── TranscriptSync.tsx          # Synced transcript display
│   │   ├── LessonCTA.tsx               # End-of-lesson CTA block
│   │   ├── ProgressRing.tsx            # Circular progress indicator
│   │   └── CourseCategoryBadge.tsx
│   │
│   ├── events/
│   │   ├── EventCard.tsx               # Event card
│   │   ├── EventList.tsx               # List of events
│   │   ├── CreateEventWizard.tsx       # Multi-step event creation
│   │   ├── EventRsvpButton.tsx         # RSVP toggle
│   │   └── RecordingStudio.tsx         # Browser recording interface
│   │
│   ├── goals/
│   │   ├── GoalCard.tsx                # Goal card with progress bar
│   │   ├── GoalProgressBar.tsx         # Progress visualization
│   │   ├── CreateGoalWizard.tsx        # Goal creation wizard
│   │   ├── GoalUpdateForm.tsx          # Post a progress update
│   │   └── GoalContributeModal.tsx     # Contribution modal
│   │
│   ├── gamification/
│   │   ├── BadgeCard.tsx               # Badge display
│   │   ├── BadgeGrid.tsx               # User's badge collection
│   │   ├── Leaderboard.tsx             # Table leaderboard
│   │   ├── PointsDisplay.tsx           # XP points widget
│   │   └── Confetti.tsx                # Celebration overlay
│   │
│   ├── affiliate/
│   │   ├── AffiliateStatCard.tsx       # Click/conversion/earnings stat
│   │   ├── AffiliateLinkCopy.tsx       # Link display + copy button
│   │   ├── GlobalPathwaysCTA.tsx       # The CTA component used everywhere
│   │   └── AffiliateDisclosure.tsx     # Required disclosure text
│   │
│   ├── message-board/
│   │   ├── PostCard.tsx                # Post with comments
│   │   ├── PostComposer.tsx            # Create/edit post
│   │   ├── CommentList.tsx
│   │   └── ReactionPicker.tsx
│   │
│   ├── profile/
│   │   ├── ProfileAvatar.tsx           # Avatar with crop support
│   │   ├── AvatarCropper.tsx           # react-easy-crop interface
│   │   ├── ProfileCard.tsx             # User profile card
│   │   └── ProfileEditForm.tsx
│   │
│   └── common/
│       ├── EmptyState.tsx              # Reusable empty state
│       ├── LoadingSkeleton.tsx         # Page-level skeleton
│       ├── ErrorBoundary.tsx
│       ├── ConfirmDialog.tsx
│       ├── PageHeader.tsx              # Section header with breadcrumb
│       ├── DataTable.tsx               # Generic admin data table
│       ├── SearchInput.tsx
│       ├── FileUpload.tsx              # General file upload with progress
│       └── StatCard.tsx                # Dashboard stat card
│
└── hooks/
    ├── useSupabase.ts                  # Supabase client access
    ├── useUser.ts                      # Current user + profile
    ├── useTable.ts                     # Active equity table context
    ├── useTableRole.ts                 # Current user's role in active table
    ├── useSeatUsage.ts                 # Live seat calculation
    ├── useAffiliateLink.ts             # Table's affiliate link
    ├── useCTA.ts                       # Resolved CTA text + URL
    └── useNotifications.ts             # Real-time notifications

*/

export {}
