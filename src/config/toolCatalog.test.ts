import { describe, expect, it } from 'vitest'

import { ALL_TOOLS, TOOL_GROUPS } from './toolCatalog'

describe('toolCatalog', () => {
  it('flattens every group tool into ALL_TOOLS', () => {
    const sum = TOOL_GROUPS.reduce((n, g) => n + g.tools.length, 0)
    expect(ALL_TOOLS.length).toBe(sum)
  })

  it('has unique paths', () => {
    const paths = ALL_TOOLS.map((tool) => tool.path)
    expect(new Set(paths).size).toBe(paths.length)
  })

  it('uses absolute paths, non-empty nav keys, and a known group id', () => {
    const groupIds = new Set(TOOL_GROUPS.map((g) => g.id))
    for (const tool of ALL_TOOLS) {
      expect(tool.path.startsWith('/')).toBe(true)
      expect(tool.navKey.length).toBeGreaterThan(0)
      expect(groupIds.has(tool.groupId)).toBe(true)
    }
  })
})
