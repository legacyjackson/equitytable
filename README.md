# Equity Table

**"Build wealth with the people you trust."**

Equity Table is a SaaS platform where families, organizations, churches, businesses, and communities create private financial literacy groups — called Equity Tables — to learn together, host events, track shared goals, and take action through Global Pathways.

---

## What This Is

Equity Table helps groups:
- **Learn** through a financial literacy course library with read-along audio
- **Meet** by hosting Equity Events (classes, workshops, meetups)
- **Track** shared goals with collective progress and optional contributions
- **Invite** through a managed member portal with role-based access
- **Act** when ready, through Global Pathways referral links that reward the table

Each Equity Table has a public or private profile page, a message board, recordings library, goals dashboard, and an affiliate link that earns the table a referral reward when members sign up for Global Pathways.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend | Next.js 15 (App Router) |
| Hosting | Vercel |
| Auth + Database | Supabase |
| Payments | Stripe |
| Storage | Supabase Storage (Mux-ready for Phase 3) |
| Styling | Tailwind CSS + shadcn/ui |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Email | Resend |
| Image crop | react-easy-crop |
| Audio | Browser MediaRecorder API (recording) + Kokoro TTS (Phase 2) |

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-org/equity-table.git
cd equity-table
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local`. See the comments in `.env.example` for where to get each value.

### 3. Set up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to **Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Publishable key** (starts with `sb_publishable_`) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Service role key** → `SUPABASE_SERVICE_ROLE_KEY` (server-only, never expose to browser)

3. Run migrations in order via **SQL Editor → New query**:

```sql
-- Run each file in order:
-- supabase/migrations/001_enums_and_profiles.sql
-- supabase/migrations/002_equity_tables.sql
-- supabase/migrations/003_affiliate_system.sql
-- supabase/migrations/004_learning_portal.sql
-- supabase/migrations/005_events_goals_board.sql
-- supabase/migrations/006_gamification_system.sql
-- supabase/migrations/007_rls_policies.sql
```

4. Run seed data:

```sql
-- supabase/seeds/001_seed_data.sql
```

5. Configure auth:
   - **Authentication → Providers → Email** — enable email/password sign-in
   - **Authentication → URL Configuration** — set Site URL to your app URL
   - **Authentication → Email Templates** — customize confirmation and password reset emails

6. Configure Storage buckets:
   - Create bucket: `avatars` (public)
   - Create bucket: `banners` (public)
   - Create bucket: `recordings` (private, signed URLs)
   - Create bucket: `lesson-audio` (public)
   - Create bucket: `files` (private, signed URLs)

### 4. Set up Stripe

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Create two prices in your Stripe Dashboard:

**Base Plan — $49.99/month:**
- Product: "Equity Table Subscription"
- Price: $49.99 USD recurring monthly
- Copy the price ID → `STRIPE_BASE_PRICE_ID`

**Extra Seat — $4.99/month per seat:**
- Product: "Equity Table Extra Seat"
- Price: $4.99 USD recurring monthly
- Billing: quantity-based (so you can pass the seat count)
- Copy the price ID → `STRIPE_EXTRA_SEAT_PRICE_ID`

3. Set up a webhook:
   - Go to **Developers → Webhooks → Add endpoint**
   - Endpoint URL: `https://your-domain.com/api/stripe/webhooks`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
     - `invoice.payment_succeeded`
   - Copy the webhook signing secret → `STRIPE_WEBHOOK_SECRET`

