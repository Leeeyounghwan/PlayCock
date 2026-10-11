import { createBrowserRouter, Navigate } from 'react-router'
import { AnalyticsPage, FinancePage, HistoryPage, SessionsPage } from '@/features/admin/AdminPages'
import AdminShellPage from '@/features/live/AdminShellPage'
import ViewerShellPage from '@/features/live/ViewerShellPage'
import AdminLayout from '@/layouts/AdminLayout'
import ViewerLayout from '@/layouts/ViewerLayout'

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/admin/live" replace /> },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { path: 'live', element: <AdminShellPage /> },
      { path: 'sessions', element: <SessionsPage /> },
      { path: 'history', element: <HistoryPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'finance', element: <FinancePage /> },
    ],
  },
  {
    path: '/live/:sessionId?',
    element: <ViewerLayout />,
    children: [{ index: true, element: <ViewerShellPage /> }],
  },
])
