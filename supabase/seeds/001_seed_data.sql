-- ============================================================
-- SEED: Equity Table — Core Seed Data
-- Run after migrations. Safe to re-run (uses upsert/on conflict).
-- ============================================================

-- ----------------------------------------------------------------
-- AFFILIATE SETTINGS (single row)
-- ----------------------------------------------------------------
insert into public.affiliate_settings (
  default_destination_url,
  default_payout_amount,
  payout_currency,
  cta_default_text,
  cta_default_text_event,
  cta_default_text_course,
  allow_table_cta_customization
)
values (
  'https://legacyplan.app/',
  179.99,
  'USD',
  'Ready to turn learning into action? Start your Global Pathway.',
  'Ready for the next step? Begin your Global Pathway.',
  'You''ve learned the concept. Now build your plan.',
  false
)
on conflict do nothing;

-- ----------------------------------------------------------------
-- SYSTEM SETTINGS
-- ----------------------------------------------------------------
insert into public.system_settings (key, value, description) values
  ('maintenance_mode', 'false', 'Put the platform in maintenance mode'),
  ('max_upload_mb', '500', 'Max file upload size in MB'),
  ('max_recording_minutes', '180', 'Max recording length in minutes'),
  ('et_base_price', '49.99', 'Base subscription price per month'),
  ('et_included_seats', '10', 'Seats included in base subscription'),
  ('et_extra_seat_price', '4.99', 'Price per additional seat per month'),
  ('pathway_price', '179.99', 'Current Global Pathways monthly price'),
  ('pathway_length_months', '6', 'Global Pathways program length in months'),
  ('leaderboards_default', 'true', 'Default leaderboard setting for new tables'),
  ('registration_open', 'true', 'Allow new user registrations')
on conflict (key) do nothing;

-- ----------------------------------------------------------------
-- EQUITY TABLE TYPES
-- ----------------------------------------------------------------
insert into public.equity_table_types (name, slug, description, religious_content_allowed, sort_order, recommended_goals) values
(
  'CBO',
  'cbo',
  'For community-based organizations and nonprofits serving their communities through financial literacy.',
  false,
  1,
  '[
    "Enroll 100 community members in financial literacy courses",
    "Help 25 families build emergency savings",
    "Host 12 community financial literacy events",
    "Help 20 members begin the Global Pathway",
    "Raise funds for a community wealth-building initiative"
  ]'::jsonb
),
(
  'Christian',
  'christian',
  'For finance ministries within churches or Christian religious organizations.',
  true,
  2,
  '[
    "Launch a stewardship class series",
    "Help 50 families build a household budget",
    "Create a church emergency fund education campaign",
    "Help members complete debt reduction plans",
    "Host monthly Faith and Finance Equity Events"
  ]'::jsonb
),
(
  'Muslim',
  'muslim',
  'For Muslim groups. Includes Islamic finance, halal investing, and riba-sensitive educational content.',
  true,
  3,
  '[
    "Build a halal financial literacy study circle",
    "Educate members on riba-sensitive financial planning",
    "Launch a zakat and sadaqah community support goal",
    "Help families build emergency savings",
    "Host Islamic finance education sessions"
  ]'::jsonb
),
(
  'Jewish',
  'jewish',
  'For Jewish groups. Includes values around giving, stewardship, community responsibility, and legacy.',
  true,
  4,
  '[
    "Create a legacy and giving circle",
    "Teach ethical wealth-building and family planning",
    "Fund a community education initiative",
    "Help members develop household financial plans",
    "Host financial stewardship events"
  ]'::jsonb
),
(
  'Common Interest',
  'common-interest',
  'For general interest groups not covered by other categories.',
  false,
  5,
  '[
    "Complete 100 total lessons as a group",
    "Start an emergency savings challenge",
    "Build a collective investment education plan",
    "Host monthly money conversations",
    "Help members track personal financial growth"
  ]'::jsonb
),
(
  'Family and Friends',
  'family-and-friends',
  'For families, friend circles, generational wealth groups, and private wealth-building pods.',
  false,
  6,
  '[
    "Buy a family home",
    "Build a family emergency fund",
    "Start a family investment club",
    "Create a legacy plan",
    "Help young adults learn budgeting, credit, insurance, investing, and homeownership"
  ]'::jsonb
),
(
  'Business',
  'business',
  'For people starting, growing, or working within a business.',
  false,
  7,
  '[
    "Launch a product",
    "Raise startup capital",
    "Build a business emergency fund",
    "Train employees on financial wellness",
    "Fund equipment, marketing, or inventory"
  ]'::jsonb
),
(
  'School / Youth Program',
  'school-youth',
  'For schools, after-school programs, youth leadership programs, college readiness programs, and financial literacy clubs.',
  false,
  8,
  '[
    "Complete financial literacy basics as a group",
    "Launch a youth savings challenge",
    "Host a student entrepreneurship fair",
    "Help students learn banking, credit, budgeting, and investing",
    "Track course completions and badges"
  ]'::jsonb
),
(
  'Workforce / Employee Group',
  'workforce',
  'For employee resource groups, workforce development programs, unions, and professional associations.',
  false,
  9,
  '[
    "Improve employee financial wellness scores",
    "Increase retirement plan participation",
    "Host lunch-and-learn Equity Events",
    "Help employees start financial action plans",
    "Reduce financial stress indicators"
  ]'::jsonb
),
(
  'Reentry / Justice Impacted',
  'reentry',
  'For organizations serving formerly incarcerated or justice-impacted individuals.',
  false,
  10,
  '[
    "Help members open bank accounts",
    "Build emergency savings",
    "Complete employment and financial readiness courses",
    "Reduce debt and fines and fees",
    "Build credit and housing readiness"
  ]'::jsonb
),
(
  'Women''s Wealth Circle',
  'womens-wealth',
  'For women-led wealth-building circles, entrepreneurship groups, and leadership cohorts.',
  false,
  11,
  '[
    "Build confidence around investing",
    "Launch a business or side hustle fund",
    "Help members create financial plans",
    "Host women-led wealth-building events",
    "Track collective savings and investment progress"
  ]'::jsonb
),
(
  'First-Generation Wealth Builders',
  'first-gen',
  'For first-generation investors, homeowners, and people building wealth without inherited financial education.',
  false,
  12,
  '[
    "Learn foundational financial concepts",
    "Build first emergency fund",
    "Start investing education",
    "Prepare for homeownership",
    "Create first family legacy plan"
  ]'::jsonb
),
(
  'Investor Club',
  'investor-club',
  'For groups learning about investing, portfolio basics, real estate, entrepreneurship, and collective wealth-building.',
  false,
  13,
  '[
    "Complete investment education courses",
    "Track simulated portfolio learning",
    "Raise funds for a shared educational investment project",
    "Host market literacy sessions",
    "Build a group investment thesis library"
  ]'::jsonb
),
(
  'Fraternity / Sorority / Alumni Group',
  'greek-alumni',
  'For alumni networks, Greek organizations, and affinity groups.',
  false,
  14,
  '[
    "Create alumni wealth circle",
    "Fund scholarships",
    "Host financial literacy events",
    "Build entrepreneurship support network",
    "Help members join Global Pathways"
  ]'::jsonb
),
(
  'Faith-Based General',
  'faith-based',
  'For religious or spiritual groups not specifically Christian, Muslim, or Jewish.',
  true,
  15,
  '[
    "Host values-based money classes",
    "Build community support fund",
    "Teach stewardship and legacy planning",
    "Help members create financial plans"
  ]'::jsonb
)
on conflict (slug) do nothing;

