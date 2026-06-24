import type { ReactNode } from 'react';

export interface SlideShellProps {
  num: string;
  eyebrow: string;
  title?: string;
  right?: ReactNode;
  children: ReactNode;
}

export function SlideShell({ num, eyebrow, title, right, children }: SlideShellProps) {
  return (
    <section className="pitch-lamina">
      <header className="pitch-lamina__head">
        <div>
          <span className="pitch-lamina__num"><i>{num}</i> {eyebrow}</span>
          {title && <h2>{title}</h2>}
        </div>
        {right && <div className="pitch-lamina__right">{right}</div>}
      </header>
      <div className="pitch-lamina__body">{children}</div>
    </section>
  );
}

export function Insight({ children }: { children: ReactNode }) {
  return (
    <div className="pitch-insight" data-reveal>
      <svg className="pitch-insight__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2a7 7 0 0 0-4 12.7V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.3A7 7 0 0 0 12 2Z" />
        <path d="M9 22h6" />
      </svg>
      <div>
        <h4>Insight</h4>
        <p>{children}</p>
      </div>
    </div>
  );
}

export function Action({ children }: { children: ReactNode }) {
  return (
    <div className="pitch-action" data-reveal>
      <svg className="pitch-action__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 13l4 4L19 7" />
      </svg>
      <div>
        <h4>Accionable</h4>
        <p>{children}</p>
      </div>
    </div>
  );
}

export interface KpiItem {
  label: string;
  value: string;
  caption?: string;
  tone?: 'ok' | 'warn' | 'alert' | 'neutral';
  bar?: number;
  topColor?: string;
}

export function KpiRow({ items }: { items: KpiItem[] }) {
  return (
    <div className="pitch-kpi-row" data-reveal-stagger>
      {items.map((it) => (
        <div key={it.label} className={`pitch-kpi ${it.tone && it.tone !== 'neutral' ? `pitch-kpi--${it.tone}` : ''}`} style={it.topColor ? { borderTopColor: it.topColor } : undefined}>
          <div className="pitch-kpi__label">{it.label}</div>
          <div className="pitch-kpi__value tab-num">{it.value}</div>
          {it.caption && <div className="pitch-kpi__caption">{it.caption}</div>}
          {typeof it.bar === 'number' && (
            <div className="pitch-kpi__bar"><span style={{ width: `${Math.max(0, Math.min(100, it.bar))}%` }} /></div>
          )}
        </div>
      ))}
    </div>
  );
}

export function SourceBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {label}
    </span>
  );
}