4. For local development, use [Stripe CLI](https://stripe.com/docs/stripe-cli):
```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhooks
```

### 5. Set up Resend (email)

1. Create an account at [resend.com](https://resend.com)
2. Add and verify your sending domain
3. Create an API key → `RESEND_API_KEY`

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 7. Seed super admin accounts

The following emails are automatically granted Super Admin access upon first sign-up. Sign up with each email address on your running app:

- julius@globalinvestmentcompanies.com
- cathy@globalinvestmentcompanies.com
- jasmon@globalinvestmentcompanies.com
- ricky@globalinvestmentcompanies.com

Super Admin access to `/admin` is granted automatically via the database trigger when these accounts sign up.

---

## Deployment

### Vercel

1. Push to GitHub
2. Import repository at [vercel.com](https://vercel.com)
3. Add all environment variables from `.env.example` in Vercel's project settings
4. Deploy

After deployment, update:
- Supabase → Authentication → URL Configuration → Site URL to your Vercel URL
- Stripe webhook endpoint URL to your Vercel production URL
- `NEXT_PUBLIC_APP_URL` to your Vercel URL

---

## Project Structure

```
equity-table/
├── app/
│   ├── (marketing)/      # Public pages: landing, pricing, table directory
│   ├── (auth)/           # Sign in, sign up, auth callback
│   ├── (legal)/          # Privacy, terms, disclaimers
│   ├── app/              # Authenticated app (dashboard, tables, courses)
│   ├── admin/            # Super Admin portal
│   └── api/              # API routes (Stripe webhooks, affiliate clicks, uploads)
├── components/           # Reusable UI components
├── lib/                  # Utilities, Supabase clients, Stripe, validations
├── types/                # TypeScript types
└── supabase/             # Database migrations and seeds
```

See `docs/project-structure.ts` for the complete file map.

---

## Key Concepts

### Equity Tables
Each organization that subscribes gets an Equity Table. The base plan is $49.99/month and includes 10 member seats. Additional seats are $4.99/month each.

### Table Types
Tables have a type (CBO, Christian, Muslim, Jewish, Business, Family & Friends, etc.) which controls which courses and content are shown by default, and which religious content is available.

### Affiliate System
Every Equity Table gets a unique affiliate link at creation. When a member clicks a "Start your Global Pathway" CTA and subscribes to Global Pathways via that link, the table receives an affiliate reward (default: first month's $179.99 fee). Super Admins manage payouts.

### Global Pathways CTA
CTAs appear at the end of every lesson, after every event, and on the table dashboard. The CTA always uses the table's affiliate link when the user has an active table context. CTAs are never aggressive — short, warm, and direct.

### RLS
Every table with sensitive data has Supabase Row Level Security. The access hierarchy is:
1. Super Admin → can access everything
2. ET Owner/Admin → can manage their table
3. ET Facilitator → can host events and manage recordings
4. ET Member → can access table content and update own progress
5. Public → can view public tables, events, and goals only

---

## Build Phases

### Phase 0 (Complete ✅)
- Database schema + migrations
- RLS policies
- TypeScript types
- Project structure
- Seed data (15 table types, 25 course categories, 10 courses, 20 lessons, 12 badges, legal pages)

### Phase 1 (Next)
- Auth + profile creation
- Super Admin setup
- Marketing pages (landing, pricing, how it works)
- Create Equity Table + Stripe checkout
- Stripe webhook
- Table dashboard
- Member management + invites
- Seat usage logic
- Course library
- Lesson viewer
- CTA + affiliate click tracking
- Admin dashboard

### Phase 2
- TTS audio pipeline (Kokoro)
- Event recording studio
- Affiliate conversion tracking
- Email invitations
- Leaderboards
- Table analytics

### Phase 3
- Mux video processing
- Stripe Connect for automated payouts
- AI course recommendations
- Public table directory
- Mobile app wrapper

---

## Brand

**Logo:** Navy circle with white "e" and upward arrow, surrounded by four people figures representing seats at the table.

**Colors:**
- Navy: `#0F1F4B`
- Royal Blue: `#2563EB`
- Blue Ring: `#3B82F6`
- Gold: `#C8A961`
- White: `#FFFFFF`
- Background (light): `#F8FAFF`

**Tone:** Empowering, warm, financially credible. Not preachy, not salesy, not generic fintech.

---

## Legal Disclaimers

Equity Table provides financial literacy education only. It does not provide personalized financial, investment, tax, or legal advice. See `/legal/financial-education-disclaimer` for full disclaimer.

Equity Tables may receive affiliate rewards when members sign up for Global Pathways. See `/legal/affiliate-disclosure` for full disclosure.

Events may be recorded. Recording consent is required before recordings can be published. See `/legal/recording-consent`.

---

## Support

Questions? Contact the team at [support@equitytable.com](mailto:support@equitytable.com).
