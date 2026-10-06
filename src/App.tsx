import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
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

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/c/:token" element={<ClientIntakePage />} />
          <Route
            element={
              <AuthGate>
                <SupabaseSync>
                  <AppLayout />
                </SupabaseSync>
              </AuthGate>
            }
          >
            <Route index element={<Navigate to="/projects" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="my-projects" element={<ProjectsPage favoritesOnly />} />
            <Route path="projects/:id" element={<ProjectDetailPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="archive" element={<ArchivePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
