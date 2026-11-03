import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { IconSprite } from '@/design-system/react'
import { AppLayout } from '@/components/layout/AppLayout'
import { ThemeProvider } from '@/components/ThemeProvider'
import { AuthGate } from '@/components/auth/AuthGate'
import { SupabaseSync } from '@/components/SupabaseSync'
import { DashboardPage } from '@/pages/Dashboard'
import { ProjectsPage } from '@/pages/Projects'
import { ProjectDetailPage } from '@/pages/ProjectDetail'
import { CalendarPage } from '@/pages/Calendar'
import { ArchivePage } from '@/pages/Archive'
import { SettingsPage } from '@/pages/Settings'
import { ClientIntakePage } from '@/pages/ClientIntake'

const router = createBrowserRouter([
  { path: '/c/:token', element: <ClientIntakePage /> },
  {
    element: (
      <AuthGate>
        <SupabaseSync>
          <AppLayout />
        </SupabaseSync>
      </AuthGate>
    ),
    children: [
      { index: true, element: <Navigate to="/projects" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'my-projects', element: <ProjectsPage favoritesOnly /> },
      { path: 'projects/:id', element: <ProjectDetailPage /> },
      { path: 'calendar', element: <CalendarPage /> },
      { path: 'archive', element: <ArchivePage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
])

export default function App() {
  return (
    <ThemeProvider>
      <IconSprite />
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}
