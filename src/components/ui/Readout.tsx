interface ReadoutProps {
  label: string
  value: string
  unit?: string
  color?: string
  sub?: string
  align?: 'left' | 'center'
}

/** Instrumentation-style numeric readout: label + monospace value. */
export function Readout({
  label,
  value,
  unit,
  color,
  sub,
  align = 'left',
}: ReadoutProps) {
  return (
    <div className={align === 'center' ? 'text-center' : ''}>
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted">
        {label}
      </div>
      <div className="flex items-baseline gap-1" style={{ justifyContent: align === 'center' ? 'center' : undefined }}>
        <span
          className="tabnum text-lg font-medium leading-tight"
          style={{ color: color ?? 'var(--text-primary)' }}
        >
          {value}
        </span>
        {unit && <span className="text-[10px] text-muted">{unit}</span>}
      </div>
      {sub && <div className="text-[10px] text-muted">{sub}</div>}
    </div>
  )
}
