import { describe, expect, it } from 'vitest'

import { routes } from './index'

describe('router architecture', () => {
  it('keeps page routes code-split through data-router lazy modules', () => {
    const root = routes[0]
    expect(root).toMatchObject({ path: '/' })
    expect(root.children).toBeDefined()

    const pageRoutes = root.children ?? []
    expect(pageRoutes.length).toBeGreaterThanOrEqual(10)
    expect(pageRoutes.every((route) => typeof route.lazy === 'function')).toBe(true)
    expect(pageRoutes.every((route) => !('element' in route))).toBe(true)

    const paths = pageRoutes.map((route) => route.path)
    expect(paths).toEqual(
      expect.arrayContaining([
        'onboarding',
        'dashboard',
        'hospitals',
        'shops',
        'care',
        'communities',
        'adoption',
        'funeral',
      ])
    )
  })
})
