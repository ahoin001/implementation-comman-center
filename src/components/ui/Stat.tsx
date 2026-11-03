export function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <dt className="font-[family-name:var(--mono)] text-[11.5px] tracking-[0.14em] uppercase text-[var(--ink-3)]">{label}</dt>
      <dd className="font-[family-name:var(--display)] text-[26px] font-medium tracking-[-0.04em] tabular-nums text-[var(--ink)]">{value}</dd>
    </div>
  )
}
