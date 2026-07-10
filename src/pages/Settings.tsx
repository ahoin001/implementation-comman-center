import { useRef, useState } from 'react'
import { useStore } from '@/store/useStore'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { AppSettings } from '@/types'

const accentColors = [
  { label: 'Blue', value: '#0071e3' },
  { label: 'Purple', value: '#af52de' },
  { label: 'Green', value: '#34c759' },
  { label: 'Orange', value: '#ff9500' },
  { label: 'Red', value: '#ff3b30' },
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
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Settings</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">Customize your command center</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Cloud Sync</CardTitle>
            <CardDescription>
              Data is stored in Supabase (no login for now — solo mode).
            </CardDescription>
          </CardHeader>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Status:{' '}
            <span className={syncError ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}>
              {!hydrated ? 'Connecting…' : syncError ? syncError : 'Connected'}
            </span>
          </p>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your display name on the dashboard</CardDescription>
          </CardHeader>
          <Input
            value={settings.userName}
            onChange={(e) => updateSettings({ userName: e.target.value })}
            placeholder="Your name"
          />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Theme</label>
              <div className="flex gap-2">
                {(['light', 'dark', 'system'] as AppSettings['theme'][]).map((theme) => (
                  <Button
                    key={theme}
                    variant={settings.theme === theme ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => updateSettings({ theme })}
                    className="capitalize"
                  >
                    {theme}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Accent Color</label>
              <div className="flex gap-2">
                {accentColors.map(({ label, value }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateSettings({ accentColor: value })}
                    className="h-8 w-8 rounded-full border-2 transition-transform duration-150 active:scale-90"
                    style={{
                      backgroundColor: value,
                      borderColor: settings.accentColor === value ? 'var(--color-foreground)' : 'transparent',
                    }}
                    title={label}
                  />
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm">Enable reminders</span>
            <input
              type="checkbox"
              checked={settings.notificationsEnabled}
              onChange={(e) => updateSettings({ notificationsEnabled: e.target.checked })}
              className="h-4 w-4 rounded accent-[var(--color-accent)]"
            />
          </label>
          <div className="mt-4">
            <label className="text-sm font-medium mb-2 block">Reminder window (days before launch)</label>
            <Input
              type="number"
              min={1}
              max={30}
              value={settings.reminderWindowDays}
              onChange={(e) => updateSettings({ reminderWindowDays: parseInt(e.target.value) || 14 })}
            />
          </div>
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
          {importStatus === 'success' && <p className="text-sm text-[var(--color-success)] mt-2">Import successful</p>}
          {importStatus === 'error' && <p className="text-sm text-[var(--color-danger)] mt-2">Import failed — invalid file</p>}
        </Card>
      </div>
    </div>
  )
}
