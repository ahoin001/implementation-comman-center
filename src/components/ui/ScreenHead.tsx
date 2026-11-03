import type { ReactNode } from 'react'

export function ScreenHead({
  title,
  sub,
  children,
}: {
  title: string
  sub?: ReactNode
  children?: ReactNode
}) {
  return (
    <header className="screen-head icc-chrome card-w">
      <div className="min-w-0">
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {children}
    </header>
  )
}
