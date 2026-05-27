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
        path: 'species/:idOrSlug',
        HydrateFallback: Loading,
        lazy: lazyPage(() => import('@pages/SpeciesDetail')),
      },
      { path: '*', HydrateFallback: Loading, lazy: lazyPage(() => import('@pages/NotFound')) },
    ],
  },
] satisfies RouteObject[]

export const router = createBrowserRouter(routes)
