import { lazy, Suspense, useEffect, useRef } from 'react'
import { App as CapacitorApp } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'
import { AppLayout } from './components/AppLayout'
import { ChildHomePage } from './features/checklist/ChildHomePage'
import { ChildMissionPage } from './features/checklist/ChildMissionPage'
import { ParentDashboardPage } from './features/parent/ParentDashboardPage'
import { ParentMissionPage } from './features/parent/ParentMissionPage'
import { NewDemoMissionPage } from './features/parent/NewDemoMissionPage'
import { WelcomePage } from './features/auth/WelcomePage'
import { ParentAgeGate } from './features/auth/ParentAgeGate'
import { PrivacyNoticePage } from './features/legal/PrivacyNoticePage'
import { ConnectedPrivacyPolicyPage } from './features/legal/ConnectedPrivacyPolicyPage'
import { AccountDeletionPage } from './features/legal/AccountDeletionPage'
import { getAuthReturnPath, nativeAuthCallback } from './lib/appUrl'
import { DemoMissionProvider } from './state/DemoMissionContext'

const ParentAccountPage = lazy(() => import('./features/auth/ParentAccountPage').then((module) => ({ default: module.ParentAccountPage })))
const ParentAuthGuard = lazy(() => import('./features/auth/ParentAuthGuard').then((module) => ({ default: module.ParentAuthGuard })))
const ParentTemplateLibraryRoute = lazy(() => import('./features/parent/ParentTemplateLibraryRoute').then((module) => ({ default: module.ParentTemplateLibraryRoute })))
const ChildJoinPage = lazy(() => import('./features/checklist/ChildJoinPage').then((module) => ({ default: module.ChildJoinPage })))
const ConnectedChildWorkspace = lazy(() => import('./features/checklist/ConnectedChildWorkspace').then((module) => ({ default: module.ConnectedChildWorkspace })))
const ParentPairingPage = lazy(() => import('./features/parent/ParentPairingPage').then((module) => ({ default: module.ParentPairingPage })))
const ParentHistoryPage = lazy(() => import('./features/parent/ParentHistoryPage').then((module) => ({ default: module.ParentHistoryPage })))
const ConnectedNewMissionPage = lazy(() => import('./features/parent/ConnectedNewMissionPage').then((module) => ({ default: module.ConnectedNewMissionPage })))

const loadingScreen = <div className="template-account-state" role="status">Chargement de PackQuest…</div>
const demoRoutesEnabled = import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === 'true'
const previewBuild = import.meta.env.VITE_DEMO_MODE === 'true'

const router = createBrowserRouter([
  { path: '/', element: <WelcomePage /> },
  { path: '/privacy', element: previewBuild ? <PrivacyNoticePage /> : <ConnectedPrivacyPolicyPage /> },
  { path: '/account-deletion', element: <AccountDeletionPage /> },
  { path: '/parent/account', element: <ParentAgeGate><Suspense fallback={loadingScreen}><ParentAccountPage /></Suspense></ParentAgeGate> },
  { path: '/child/join', element: <Suspense fallback={loadingScreen}><ChildJoinPage /></Suspense> },
  { path: '/child', element: <Suspense fallback={loadingScreen}><ConnectedChildWorkspace /></Suspense> },
  { path: '/child/mission', element: <Suspense fallback={loadingScreen}><ConnectedChildWorkspace missionPage /></Suspense> },
  {
    element: <AppLayout />,
    children: [
      { element: <ParentAgeGate><Suspense fallback={loadingScreen}><ParentAuthGuard /></Suspense></ParentAgeGate>, children: [
        { path: '/parent/templates', element: <Suspense fallback={<div className="template-account-state" role="status">Chargement des listes…</div>}><ParentTemplateLibraryRoute /></Suspense> },
        { path: '/parent/pairing', element: <Suspense fallback={loadingScreen}><ParentPairingPage /></Suspense> },
        { path: '/parent/history', element: <Suspense fallback={loadingScreen}><ParentHistoryPage /></Suspense> },
        { path: '/parent/create', element: <Suspense fallback={loadingScreen}><ConnectedNewMissionPage /></Suspense> },
      ] },
      ...(demoRoutesEnabled ? [
        { path: '/parent', element: <ParentDashboardPage /> },
        { path: '/parent/new', element: <NewDemoMissionPage /> },
        { path: '/parent/mission', element: <ParentMissionPage /> },
        { path: '/demo/templates', element: <Suspense fallback={<div className="template-account-state" role="status">Chargement des listes…</div>}><ParentTemplateLibraryRoute demo /></Suspense> },
        { path: '/demo/child', element: <ChildHomePage /> },
        { path: '/demo/child/mission', element: <ChildMissionPage /> },
      ] : [{ path: '/parent', element: <Navigate to="/parent/account" replace /> }]),
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
], { basename: import.meta.env.BASE_URL })

export default function App() {
  const handledAuthCodes = useRef(new Set<string>())

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    let active = true
    let removeListener: (() => Promise<void>) | undefined

    async function handleAuthUrl(url: string) {
      if (!active) return
      let callbackUrl: URL
      try {
        callbackUrl = new URL(url)
      } catch {
        return
      }
      const expectedCallback = new URL(nativeAuthCallback)
      if (callbackUrl.protocol !== expectedCallback.protocol || callbackUrl.hostname !== expectedCallback.hostname || callbackUrl.pathname !== expectedCallback.pathname) return

      const code = callbackUrl.searchParams.get('code')
      const fragment = new URLSearchParams(callbackUrl.hash.slice(1))
      let callbackFailed = !code || callbackUrl.searchParams.has('error') || fragment.has('error')
      // Launch URL and appUrlOpen can deliver the same one-use PKCE code.
      if (code && handledAuthCodes.current.has(code)) return
      if (code && !callbackFailed) {
        handledAuthCodes.current.add(code)
        try {
          const { supabase } = await import('./lib/supabase/client')
          if (!supabase) throw new Error('Parent sign-in is not configured')
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          callbackFailed = Boolean(error)
        } catch {
          callbackFailed = true
        }
      }
      if (callbackFailed) {
        window.sessionStorage.setItem('packquest.auth.callback.error', 'true')
        window.dispatchEvent(new Event('packquest:auth-error'))
      }

      void router.navigate(callbackFailed ? '/parent/account' : getAuthReturnPath())
      void Browser.close().catch(() => undefined)
    }

    void CapacitorApp.addListener('appUrlOpen', ({ url }) => { void handleAuthUrl(url) })
      .then((listener) => {
        if (!active) void listener.remove()
        else {
          removeListener = () => listener.remove()
          // Register first so a callback arriving during startup cannot fall between both APIs.
          void CapacitorApp.getLaunchUrl()
            .then((launch) => { if (launch?.url) void handleAuthUrl(launch.url) })
            .catch(() => undefined)
        }
      })
      .catch(() => undefined)

    return () => {
      active = false
      if (removeListener) void removeListener()
    }
  }, [])

  return (
    <DemoMissionProvider>
      <RouterProvider router={router} />
    </DemoMissionProvider>
  )
}
