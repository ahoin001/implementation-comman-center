export function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <dt className="text-[11px] text-[var(--color-ink-soft)]">{label}</dt>
      <dd className="text-xl font-semibold tabular-nums tracking-tight text-[var(--color-ink)]">{value}</dd>
    </div>
  )
}
