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
      { path: 'routine', HydrateFallback: Loading, lazy: lazyPage(() => import('@pages/Routine')) },
      {
        path: 'calendar',
        HydrateFallback: Loading,
        lazy: lazyPage(() => import('@pages/Calendar')),
      },
      {
        path: 'insurance',
        HydrateFallback: Loading,
        lazy: lazyPage(() => import('@pages/Insurance')),
      },
      { path: 'setup', HydrateFallback: Loading, lazy: lazyPage(() => import('@pages/Setup')) },
      { path: 'morphs', HydrateFallback: Loading, lazy: lazyPage(() => import('@pages/Morphs')) },
      {
        path: 'genetics',
        HydrateFallback: Loading,
        lazy: lazyPage(() => import('@pages/Genetics')),
      },
      { path: 'molt', HydrateFallback: Loading, lazy: lazyPage(() => import('@pages/Molt')) },
      {
        path: 'vivarium',
        HydrateFallback: Loading,
        lazy: lazyPage(() => import('@pages/Vivarium')),
      },
      {
        path: 'showcase',
        HydrateFallback: Loading,
        lazy: lazyPage(() => import('@pages/Showcase')),
      },
      { path: 'qna', HydrateFallback: Loading, lazy: lazyPage(() => import('@pages/Qna')) },
      { path: 'meetups', HydrateFallback: Loading, lazy: lazyPage(() => import('@pages/Meetups')) },
      {
        path: 'breeding',
        HydrateFallback: Loading,
        lazy: lazyPage(() => import('@pages/Breeding')),
      },
      { path: 'meds', HydrateFallback: Loading, lazy: lazyPage(() => import('@pages/Meds')) },
      { path: 'feeding', HydrateFallback: Loading, lazy: lazyPage(() => import('@pages/Feeding')) },
      { path: 'market', HydrateFallback: Loading, lazy: lazyPage(() => import('@pages/Market')) },
      {
        path: 'passport',
        HydrateFallback: Loading,
        lazy: lazyPage(() => import('@pages/Passport')),
      },
      {
        path: 'assistant',
        HydrateFallback: Loading,
        lazy: lazyPage(() => import('@pages/Assistant')),
      },
      { path: 'growth', HydrateFallback: Loading, lazy: lazyPage(() => import('@pages/Growth')) },
      { path: 'water', HydrateFallback: Loading, lazy: lazyPage(() => import('@pages/Water')) },
      {
        path: 'brumation',
        HydrateFallback: Loading,
        lazy: lazyPage(() => import('@pages/Brumation')),
      },
      { path: 'gear', HydrateFallback: Loading, lazy: lazyPage(() => import('@pages/Gear')) },
      { path: 'senior', HydrateFallback: Loading, lazy: lazyPage(() => import('@pages/Senior')) },
      { path: 'vitals', HydrateFallback: Loading, lazy: lazyPage(() => import('@pages/Vitals')) },
      { path: 'cohab', HydrateFallback: Loading, lazy: lazyPage(() => import('@pages/Cohab')) },
      {
        path: 'wishlist',
        HydrateFallback: Loading,
        lazy: lazyPage(() => import('@pages/Wishlist')),
      },
      { path: 'taming', HydrateFallback: Loading, lazy: lazyPage(() => import('@pages/Taming')) },
      { path: 'kit', HydrateFallback: Loading, lazy: lazyPage(() => import('@pages/Kit')) },
      { path: 'alerts', HydrateFallback: Loading, lazy: lazyPage(() => import('@pages/Alerts')) },
      {
        path: 'supplements',
        HydrateFallback: Loading,
        lazy: lazyPage(() => import('@pages/Supplements')),
      },
      { path: 'feeders', HydrateFallback: Loading, lazy: lazyPage(() => import('@pages/Feeders')) },
      { path: 'food', HydrateFallback: Loading, lazy: lazyPage(() => import('@pages/Food')) },
      { path: 'events', HydrateFallback: Loading, lazy: lazyPage(() => import('@pages/Events')) },
      { path: 'about', HydrateFallback: Loading, lazy: lazyPage(() => import('@pages/About')) },
      { path: 'faq', HydrateFallback: Loading, lazy: lazyPage(() => import('@pages/Faq')) },
      { path: 'herd', HydrateFallback: Loading, lazy: lazyPage(() => import('@pages/Herd')) },
      { path: 'contact', HydrateFallback: Loading, lazy: lazyPage(() => import('@pages/Contact')) },
      { path: '*', HydrateFallback: Loading, lazy: lazyPage(() => import('@pages/NotFound')) },
    ],
  },
] satisfies RouteObject[]

export const router = createBrowserRouter(routes)