-- ----------------------------------------------------------------
-- COURSE CATEGORIES
-- ----------------------------------------------------------------
insert into public.course_categories (name, slug, description, sort_order) values
  ('Budgeting', 'budgeting', 'Build and maintain a budget that actually works', 1),
  ('Credit', 'credit', 'Understand, build, and protect your credit score', 2),
  ('Debt Reduction', 'debt-reduction', 'Strategies to pay down and eliminate debt', 3),
  ('Banking', 'banking', 'Choosing accounts, cash flow, and banking basics', 4),
  ('Saving', 'saving', 'Build healthy savings habits and goals', 5),
  ('Emergency Funds', 'emergency-funds', 'Build financial resilience with an emergency reserve', 6),
  ('Insurance', 'insurance', 'Protect what matters most', 7),
  ('Investing Basics', 'investing', 'Start your wealth-building investment journey', 8),
  ('Retirement', 'retirement', 'Plan and prepare for financial freedom in retirement', 9),
  ('Homeownership', 'homeownership', 'The path from renting to owning', 10),
  ('Entrepreneurship', 'entrepreneurship', 'Business finance for founders and side hustlers', 11),
  ('Taxes', 'taxes', 'Understand taxes and keep more of what you earn', 12),
  ('Estate Planning', 'estate-planning', 'Protect your family and assets for the future', 13),
  ('Legacy Planning', 'legacy-planning', 'Build and transfer generational wealth', 14),
  ('Behavioral Finance', 'behavioral-finance', 'Understand how emotions affect financial decisions', 15),
  ('Money Mindset', 'money-mindset', 'Heal financial trauma and build a healthy money mindset', 16),
  ('Youth Financial Literacy', 'youth', 'Financial basics designed for teens and young adults', 17),
  ('Family Finance', 'family-finance', 'Manage money as a household and build together', 18),
  ('Faith and Finance', 'faith-finance', 'Stewardship, generosity, and purpose-driven money', NULL),
  ('Islamic Finance', 'islamic-finance', 'Halal investing, riba-sensitive planning, zakat', NULL),
  ('Christian Stewardship', 'christian-stewardship', 'Biblical principles of money management', NULL),
  ('Jewish Values and Money', 'jewish-money', 'Tzedakah, ethical giving, and legacy', NULL),
  ('Business Finance', 'business-finance', 'Financial fundamentals for small businesses', 19),
  ('Employee Financial Wellness', 'employee-wellness', 'Workplace financial health and benefits optimization', 20),
  ('Reentry Financial Readiness', 'reentry-finance', 'Financial foundation for justice-impacted individuals', 21)
on conflict (slug) do nothing;

-- Update religious categories
update public.course_categories set religious_context = 'general' where slug = 'faith-finance';
update public.course_categories set religious_context = 'muslim' where slug = 'islamic-finance';
update public.course_categories set religious_context = 'christian' where slug = 'christian-stewardship';
update public.course_categories set religious_context = 'jewish' where slug = 'jewish-money';

-- ----------------------------------------------------------------
-- SAMPLE COURSES (10 seed courses)
-- ----------------------------------------------------------------
-- We use a DO block so we can reference category IDs by slug
do $$
declare
  v_budgeting_id uuid;
  v_credit_id uuid;
  v_debt_id uuid;
  v_emergency_id uuid;
  v_banking_id uuid;
  v_investing_id uuid;
  v_retirement_id uuid;
  v_homeownership_id uuid;
  v_entrepreneurship_id uuid;
  v_legacy_id uuid;
