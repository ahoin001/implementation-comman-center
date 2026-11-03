import { useRef, useState } from 'react'
import { useStore } from '@/store/useStore'
import { signOut } from '@/lib/auth'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Toggle } from '@/components/ui/Toggle'
import { ScreenHead } from '@/components/ui/ScreenHead'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import type { AppSettings } from '@/types'
import { GlobalSearch } from '@/components/search/GlobalSearch'

const themeOptions: { id: AppSettings['theme']; label: string }[] = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Graphite' },
  { id: 'system', label: 'System' },
]

export function SettingsPage() {
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const updateIntegrations = useStore((s) => s.updateIntegrations)
  const exportData = useStore((s) => s.exportData)
  const importData = useStore((s) => s.importData)
  const resetToSeed = useStore((s) => s.resetToSeed)
  const syncError = useStore((s) => s.syncError)
  const hydrated = useStore((s) => s.hydrated)
  const fileRef = useRef<HTMLInputElement>(null)
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleExport = () => {
    const blob = new Blob([exportData()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `implementation-center-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const success = importData(reader.result as string)
      setImportStatus(success ? 'success' : 'error')
      setTimeout(() => setImportStatus('idle'), 3000)
    }
    reader.readAsText(file)
  }

  return (
    <div className="screen">
      <ScreenHead title="Settings" sub="Light paper, Graphite dark, and the tools you need to run launches.">
        <GlobalSearch className="max-w-[16rem]" />
      </ScreenHead>

      <div className="split-settings sy-settings">
        <Card>
          <CardHeader>
            <CardTitle>Cloud Sync</CardTitle>
            <CardDescription>Projects and settings live in Supabase for the team.</CardDescription>
          </CardHeader>
          <p className="text-sm text-[var(--ink-3)]">
            Status:{' '}
            <span className={syncError ? 'text-[var(--danger)]' : 'text-[var(--mint)]'}>
              {!hydrated ? 'Connecting…' : syncError ? syncError : 'Connected'}
            </span>
          </p>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your name on the board and in comments.</CardDescription>
          </CardHeader>
          <Input
            value={settings.userName}
            onChange={(e) => updateSettings({ userName: e.target.value })}
            placeholder="Your name"
          />
          <Button variant="outline" size="sm" className="mt-3" onClick={() => void signOut()}>
            Sign out
          </Button>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Light is the original look. Graphite is its own dark theme.</CardDescription>
          </CardHeader>
          <div className="sy-opt">
            <div className="grow">
              <b>Theme</b>
              <small>Paper by day, Graphite after hours.</small>
            </div>
            <SegmentedControl
              label="Theme"
              value={settings.theme}
              onChange={(theme) => updateSettings({ theme })}
              options={themeOptions}
            />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <div className="sy-opt">
            <div className="grow">
              <b>Reminders</b>
              <small>Ping before a launch window.</small>
            </div>
            <Toggle
              label="Enable reminders"
              checked={settings.notificationsEnabled}
              onChange={(notificationsEnabled) => updateSettings({ notificationsEnabled })}
            />
          </div>
          <label className="field mt-4">
            Reminder window (days before launch)
            <Input
              type="number"
              min={1}
              max={30}
              value={settings.reminderWindowDays}
              onChange={(e) => updateSettings({ reminderWindowDays: parseInt(e.target.value) || 14 })}
            />
          </label>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
            <CardDescription>
              Store your company API credentials locally in this browser. Used when API sync is enabled in a future update — for now, enter project-specific URLs on each project.
            </CardDescription>
          </CardHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[var(--color-muted-foreground)] mb-1 block">Salesforce Instance URL</label>
              <Input
                type="url"
                placeholder="https://yourorg.my.salesforce.com"
                value={settings.integrations.salesforceInstanceUrl}
                onChange={(e) => updateIntegrations({ salesforceInstanceUrl: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--color-muted-foreground)] mb-1 block">Salesforce API Key / Token</label>
              <Input
                type="password"
                placeholder="Stored locally only"
                value={settings.integrations.salesforceApiKey}
                onChange={(e) => updateIntegrations({ salesforceApiKey: e.target.value })}
                autoComplete="off"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--color-muted-foreground)] mb-1 block">Jira Instance URL</label>
              <Input
                type="url"
                placeholder="https://yourorg.atlassian.net"
                value={settings.integrations.jiraInstanceUrl}
                onChange={(e) => updateIntegrations({ jiraInstanceUrl: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--color-muted-foreground)] mb-1 block">Jira API Key / Token</label>
              <Input
                type="password"
                placeholder="Stored locally only"
                value={settings.integrations.jiraApiKey}
                onChange={(e) => updateIntegrations({ jiraApiKey: e.target.value })}
                autoComplete="off"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--color-muted-foreground)] mb-1 block">Slack Workspace URL</label>
              <Input
                type="url"
                placeholder="https://yourworkspace.slack.com"
                value={settings.integrations.slackWorkspaceUrl}
                onChange={(e) => updateIntegrations({ slackWorkspaceUrl: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--color-muted-foreground)] mb-1 block">Default Google Drive Folder</label>
              <Input
                type="url"
                placeholder="https://drive.google.com/drive/folders/…"
                value={settings.integrations.googleDriveFolderUrl}
                onChange={(e) => updateIntegrations({ googleDriveFolderUrl: e.target.value })}
              />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data</CardTitle>
            <CardDescription>Export or import your data</CardDescription>
          </CardHeader>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={handleExport}>Export Data</Button>
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>Import Data</Button>
            <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            <Button variant="outline" onClick={resetToSeed}>Reload from Cloud</Button>
          </div>
          {importStatus === 'success' && <p className="mt-2 text-sm text-[var(--mint)]">Import successful</p>}
          {importStatus === 'error' && <p className="mt-2 text-sm text-[var(--danger)]">Import failed — invalid file</p>}
        </Card>
      </div>
    </div>
  )
}
