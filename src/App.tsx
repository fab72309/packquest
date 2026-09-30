import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'
import { AppLayout } from './components/AppLayout'
import { ChildHomePage } from './features/checklist/ChildHomePage'
import { ChildMissionPage } from './features/checklist/ChildMissionPage'
import { ParentDashboardPage } from './features/parent/ParentDashboardPage'
import { ParentMissionPage } from './features/parent/ParentMissionPage'
import { NewDemoMissionPage } from './features/parent/NewDemoMissionPage'
import { WelcomePage } from './features/auth/WelcomePage'
import { ParentAccountPage } from './features/auth/ParentAccountPage'
import { ParentAuthGuard } from './features/auth/ParentAuthGuard'
import { PrivacyNoticePage } from './features/legal/PrivacyNoticePage'
import { DemoMissionProvider } from './state/DemoMissionContext'

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
  ...(previewBuild ? [{ path: '/privacy', element: <PrivacyNoticePage /> }] : []),
  { path: '/parent/account', element: <ParentAccountPage /> },
  { path: '/child/join', element: <Suspense fallback={loadingScreen}><ChildJoinPage /></Suspense> },
  { path: '/child', element: <Suspense fallback={loadingScreen}><ConnectedChildWorkspace /></Suspense> },
  { path: '/child/mission', element: <Suspense fallback={loadingScreen}><ConnectedChildWorkspace missionPage /></Suspense> },
  {
    element: <AppLayout />,
    children: [
      { element: <ParentAuthGuard />, children: [
        { path: '/parent/templates', element: <Suspense fallback={<div className="template-account-state" role="status">Chargement des modèles…</div>}><ParentTemplateLibraryRoute /></Suspense> },
        { path: '/parent/pairing', element: <Suspense fallback={loadingScreen}><ParentPairingPage /></Suspense> },
        { path: '/parent/history', element: <Suspense fallback={loadingScreen}><ParentHistoryPage /></Suspense> },
        { path: '/parent/create', element: <Suspense fallback={loadingScreen}><ConnectedNewMissionPage /></Suspense> },
      ] },
      ...(demoRoutesEnabled ? [
        { path: '/parent', element: <ParentDashboardPage /> },
        { path: '/parent/new', element: <NewDemoMissionPage /> },
        { path: '/parent/mission', element: <ParentMissionPage /> },
        { path: '/demo/templates', element: <Suspense fallback={<div className="template-account-state" role="status">Chargement des modèles…</div>}><ParentTemplateLibraryRoute demo /></Suspense> },
        { path: '/demo/child', element: <ChildHomePage /> },
        { path: '/demo/child/mission', element: <ChildMissionPage /> },
      ] : [{ path: '/parent', element: <Navigate to="/parent/account" replace /> }]),
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
], { basename: import.meta.env.BASE_URL })

export default function App() {
  return (
    <DemoMissionProvider>
      <RouterProvider router={router} />
    </DemoMissionProvider>
  )
}
