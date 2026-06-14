/**
 * Shared catalog of every meaningful care tool / page, grouped for discovery.
 * Single source of truth for the Tools hub page and the global command palette.
 * Labels are not stored here; consumers translate via `nav.<navKey>` and group
 * titles via `tools.groups.<group id>`.
 */

export interface ToolEntry {
  path: string
  navKey: string
}

export interface ToolGroup {
  id: string
  emoji: string
  tools: ToolEntry[]
}

export const TOOL_GROUPS: readonly ToolGroup[] = [
  {
    id: 'genetics',
    emoji: '🧬',
    tools: [
      { path: '/genetics', navKey: 'genetics' },
      { path: '/breeding', navKey: 'breeding' },
      { path: '/lineage', navKey: 'lineage' },
      { path: '/morphs', navKey: 'morphs' },
    ],
  },
  {
    id: 'habitat',
    emoji: '🏡',
    tools: [
      { path: '/vivarium', navKey: 'vivarium' },
      { path: '/enclosure', navKey: 'enclosure' },
      { path: '/lighting', navKey: 'lighting' },
      { path: '/water', navKey: 'water' },
      { path: '/gear', navKey: 'gear' },
      { path: '/habitat', navKey: 'habitat' },
      { path: '/brumation', navKey: 'brumation' },
      { path: '/seasonal', navKey: 'seasonal' },
    ],
  },
  {
    id: 'feeding',
    emoji: '🍽️',
    tools: [
      { path: '/feeding', navKey: 'feeding' },
      { path: '/food', navKey: 'food' },
      { path: '/supplements', navKey: 'supplements' },
      { path: '/feeders', navKey: 'feeders' },
    ],
  },
  {
    id: 'health',
    emoji: '❤️',
    tools: [
      { path: '/health', navKey: 'health' },
      { path: '/growth', navKey: 'growth' },
      { path: '/bcs', navKey: 'bcs' },
      { path: '/vitals', navKey: 'vitals' },
      { path: '/meds', navKey: 'meds' },
      { path: '/molt', navKey: 'molt' },
      { path: '/senior', navKey: 'senior' },
    ],
  },
  {
    id: 'daily',
    emoji: '🗓️',
    tools: [
      { path: '/diary', navKey: 'diary' },
      { path: '/routine', navKey: 'routine' },
      { path: '/calendar', navKey: 'calendar' },
      { path: '/cleaning', navKey: 'cleaning' },
      { path: '/alerts', navKey: 'alerts' },
      { path: '/passport', navKey: 'passport' },
    ],
  },
  {
    id: 'safety',
    emoji: '🛟',
    tools: [
      { path: '/safety', navKey: 'safety' },
      { path: '/kit', navKey: 'kit' },
      { path: '/transport', navKey: 'transport' },
      { path: '/cohab', navKey: 'cohab' },
      { path: '/taming', navKey: 'taming' },
      { path: '/sos', navKey: 'sos' },
    ],
  },
  {
    id: 'finance',
    emoji: '💰',
    tools: [
      { path: '/budget', navKey: 'budget' },
      { path: '/costreport', navKey: 'costreport' },
      { path: '/insurance', navKey: 'insurance' },
      { path: '/supplies', navKey: 'supplies' },
      { path: '/wishlist', navKey: 'wishlist' },
      { path: '/setup', navKey: 'setup' },
    ],
  },
  {
    id: 'community',
    emoji: '👥',
    tools: [
      { path: '/forum', navKey: 'forum' },
      { path: '/cafes', navKey: 'cafes' },
      { path: '/qna', navKey: 'qna' },
      { path: '/showcase', navKey: 'showcase' },
      { path: '/meetups', navKey: 'meetups' },
      { path: '/market', navKey: 'market' },
      { path: '/communities', navKey: 'communities' },
      { path: '/consult', navKey: 'consult' },
      { path: '/adoption', navKey: 'adoption' },
    ],
  },
  {
    id: 'discover',
    emoji: '🔎',
    tools: [
      { path: '/species', navKey: 'species' },
      { path: '/compare', navKey: 'compare' },
      { path: '/match', navKey: 'match' },
      { path: '/care', navKey: 'care' },
      { path: '/assistant', navKey: 'assistant' },
      { path: '/hospitals', navKey: 'hospitals' },
      { path: '/shops', navKey: 'shops' },
      { path: '/resources', navKey: 'resources' },
      { path: '/events', navKey: 'events' },
    ],
  },
  {
    id: 'records',
    emoji: '🗂️',
    tools: [
      { path: '/registry', navKey: 'registry' },
      { path: '/petid', navKey: 'petid' },
      { path: '/caresheet', navKey: 'caresheet' },
      { path: '/backup', navKey: 'backup' },
      { path: '/funeral', navKey: 'funeral' },
      { path: '/partners', navKey: 'partners' },
    ],
  },
] as const

export interface FlatTool {
  path: string
  navKey: string
  groupId: string
  emoji: string
}

/** Flattened view for search surfaces (command palette). */
export const ALL_TOOLS: readonly FlatTool[] = TOOL_GROUPS.flatMap((group) =>
  group.tools.map((tool) => ({
    path: tool.path,
    navKey: tool.navKey,
    groupId: group.id,
    emoji: group.emoji,
  }))
)