begin
  select id into v_budgeting_id from public.course_categories where slug = 'budgeting';
  select id into v_credit_id from public.course_categories where slug = 'credit';
  select id into v_debt_id from public.course_categories where slug = 'debt-reduction';
  select id into v_emergency_id from public.course_categories where slug = 'emergency-funds';
  select id into v_banking_id from public.course_categories where slug = 'banking';
  select id into v_investing_id from public.course_categories where slug = 'investing';
  select id into v_retirement_id from public.course_categories where slug = 'retirement';
  select id into v_homeownership_id from public.course_categories where slug = 'homeownership';
  select id into v_entrepreneurship_id from public.course_categories where slug = 'entrepreneurship';
  select id into v_legacy_id from public.course_categories where slug = 'legacy-planning';

  -- 1. Budgeting Basics
  with inserted_course as (
    insert into public.courses (title, slug, description, category_id, level, estimated_minutes, status)
    values (
      'Budgeting Basics',
      'budgeting-basics',
      'Learn to create a budget that reflects your values, covers your needs, and builds your future. This course covers zero-based budgeting, the 50/30/20 rule, tracking spending, and building habits that stick.',
      v_budgeting_id, 'beginner', 45, 'published'
    )
    on conflict (slug) do update set updated_at = now()
    returning id
  ),
  inserted_module as (
    insert into public.course_modules (course_id, title, sort_order)
    select id, 'Getting Started with Budgeting', 1 from inserted_course
    on conflict do nothing
    returning id, course_id
  )
  insert into public.lessons (course_id, module_id, title, slug, summary, estimated_minutes, sort_order, status,
    transcript_text, reflection_prompt, cta_override_text)
  values
  (
    (select course_id from inserted_module),
    (select id from inserted_module),
    'Why Budgets Fail — And How to Build One That Works',
    'why-budgets-fail',
    'Most budgets fail not because people are bad with money, but because their budget doesn''t match their real life. This lesson shows you why, and how to build one that actually works.',
    12,
    1,
    'published',
    'A budget is a plan for your money — not a punishment. Most people give up on budgets because they''re too restrictive, too complex, or don''t account for real life. In this lesson, we''ll explore the most common reasons budgets fail and walk through a simple framework for building one you can actually stick with. We''ll cover the difference between fixed and variable expenses, why tracking matters, and how to start with what you have — not what you wish you had.',
    'Think about a time you tried to budget before. What got in the way? What would have made it easier?',
    'Ready to build a budget that actually works? Start your Global Pathway when you''re ready.'
  ),
  (
    (select course_id from inserted_module),
    (select id from inserted_module),
    'The 50/30/20 Rule: A Budget Framework for Real Life',
    'fifty-thirty-twenty-rule',
    'The 50/30/20 rule is one of the simplest and most effective budgeting frameworks. Learn how to apply it to your own income, and when to adjust it for your situation.',
    15,
    2,
    'published',
    'The 50/30/20 rule divides your after-tax income into three categories: 50% for needs, 30% for wants, and 20% for savings and debt repayment. This lesson walks through each category, gives real examples, and helps you apply the framework to your own numbers. We''ll also talk about how to adjust when your situation doesn''t fit the standard split — because real life rarely does.',
    'Try applying the 50/30/20 rule to last month''s income. What surprised you about how your spending broke down?',
    null
  );

  -- 2. Credit Confidence
  with inserted_course as (
    insert into public.courses (title, slug, description, category_id, level, estimated_minutes, status)
    values (
      'Credit Confidence',
      'credit-confidence',
      'Demystify your credit score. Learn what moves the needle, how to build credit from scratch, and how to protect and repair your credit over time.',
      v_credit_id, 'beginner', 40, 'published'
    )
    on conflict (slug) do update set updated_at = now()
    returning id
  ),
  inserted_module as (
    insert into public.course_modules (course_id, title, sort_order)
    select id, 'Understanding Credit', 1 from inserted_course
    on conflict do nothing
    returning id, course_id
  )
  insert into public.lessons (course_id, module_id, title, slug, summary, estimated_minutes, sort_order, status,
    transcript_text, reflection_prompt)
  values
  (
    (select course_id from inserted_module),
    (select id from inserted_module),
    'What Is a Credit Score and Why Does It Matter?',
    'what-is-credit-score',
    'Your credit score is one of the most powerful numbers in your financial life. Learn what it is, how it''s calculated, and why it affects so much more than just borrowing money.',
    12,
    1,
    'published',
    'A credit score is a three-digit number — typically between 300 and 850 — that represents how reliably you''ve paid back money you''ve borrowed. Lenders use it to decide whether to lend to you and at what interest rate. But your credit score also affects things like your ability to rent an apartment, get a cell phone plan, or sometimes even get a job. In this lesson, we''ll break down exactly how credit scores are calculated, what the five factors are that influence your score, and what you can start doing today to move yours in the right direction.',
    'What does your credit score mean to you personally? What would improving it by 50–100 points make possible in your life?'
  ),
  (
    (select course_id from inserted_module),
    (select id from inserted_module),
    'How to Build Credit When You''re Starting From Zero',
    'build-credit-from-zero',
    'No credit history doesn''t mean bad credit. This lesson gives you a practical roadmap for building credit from scratch — even if you''ve never had a credit card or loan.',
    14,
    2,
    'published',
    'Building credit when you have no history can feel like a catch-22 — you need credit to get credit. But there are proven strategies to break in. This lesson covers secured credit cards, credit-builder loans, becoming an authorized user, and how to use credit responsibly once you have access. We''ll also talk about common mistakes to avoid and how long it typically takes to establish a solid credit profile.',
    'What''s one step you could take this week to start building or improving your credit?'
  );

  -- 3. Debt Reduction Roadmap
  with inserted_course as (
    insert into public.courses (title, slug, description, category_id, level, estimated_minutes, status)
    values (
      'Debt Reduction Roadmap',
      'debt-reduction-roadmap',
      'Two proven methods, real math, and a plan you can actually follow. Whether you''re tackling credit cards, student loans, or medical bills — this course helps you build momentum and get free.',
      v_debt_id, 'beginner', 50, 'published'
    )
    on conflict (slug) do update set updated_at = now()
    returning id
  ),
  inserted_module as (
    insert into public.course_modules (course_id, title, sort_order)
    select id, 'Getting Out of Debt', 1 from inserted_course
    on conflict do nothing
    returning id, course_id
  )
  insert into public.lessons (course_id, module_id, title, slug, summary, estimated_minutes, sort_order, status,
    transcript_text, reflection_prompt)
  values
  (
    (select course_id from inserted_module),
    (select id from inserted_module),
    'Debt Avalanche vs. Debt Snowball: Which Strategy Wins?',
    'avalanche-vs-snowball',
    'The two most popular debt payoff strategies — compared honestly. Learn which one saves more money, which one builds more momentum, and how to choose the right approach for your situation.',
    15,
    1,
    'published',
    'The debt avalanche method pays off your highest-interest debt first, saving you the most money over time. The debt snowball method pays off your smallest balance first, giving you quick wins that build momentum. Both work — the best one is the one you''ll actually stick with. In this lesson, we run through both strategies with real numbers, explore the psychology behind each, and help you figure out which approach fits your personality and financial situation.',
    'Which method appeals to you more — the avalanche or the snowball? Why? What does that tell you about how you''re motivated?'
  ),
  (
    (select course_id from inserted_module),
    (select id from inserted_module),
    'Making Extra Payments: How Small Amounts Change Everything',
    'extra-payments-power',
    'Even small extra payments can cut years off your debt and save thousands in interest. This lesson shows you the math — and how to find the money to do it.',
    14,
    2,
    'published',
    'Paying just a little extra each month on your debt can have a dramatic effect on how long it takes to pay off and how much interest you pay. In this lesson, we walk through real examples showing how an extra $25, $50, or $100 per month can cut years off a loan and save thousands of dollars. We''ll also look at practical ways to find extra money in your budget to put toward debt — without feeling like you''re sacrificing everything.',
    'If you could find an extra $50/month to put toward debt, where would it most likely come from in your current budget?'
  );

  -- 4. Emergency Fund Foundations
  with inserted_course as (
    insert into public.courses (title, slug, description, category_id, level, estimated_minutes, status)
    values (
      'Emergency Fund Foundations',
      'emergency-fund-foundations',
      'An emergency fund is the single most important financial safety net you can build. Learn how much you need, where to keep it, and how to save it faster than you think.',
      v_emergency_id, 'beginner', 35, 'published'
    )
    on conflict (slug) do update set updated_at = now()
    returning id
  ),
  inserted_module as (
    insert into public.course_modules (course_id, title, sort_order)
    select id, 'Building Your Safety Net', 1 from inserted_course
    on conflict do nothing
    returning id, course_id
  )
  insert into public.lessons (course_id, module_id, title, slug, summary, estimated_minutes, sort_order, status,
    transcript_text, reflection_prompt)
  values
  (
    (select course_id from inserted_module),
    (select id from inserted_module),
    'Why an Emergency Fund Is the Foundation of Financial Security',
    'why-emergency-fund',
    'Without an emergency fund, every unexpected expense becomes a financial crisis. This lesson explains what an emergency fund is, why it matters, and what happens to your finances without one.',
    12,
    1,
    'published',
    'An emergency fund is money set aside specifically for unexpected expenses — a car repair, medical bill, job loss, or home repair. Without it, people often turn to credit cards or loans, which turns a temporary problem into long-term debt. The goal of this lesson is to help you understand why an emergency fund isn''t just nice to have — it''s the foundation that makes everything else in your financial plan more stable. We''ll talk about how much you need, where experts say to keep it, and why it should come before almost every other savings goal.',
    'Think about the last financial emergency you faced. How did you handle it? How would having 3 months of expenses saved have changed that experience?'
  ),
  (
    (select course_id from inserted_module),
    (select id from inserted_module),
    'How to Build an Emergency Fund on a Tight Budget',
    'build-emergency-fund-tight-budget',
    'You don''t need to have a lot of money to start an emergency fund. This lesson gives you a practical, realistic plan for building yours — no matter where you''re starting from.',
    13,
    2,
    'published',
    'Building an emergency fund when money is tight can feel impossible. But it doesn''t have to be. In this lesson, we break down a step-by-step approach: start with a micro-goal, automate small transfers, use found money, and build steadily over time. We also cover what to do when you have to use the fund — and how to rebuild it afterward. The key insight: small, consistent actions compound over time in ways that feel almost magical when you look back.',
    'What''s a realistic first emergency fund target for you? What would you have to change to save that amount in the next 90 days?'
  );

  -- 5. Banking and Cash Flow
  with inserted_course as (
    insert into public.courses (title, slug, description, category_id, level, estimated_minutes, status)
    values (
      'Banking and Cash Flow',
      'banking-cash-flow',
      'Understand how your bank account works for you — or against you. Learn to choose the right accounts, avoid fees, and manage cash flow so you''re never caught off guard.',
      v_banking_id, 'beginner', 40, 'published'
    )
    on conflict (slug) do update set updated_at = now()
    returning id
  ),
  inserted_module as (
    insert into public.course_modules (course_id, title, sort_order)
    select id, 'Banking Fundamentals', 1 from inserted_course
    on conflict do nothing
    returning id, course_id
  )
  insert into public.lessons (course_id, module_id, title, slug, summary, estimated_minutes, sort_order, status,
    transcript_text, reflection_prompt)
  values
  (
    (select course_id from inserted_module),
    (select id from inserted_module),
    'Choosing the Right Bank Account for Your Life',
    'choosing-bank-account',
    'Not all bank accounts are created equal. This lesson helps you understand the difference between checking and savings accounts, what to look for, and how to avoid accounts that drain your money in fees.',
    12,
    1,
    'published',
    'Your bank account is the foundation of your financial infrastructure. But many people are losing money every month in unnecessary fees — overdraft charges, monthly maintenance fees, ATM fees — without realizing it. This lesson walks through the differences between checking accounts, savings accounts, money market accounts, and credit unions. We''ll cover what questions to ask when choosing an account, what fees to watch out for, and how to find accounts that work with you instead of against you.',
    'Pull up your bank account right now. What fees have you paid in the last 3 months? Is your current account actually serving your needs?'
  ),
  (
    (select course_id from inserted_module),
    (select id from inserted_module),
    'Managing Cash Flow: Know What''s Coming In and Going Out',
    'managing-cash-flow',
    'Cash flow management is about knowing your money''s timing — not just totals. This lesson shows you how to avoid the "broke before payday" cycle and build a system that keeps you ahead.',
    14,
    2,
    'published',
    'You can have a decent income and still run out of money before your next paycheck — if your cash flow isn''t managed well. Cash flow is about timing: when money comes in and when bills go out. In this lesson, we cover how to map your income and expenses on a calendar, how to identify cash flow gaps, and practical strategies for smoothing out the months when bills pile up. We''ll also talk about buffer accounts, bill due date management, and how to build a system that keeps you feeling in control.',
    'Map out your income dates and major bill due dates for the next 30 days. Are there any gaps where you might be tight?'
  );

  -- 6. Investing 101
  with inserted_course as (
    insert into public.courses (title, slug, description, category_id, level, estimated_minutes, status)
    values (
      'Investing 101',
      'investing-101',
      'Start your investing journey with confidence. This beginner course demystifies stocks, bonds, index funds, and the most important concept in wealth-building: compound growth.',
      v_investing_id, 'beginner', 55, 'published'
    )
    on conflict (slug) do update set updated_at = now()
    returning id
  ),
  inserted_module as (
    insert into public.course_modules (course_id, title, sort_order)
    select id, 'Investment Foundations', 1 from inserted_course
    on conflict do nothing
    returning id, course_id
  )
  insert into public.lessons (course_id, module_id, title, slug, summary, estimated_minutes, sort_order, status,
    transcript_text, reflection_prompt)
  values
  (
    (select course_id from inserted_module),
    (select id from inserted_module),
    'The Power of Compound Growth: Why Starting Early Changes Everything',
    'compound-growth',
    'Compound growth is the engine of wealth-building. This lesson shows you the math — and why the single most powerful investment decision is simply starting.',
    15,
    1,
    'published',
    'Albert Einstein supposedly called compound interest the eighth wonder of the world. Whether or not he actually said it, the math is undeniable. Compound growth means you earn returns not just on your original money, but on the returns you''ve already earned — and over time, that creates exponential growth. In this lesson, we walk through real examples showing how small, regular investments grow into significant wealth over decades. We''ll also talk about why starting early matters so much — and why it''s never too late to start.',
    'If you were to start investing $100 per month starting today, what would that look like in 10, 20, and 30 years at a 7% average annual return? Take a moment to look that up and reflect on what it means for your future.',
    'Keep learning — and when you''re ready to build a real investment plan, your Global Pathway is waiting.'
  ),
  (
    (select course_id from inserted_module),
    (select id from inserted_module),
    'Stocks, Bonds, and Index Funds: What''s the Difference?',
    'stocks-bonds-index-funds',
    'You don''t need to be a Wall Street expert to invest. This lesson explains the three main asset types in plain language, what each does, and how they fit into a diversified portfolio.',
    16,
    2,
    'published',
    'When most people think of investing, they think of buying individual stocks — picking winners and hoping the price goes up. But that''s just one approach, and often not the best one for most people. This lesson explains the three core asset types: stocks (ownership in a company), bonds (loans to governments or companies that pay interest), and index funds (a collection of many investments that tracks a market index). We''ll explain how each works, what risks they carry, and how they work together in a diversified portfolio designed to build wealth over time.',
    'Before this lesson, how did you think about investing? Has anything shifted in how you see it now?'
  );

  -- 7. Retirement Readiness
  with inserted_course as (
    insert into public.courses (title, slug, description, category_id, level, estimated_minutes, status)
    values (
      'Retirement Readiness',
      'retirement-readiness',
      'Retirement planning isn''t just for people close to retirement. This course breaks down the accounts, math, and decisions you need to make now to retire with dignity and security.',
      v_retirement_id, 'beginner', 50, 'published'
    )
    on conflict (slug) do update set updated_at = now()
    returning id
  ),
  inserted_module as (
    insert into public.course_modules (course_id, title, sort_order)
    select id, 'Planning for Retirement', 1 from inserted_course
    on conflict do nothing
    returning id, course_id
  )
  insert into public.lessons (course_id, module_id, title, slug, summary, estimated_minutes, sort_order, status,
    transcript_text, reflection_prompt)
  values
  (
    (select course_id from inserted_module),
    (select id from inserted_module),
    '401(k), IRA, Roth IRA: Which Retirement Account Is Right for You?',
    '401k-ira-roth-explained',
    'Three letters — 401(k) — can seem intimidating. But these accounts are some of the most powerful wealth-building tools available. This lesson breaks them down simply.',
    15,
    1,
    'published',
    'Retirement accounts come with tax advantages that make them some of the most powerful tools for building wealth. But the differences between a 401(k), a traditional IRA, and a Roth IRA can be confusing. This lesson explains how each one works, the key differences in tax treatment, contribution limits, and when you can access the money. We''ll also walk through the concept of an employer match — essentially free money — and why not taking advantage of it is one of the most costly financial mistakes people make.',
    'Does your employer offer a 401(k) match? If so, are you currently contributing enough to get the full match? If not, what would it take to change that?'
  ),
  (
    (select course_id from inserted_module),
    (select id from inserted_module),
    'How Much Do You Actually Need to Retire?',
    'how-much-to-retire',
    'The retirement number isn''t magic — it''s math. This lesson helps you calculate a realistic target based on your expected expenses, timeline, and withdrawal strategy.',
    16,
    2,
    'published',
    'One of the most common retirement planning questions is: "How much do I need to save?" The answer depends on your expected expenses in retirement, how long you expect to live, Social Security income, and other factors. In this lesson, we introduce the 4% rule — a guideline suggesting you can safely withdraw 4% of your portfolio per year in retirement — and use it to calculate a target savings number. We''ll also discuss Monte Carlo simulations at a high level and explain why planning for longer lifespans is increasingly important.',
    'Based on what you learned in this lesson, what''s a rough retirement savings target you''d want to aim for? Does that number feel achievable? What would need to change?'
  );

  -- 8. Homeownership Prep
  with inserted_course as (
    insert into public.courses (title, slug, description, category_id, level, estimated_minutes, status)
    values (
      'Homeownership Prep',
      'homeownership-prep',
      'Buying a home is one of the biggest financial decisions of your life. This course prepares you to navigate the process with confidence — from understanding mortgages to closing day.',
      v_homeownership_id, 'beginner', 60, 'published'
    )
    on conflict (slug) do update set updated_at = now()
    returning id
  ),
  inserted_module as (
    insert into public.course_modules (course_id, title, sort_order)
    select id, 'Getting Ready to Buy', 1 from inserted_course
    on conflict do nothing
    returning id, course_id
  )
  insert into public.lessons (course_id, module_id, title, slug, summary, estimated_minutes, sort_order, status,
    transcript_text, reflection_prompt)
  values
  (
    (select course_id from inserted_module),
    (select id from inserted_module),
    'Renting vs. Buying: Making the Right Choice for Your Situation',
    'renting-vs-buying',
    'Buying isn''t always better than renting. This lesson helps you think through the real financial, lifestyle, and timing factors — so you can make the right decision for your life.',
    15,
    1,
    'published',
    'You''ve probably heard that buying a home is always better than renting because you''re "building equity instead of throwing money away." But that''s an oversimplification that doesn''t account for your specific situation. This lesson looks at the true costs of homeownership — including property taxes, maintenance, HOA fees, and the opportunity cost of a down payment — and compares them honestly to renting. We''ll walk through a break-even analysis to help you figure out when buying starts to make more financial sense than renting in your area.',
    'Where are you in your thinking about renting vs. buying? What factors matter most to you right now — financial, lifestyle, or timing?'
  ),
  (
    (select course_id from inserted_module),
    (select id from inserted_module),
    'Mortgages Explained: Types, Terms, and What to Watch Out For',
    'mortgages-explained',
    'Most people don''t fully understand their mortgage until they''re signing the papers. This lesson changes that — giving you a complete picture before you ever walk into a lender''s office.',
    18,
    2,
    'published',
    'A mortgage is a loan used to purchase a home, with the home itself as collateral. But there are many different types of mortgages — fixed-rate vs. adjustable-rate, conventional vs. FHA vs. VA — and the choices you make have significant long-term financial implications. This lesson explains how mortgages work, the difference between the main types, how interest rates affect your monthly payment and total cost, what PMI is and when you can remove it, and what questions to ask when shopping for a lender. We''ll also cover common pitfalls, like buying too much house or skipping the rate comparison.',
    'What type of mortgage do you think would fit your situation best, based on what you just learned? What questions do you still have?'
  );

  -- 9. Entrepreneurship Finance
  with inserted_course as (
    insert into public.courses (title, slug, description, category_id, level, estimated_minutes, status)
    values (
      'Entrepreneurship Finance',
      'entrepreneurship-finance',
      'The financial side of starting and running a business — explained simply. From business accounts and cash flow to pricing and taxes, this course gives aspiring entrepreneurs what they need to know.',
      v_entrepreneurship_id, 'beginner', 55, 'published'
    )
    on conflict (slug) do update set updated_at = now()
    returning id
  ),
  inserted_module as (
    insert into public.course_modules (course_id, title, sort_order)
    select id, 'Business Finance Fundamentals', 1 from inserted_course
    on conflict do nothing
    returning id, course_id
  )
  insert into public.lessons (course_id, module_id, title, slug, summary, estimated_minutes, sort_order, status,
    transcript_text, reflection_prompt)
  values
  (
    (select course_id from inserted_module),
    (select id from inserted_module),
    'Separating Business and Personal Finances: Why It Matters',
    'separate-business-personal',
    'Mixing personal and business money is one of the most common — and costly — mistakes entrepreneurs make. This lesson explains why separation matters and how to set it up properly.',
    13,
    1,
    'published',
    'When you''re just starting out, it can feel unnecessary to open a separate business bank account. But mixing personal and business finances creates real problems: it makes it harder to track your business''s actual profitability, creates nightmares at tax time, and can expose your personal assets to business liabilities. This lesson covers why every business — even a simple side hustle — should have separate financial accounts, what types of business accounts to consider, and how to pay yourself from your business in a way that''s both legal and sustainable.',
    'Do you currently have (or are you building) a business? Do you separate your personal and business finances? What would need to change?'
  ),
  (
    (select course_id from inserted_module),
    (select id from inserted_module),
    'How to Price Your Products or Services for Profitability',
    'pricing-for-profit',
    'Pricing too low is one of the fastest ways to kill a business. This lesson teaches you how to calculate your real costs, understand your market, and price in a way that builds a sustainable business.',
    16,
    2,
    'published',
    'Many new entrepreneurs price their products or services too low — often because they''re afraid of losing customers or they haven''t calculated their real costs. This lesson walks through a step-by-step pricing framework: calculating your cost of goods or service delivery, understanding your overhead, determining a target profit margin, and checking your pricing against the market. We''ll also cover value-based pricing, the psychology of price anchoring, and common pricing mistakes to avoid.',
    'If you were to price a product or service you want to offer, what would your true cost be? What margin would make it sustainable for you?'
  );

  -- 10. Legacy Planning Basics
  with inserted_course as (
    insert into public.courses (title, slug, description, category_id, level, estimated_minutes, status)
    values (
      'Legacy Planning Basics',
      'legacy-planning-basics',
      'Legacy isn''t just about money — it''s about what you leave behind and who benefits. This introductory course covers wills, beneficiaries, life insurance, and how to start building a plan that protects your family.',
      v_legacy_id, 'beginner', 45, 'published'
    )
    on conflict (slug) do update set updated_at = now()
    returning id
  ),
  inserted_module as (
    insert into public.course_modules (course_id, title, sort_order)
    select id, 'Building Your Legacy Plan', 1 from inserted_course
    on conflict do nothing
    returning id, course_id
  )
  insert into public.lessons (course_id, module_id, title, slug, summary, estimated_minutes, sort_order, status,
    transcript_text, reflection_prompt)
  values
  (
    (select course_id from inserted_module),
    (select id from inserted_module),
    'What Is Legacy Planning — and Why Does It Matter?',
    'what-is-legacy-planning',
    'Legacy planning isn''t just for wealthy people or the elderly. This lesson explains what it is, why everyone with people they care about needs it, and the key components of a basic plan.',
    13,
    1,
    'published',
    'Legacy planning is the process of deciding what happens to your assets, your responsibilities, and your wishes after you''re gone — or if you become unable to make decisions for yourself. It includes documents like a will, power of attorney, and healthcare directive. It includes things like beneficiary designations on your retirement accounts and life insurance. And it includes the values, memories, and financial habits you want to pass on. This lesson is an introduction to why legacy planning matters for people at every income level, and what the foundational components look like.',
    'Have you thought about your own legacy plan? What would you want to leave behind — financially or otherwise — and for whom?'
  ),
  (
    (select course_id from inserted_module),
    (select id from inserted_module),
    'Wills, Beneficiaries, and Life Insurance: Getting the Basics Right',
    'wills-beneficiaries-life-insurance',
    'Three things every adult should have — but most people put off for too long. This lesson makes them simple and actionable.',
    15,
    2,
    'published',
    'Three documents and designations form the foundation of any legacy plan: a will, beneficiary designations on your financial accounts, and life insurance. A will tells the courts and your family what you want done with your belongings. Beneficiary designations override your will on accounts like retirement funds and life insurance — so keeping them updated is critical. And life insurance provides income replacement for your dependents if something happens to you. This lesson breaks all three down in plain language and helps you understand what action to take next.',
    'Do you currently have a will? Up-to-date beneficiary designations? Life insurance? If not — what''s one step you could take in the next 30 days?',
    'Keep learning here. When you''re ready to act, your Global Pathway is waiting.'
  );

