import {
  ExternalLink,
  Cloud,
  MessageSquare,
  FolderOpen,
  Globe,
  Monitor,
  Link2,
  KeyRound,
} from 'lucide-react'
import type { ProjectLinks } from '@/types'
import { cn } from '@/lib/utils'

const linkConfig: { key: keyof ProjectLinks; label: string; icon: typeof ExternalLink; color: string }[] = [
  { key: 'salesforce', label: 'Salesforce', icon: Cloud, color: 'text-[#00A1E0]' },
  { key: 'jira', label: 'Jira', icon: Link2, color: 'text-[#0052CC]' },
  { key: 'slack', label: 'Slack', icon: MessageSquare, color: 'text-[#4A154B]' },
  { key: 'googleDrive', label: 'Google Drive', icon: FolderOpen, color: 'text-[#4285F4]' },
  { key: 'stagingSite', label: 'Staging', icon: Monitor, color: 'text-[var(--color-accent)]' },
  { key: 'liveSite', label: 'Live Site', icon: Globe, color: 'text-[var(--color-success)]' },
  { key: 'associationWebsite', label: 'Website', icon: Globe, color: 'text-[var(--color-muted-foreground)]' },
  { key: 'adminLogin', label: 'Admin', icon: KeyRound, color: 'text-[var(--color-warning)]' },
]

interface QuickLinksProps {
  links: ProjectLinks
  size?: 'sm' | 'lg'
}

export function QuickLinks({ links, size = 'lg' }: QuickLinksProps) {
  const available = linkConfig.filter((l) => links[l.key])

  if (available.length === 0) {
    return <p className="text-sm text-[var(--color-muted-foreground)]">No links configured</p>
  }

  return (
    <div className={cn('grid gap-3', size === 'lg' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-4 sm:grid-cols-8')}>
      {available.map(({ key, label, icon: Icon, color }) => (
        <a
          key={key}
          href={links[key]}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'glass flex flex-col items-center justify-center gap-2 rounded-[var(--radius-md)] p-4',
            'transition-[transform,background-color] duration-150 ease-[var(--ease-out)] active:scale-[0.97]',
            'hover:bg-[var(--color-card-solid)] group'
          )}
        >
          <Icon className={cn('h-5 w-5', color)} />
          <span className="text-xs font-medium text-[var(--color-muted-foreground)] group-hover:text-[var(--color-foreground)] transition-colors">
            {label}
          </span>
          <ExternalLink className="h-3 w-3 text-[var(--color-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
      ))}
    </div>
  )
}
