import type { SupabaseClient } from '@supabase/supabase-js'

interface GoalTypeGuess {
  goal_type: string
  target_metric: string
}

const GOAL_TYPE_KEYWORDS: (GoalTypeGuess & { keywords: string[] })[] = [
  { goal_type: 'emergency_savings', target_metric: 'dollars', keywords: ['emergency saving', 'emergency fund', 'emergency reserve'] },
  { goal_type: 'reduce_debt', target_metric: 'dollars', keywords: ['debt'] },
  { goal_type: 'homeownership', target_metric: 'members', keywords: ['home', 'rental', 'first-home'] },
  { goal_type: 'pathway_participants', target_metric: 'participants', keywords: ['pathway'] },
  { goal_type: 'courses_completed', target_metric: 'courses', keywords: ['course', 'enroll', 'class series', 'literacy', 'curriculum'] },
  { goal_type: 'events_hosted', target_metric: 'events', keywords: ['event', 'workshop', 'host'] },
  { goal_type: 'fundraising', target_metric: 'dollars', keywords: ['raise fund', 'fundraising', 'fund a', 'fund the', 'campaign'] },
  { goal_type: 'business_launch', target_metric: 'milestones', keywords: ['business', 'launch'] },
  { goal_type: 'collective_wealth', target_metric: 'dollars', keywords: ['wealth', 'invest', 'brokerage'] },
  { goal_type: 'members', target_metric: 'members', keywords: ['member', 'famil', 'household', 'enroll'] },
]

function inferGoalType(text: string): GoalTypeGuess {
  const lower = text.toLowerCase()
  for (const g of GOAL_TYPE_KEYWORDS) {
    if (g.keywords.some((k) => lower.includes(k))) {
      return { goal_type: g.goal_type, target_metric: g.target_metric }
    }
  }
  return { goal_type: 'custom', target_metric: 'units' }
}

function inferTargetValue(text: string): number {
  const match = text.match(/\d+/)
  return match ? parseInt(match[0], 10) : 1
}

/**
 * Seeds a newly created Equity Table with starter content derived from its
 * table type: recommended goals (as real, editable goal records) and a
 * pinned welcome post on the message board.
 */
export async function bootstrapTableContent(
  supabase: SupabaseClient,
  params: {
    tableId: string
    tableTypeId: string
    ownerId: string
    tableName: string
    mission: string
  }
) {
  const { tableId, tableTypeId, ownerId, tableName, mission } = params

  const { data: typeRow } = await supabase
    .from('equity_table_types')
    .select('recommended_goals')
    .eq('id', tableTypeId)
    .single()

  const recommendedGoals: string[] = Array.isArray(typeRow?.recommended_goals)
    ? typeRow.recommended_goals
    : []

  if (recommendedGoals.length > 0) {
    const goalRows = recommendedGoals.map((title: string, i: number) => {
      const { goal_type, target_metric } = inferGoalType(title)
      const isCurrency = target_metric === 'dollars'
      return {
        table_id: tableId,
        created_by: ownerId,
        title,
        goal_type,
        target_metric,
        current_value: 0,
        target_value: inferTargetValue(title),
        currency: isCurrency ? 'USD' : null,
        visibility: 'table_only' as const,
        accept_contributions: false,
        contribution_type: 'none' as const,
        status: 'active' as const,
        featured: i === 0,
      }
    })

    const { error: goalsError } = await supabase.from('goals').insert(goalRows)
    if (goalsError) console.error('Failed to bootstrap starter goals:', goalsError)
  }

  const checklist = recommendedGoals.length > 0
    ? `\n\nHere are some starter goals to get your table moving — edit, remove, or replace them anytime from the Goals tab:\n\n${recommendedGoals.map((g) => `- ${g}`).join('\n')}`
    : '\n\nHead to the Goals tab to set your first shared goal.'

  const welcomeBody = `Welcome to **${tableName}**! 🎉${mission ? `\n\n${mission}` : ''}${checklist}`

  const { error: postError } = await supabase.from('posts').insert({
    table_id: tableId,
    user_id: ownerId,
    title: `Welcome to ${tableName}`,
    body: welcomeBody,
    post_type: 'announcement',
    visibility: 'table_only',
    pinned: true,
  })
  if (postError) console.error('Failed to bootstrap welcome post:', postError)
}