end;
$$;

-- ----------------------------------------------------------------
-- BADGES
-- ----------------------------------------------------------------
insert into public.badges (name, slug, description, icon, points, criteria) values
  ('Seat at the Table', 'seat-at-the-table', 'Joined your first Equity Table', '🪑', 50,
   '{"type": "table_join", "threshold": 1, "auto_award": true}'::jsonb),
  ('First Lesson Complete', 'first-lesson', 'Completed your first lesson', '📚', 25,
   '{"type": "lesson_count", "threshold": 1, "auto_award": true}'::jsonb),
  ('Course Finisher', 'course-finisher', 'Completed a full course', '🎓', 100,
   '{"type": "course_count", "threshold": 1, "auto_award": true}'::jsonb),
  ('Event Attendee', 'event-attendee', 'Attended your first Equity Event', '🎟️', 30,
   '{"type": "event_attend", "threshold": 1, "auto_award": true}'::jsonb),
  ('Event Host', 'event-host', 'Hosted an Equity Event', '🎤', 75,
   '{"type": "event_host", "threshold": 1, "auto_award": true}'::jsonb),
  ('Goal Builder', 'goal-builder', 'Created your first shared goal', '🎯', 50,
   '{"type": "goal_create", "threshold": 1, "auto_award": true}'::jsonb),
  ('Legacy Builder', 'legacy-builder', 'Completed the Legacy Planning course', '🏛️', 150,
   '{"type": "course_specific", "course_slug": "legacy-planning-basics", "auto_award": true}'::jsonb),
  ('Pathway Ready', 'pathway-ready', 'Clicked the Global Pathways CTA — ready for action', '🚀', 100,
   '{"type": "cta_click", "threshold": 1, "auto_award": true}'::jsonb),
  ('Community Investor', 'community-investor', 'Contributed to a group goal', '💰', 50,
   '{"type": "goal_contribution", "threshold": 1, "auto_award": true}'::jsonb),
  ('Learning Streak', 'learning-streak', 'Completed lessons 5 days in a row', '🔥', 75,
   '{"type": "lesson_streak", "threshold": 5, "auto_award": true}'::jsonb),
  ('Inviter', 'inviter', 'Invited your first table member', '🤝', 40,
   '{"type": "invite_sent", "threshold": 1, "auto_award": true}'::jsonb),
  ('Course Champion', 'course-champion', 'Completed 5 courses', '🏆', 300,
   '{"type": "course_count", "threshold": 5, "auto_award": true}'::jsonb)
