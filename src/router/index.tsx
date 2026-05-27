import Loading from '@components/common/Loading'
import RouteError from '@components/common/RouteError'
import { createBrowserRouter, type RouteObject } from 'react-router'

import type { ComponentType } from 'react'

import App from '@/App'

interface PageModule {
  default: ComponentType
}

function lazyPage(loadPage: () => Promise<PageModule>) {
  return async () => {
    const { default: Component } = await loadPage()
    return { Component }
  }
}

export const routes = [
  {
    path: '/',
    Component: App,
    ErrorBoundary: RouteError,
    children: [
      { index: true, HydrateFallback: Loading, lazy: lazyPage(() => import('@pages/Landing')) },
      {
        path: 'onboarding',
        HydrateFallback: Loading,
        lazy: lazyPage(() => import('@pages/Onboarding')),
      },
      {
        path: 'dashboard',
        HydrateFallback: Loading,
        lazy: lazyPage(() => import('@pages/Dashboard')),
      },
      {
        path: 'hospitals',
        HydrateFallback: Loading,
        lazy: lazyPage(() => import('@pages/Hospitals')),
      },
      { path: 'shops', HydrateFallback: Loading, lazy: lazyPage(() => import('@pages/Shops')) },
      { path: 'care', HydrateFallback: Loading, lazy: lazyPage(() => import('@pages/CareGuide')) },
      {
        path: 'care/:speciesId',
        HydrateFallback: Loading,
        lazy: lazyPage(() => import('@pages/CareGuide')),
      },
      {
        path: 'communities',
        HydrateFallback: Loading,
        lazy: lazyPage(() => import('@pages/Communities')),
      },
      {
        path: 'adoption',
        HydrateFallback: Loading,
        lazy: lazyPage(() => import('@pages/Adoption')),
      },
      {
        path: 'funeral',
        HydrateFallback: Loading,
        lazy: lazyPage(() => import('@pages/Funeral')),
      },
      {
        path: 'species',
        HydrateFallback: Loading,
        lazy: lazyPage(() => import('@pages/SpeciesCatalog')),
      },
      {
        path: 'species/:idOrSlug',
        HydrateFallback: Loading,
        lazy: lazyPage(() => import('@pages/SpeciesDetail')),
      },
      {
        path: 'resources',
        HydrateFallback: Loading,
        lazy: lazyPage(() => import('@pages/Resources')),
      },
      {
        path: 'diary',
        HydrateFallback: Loading,
        lazy: lazyPage(() => import('@pages/Diary')),
      },
      {
        path: 'match',
        HydrateFallback: Loading,
        lazy: lazyPage(() => import('@pages/Match')),
      },
      {
        path: 'consult',
        HydrateFallback: Loading,
        lazy: lazyPage(() => import('@pages/Consult')),
      },
      {
        path: 'forum',
        HydrateFallback: Loading,
        lazy: lazyPage(() => import('@pages/Forum')),
      },
      {
        path: 'partners',
        HydrateFallback: Loading,
        lazy: lazyPage(() => import('@pages/Partners')),
      },
      {
        path: 'admin',
        HydrateFallback: Loading,
        lazy: lazyPage(() => import('@pages/Admin')),
      },
      { path: 'sos', HydrateFallback: Loading, lazy: lazyPage(() => import('@pages/Sos')) },
      {
        path: 'health',
        HydrateFallback: Loading,
        lazy: lazyPage(() => import('@pages/Health')),
      },
      {
        path: 'habitat',
        HydrateFallback: Loading,
        lazy: lazyPage(() => import('@pages/Habitat')),
      },
      {
        path: 'budget',
        HydrateFallback: Loading,
        lazy: lazyPage(() => import('@pages/Budget')),
      },
      {
        path: 'supplies',
        HydrateFallback: Loading,
        lazy: lazyPage(() => import('@pages/Supplies')),
      },
      {
        path: 'registry',
        HydrateFallback: Loading,
        lazy: lazyPage(() => import('@pages/Registry')),
      },
      {
        path: 'compare',
        HydrateFallback: Loading,
        lazy: lazyPage(() => import('@pages/Compare')),
      },
      { path: 'petid', HydrateFallback: Loading, lazy: lazyPage(() => import('@pages/PetId')) },
      { path: 'backup', HydrateFallback: Loading, lazy: lazyPage(() => import('@pages/Backup')) },
      { path: '*', HydrateFallback: Loading, lazy: lazyPage(() => import('@pages/NotFound')) },
    ],
  },
] satisfies RouteObject[]

export const router = createBrowserRouter(routes)
