import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ThemeProvider } from '@/components/ThemeProvider'
import { SupabaseSync } from '@/components/SupabaseSync'
import { DashboardPage } from '@/pages/Dashboard'
import { ProjectsPage } from '@/pages/Projects'
import { ProjectDetailPage } from '@/pages/ProjectDetail'
import { CalendarPage } from '@/pages/Calendar'
import { ArchivePage } from '@/pages/Archive'
import { SettingsPage } from '@/pages/Settings'

export default function App() {
  return (
    <ThemeProvider>
      <SupabaseSync>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="projects/:id" element={<ProjectDetailPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="archive" element={<ArchivePage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SupabaseSync>
    </ThemeProvider>
  )
}