on conflict (slug) do nothing;

-- ----------------------------------------------------------------
-- LEGAL PAGES (placeholder content)
-- ----------------------------------------------------------------
insert into public.legal_pages (slug, title, content, published) values
(
  'privacy',
  'Privacy Policy',
  '# Privacy Policy

Last updated: January 1, 2025

## What We Collect

Equity Table collects account information (name, email, profile data), learning activity (lesson progress, course completions), event participation (RSVPs, attendance, recordings), goal contributions and updates, affiliate clicks and referral activity, and usage data to improve the platform.

## How We Use It

We use your information to provide the Equity Table platform, track your learning progress, send notifications and updates, attribute affiliate referrals to the correct Equity Table, and improve our services.

## What We Share

We do not sell your personal information. We share data with trusted service providers (Stripe for payments, Supabase for hosting, Resend for email) only as needed to operate the platform.

## Your Rights

You may request access to, correction of, or deletion of your personal data at any time by contacting us at privacy@equitytable.com.

## Contact

Questions about this policy? Email privacy@equitytable.com.',
  true
),
(
  'terms',
  'Terms of Service',
  '# Terms of Service

Last updated: January 1, 2025

## Acceptance

By using Equity Table, you agree to these Terms of Service.

## Description of Service

Equity Table is a SaaS platform for financial literacy education, community building, goal tracking, and event hosting. We provide tools for organizations and groups to learn together and work toward financial goals.

## Subscriptions and Billing

Equity Table subscriptions are billed monthly at $49.99/month for up to 10 seats. Additional seats are $4.99/month each. Billing is handled by Stripe. Subscriptions renew automatically unless canceled.

## Acceptable Use

You agree not to use Equity Table to distribute illegal content, harass or harm other users, misrepresent financial information, or violate applicable laws or regulations.

## Content Ownership

You retain ownership of content you upload or create on Equity Table. By posting content, you grant Equity Table a license to display it on the platform.

## Termination

We may suspend or terminate accounts that violate these terms.

## Disclaimer

Equity Table provides financial education tools only. We do not provide personalized financial, investment, tax, or legal advice. See our Financial Education Disclaimer for details.

## Contact

questions@equitytable.com',
  true
),
(
  'affiliate-disclosure',
  'Affiliate Disclosure',
  '# Affiliate Disclosure

Equity Table operates an affiliate referral program connected to Global Pathways by Legacy Plan (legacyplan.app).

## What This Means

When a member of an Equity Table begins a Global Pathways subscription through that table''s unique referral link, the Equity Table may receive a referral reward equivalent to the first month''s subscription fee.

## How It Works

Each Equity Table receives a unique affiliate link. When you click a "Start your Global Pathway" link within the app, that link may include your table''s referral code. If you subscribe to Global Pathways after clicking, your Equity Table may receive a referral reward.

## Transparency

Equity Table administrators can view whether their table''s affiliate earnings are displayed publicly. This is optional and controlled by the table''s leadership.

## Your Decisions

Our educational content is not influenced by affiliate arrangements. The Global Pathways CTA appears because it represents a meaningful next step for members ready to move from education to action — not because of the referral program.

## Questions

affiliate@equitytable.com',
  true
),
(
  'financial-education-disclaimer',
  'Financial Education Disclaimer',
  '# Financial Education Disclaimer

## Educational Content Only

Equity Table provides financial literacy education and tools. All content on this platform — including courses, lessons, articles, events, discussions, and materials — is provided for educational and informational purposes only.

## Not Financial Advice

Nothing on Equity Table constitutes personalized financial, investment, tax, or legal advice. The information provided does not take into account your individual circumstances, needs, risk tolerance, or financial situation.

## Consult a Professional

Before making financial decisions, you should consult a qualified, licensed financial advisor, tax professional, or attorney as appropriate for your situation.

## No Guarantees

Equity Table does not guarantee specific financial outcomes. Financial information can change rapidly and may not reflect current market conditions.

## Member Responsibility

You are responsible for your own financial decisions. Equity Table and its partners, instructors, and staff are not liable for financial decisions made based on content viewed on this platform.

## Questions

education@equitytable.com',
  true
),
(
  'recording-consent',
  'Recording Consent Policy',
  '# Recording Consent Policy

## Events May Be Recorded

Equity Events on this platform may be recorded by the event host or facilitator for the purposes of sharing with table members, providing a library of educational content, and improving future events.

## Your Consent

Before participating in a recorded event, you will be asked to confirm that you understand the event may be recorded. Your consent is required before recordings can include your participation.

## How Recordings Are Used

Recordings are stored securely in Supabase Storage and may be made available to Equity Table members based on the visibility settings chosen by the table''s administrators. Recordings will not be shared publicly without explicit permission.

## Your Rights

You may withdraw consent to participate in a recorded event at any time before the recording begins. If a recording has already been made that includes you, contact your Equity Table administrator to request removal.

## Contact

privacy@equitytable.com',
  true
)
on conflict (slug) do nothing;

-- ----------------------------------------------------------------
-- FEATURE FLAGS (default set)
-- ----------------------------------------------------------------
insert into public.feature_flags (name, slug, description, enabled) values
  ('TTS Audio Generation', 'tts-audio', 'Enable background TTS audio generation for lessons', false),
  ('Event Recording Studio', 'recording-studio', 'Enable in-browser event recording', true),
  ('Public Table Directory', 'public-directory', 'Show public Equity Table directory on marketing site', true),
  ('Goal Contributions via Stripe', 'stripe-goal-contributions', 'Accept Stripe payments for goal contributions', false),
  ('Leaderboards', 'leaderboards', 'Enable leaderboards within Equity Tables', true),
  ('Mux Video Processing', 'mux-video', 'Use Mux for video processing instead of Supabase Storage', false),
  ('AI Course Recommendations', 'ai-recommendations', 'AI-powered course recommendations', false)
on conflict (slug) do nothing;
