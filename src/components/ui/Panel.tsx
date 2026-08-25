import type { ReactNode } from 'react'

interface PanelProps {
  title?: string
  right?: ReactNode
  children: ReactNode
  className?: string
  bezel?: boolean
  accent?: string
}

export function Panel({ title, right, children, className = '', bezel = false, accent }: PanelProps) {
  return (
    <section
      className={`ui-panel relative border border-hairline bg-panel ${className}`}
      style={accent ? { borderTopColor: accent } : undefined}
    >
      {bezel && <BezelTicks />}
      {title && (
        <header className="panel-header flex items-center justify-between border-b border-hairline px-3 py-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">{title}</h2>
          {right}
        </header>
      )}
      <div className="p-3">{children}</div>
    </section>
  )
}

function BezelTicks() {
  const common = 'absolute h-3 w-3 border-muted/40 z-20'
  return (
    <>
      <span className={`${common} left-1 top-1 border-l border-t`} />
      <span className={`${common} right-1 top-1 border-r border-t`} />
      <span className={`${common} bottom-1 left-1 border-b border-l`} />
      <span className={`${common} bottom-1 right-1 border-b border-r`} />
    </>
  )
}
