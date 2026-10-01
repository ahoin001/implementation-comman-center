import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Panel } from '@/components/ui/Panel'

export function EmptyState({ children, className }: { children: ReactNode; className?: string }) {
  return <Panel className={cn('p-12 text-center', className)}>{children}</Panel>
}
