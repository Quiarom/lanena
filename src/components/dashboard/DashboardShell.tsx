import { cn } from '@/lib/cn';
import { Activity, BarChart3, Boxes, Database, FileBarChart2, Lightbulb, Map, Menu, Receipt, Rocket, ShoppingBag, Users, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';

export interface NavItem { id: string; label: string; icon: ReactNode; hidden?: boolean }

export const NAV: NavItem[] = [
  { id: 'resumen',     label: 'Resumen ejecutivo', icon: <BarChart3 size={15} /> },
  { id: 'ventas',      label: 'Ventas',            icon: <FileBarChart2 size={15} /> },
  { id: 'regiones',    label: 'Regiones / Estados', icon: <Map size={15} /> },
  { id: 'proveedores', label: 'Proveedores',       icon: <Boxes size={15} /> },
  { id: 'categorias',  label: 'Categorías',        icon: <ShoppingBag size={15} /> },
  { id: 'clientes',    label: 'Clientes',          icon: <Users size={15} /> },
  { id: 'cxc',         label: 'Cuentas por Cobrar', icon: <Receipt size={15} /> },
  { id: 'visitas',     label: 'Visitas',           icon: <Activity size={15} />, hidden: true },
  { id: 'explorador',  label: 'Explorador Excel',  icon: <Database size={15} /> },
  { id: 'hallazgos',   label: 'Hallazgos',         icon: <Lightbulb size={15} />, hidden: true },
  { id: 'roadmap',     label: 'Próximo paso',      icon: <Rocket size={15} />, hidden: true },
];

const VISIBLE_NAV = NAV.filter((n) => !n.hidden);

export function DashboardShell({
  current, onNavigate, fallback, period, source, children,
}: {
  current: string;
  onNavigate: (id: string) => void;
  fallback: boolean;
  period: string;
  source: string;
  children: ReactNode;
}) {
  const currentLabel = NAV.find((n) => n.id === current)?.label ?? '';
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = (id: string) => {
    onNavigate(id);
    setMobileNavOpen(false);
  };

  return (
    <div className="flex min-h-[100dvh] flex-col text-slate-900">
      {/* Sticky Header */}
      <header className="corp-header sticky top-0 z-40 relative text-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15 backdrop-blur-sm">
              <span className="font-bold tracking-[0.18em] text-[13px]">DN</span>
              <span className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-brand-sky animate-pulse-dot" />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[10px] uppercase tracking-[0.16em] text-white/60 sm:text-[11px] sm:tracking-[0.18em]">Droguería La Nena · Dronena</div>
              <div className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                Dashboard ejecutivo
                <span className="hidden sm:inline text-white/30">/</span>
                <span className="hidden min-w-0 truncate sm:inline text-white/70 font-normal">{currentLabel}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 ring-1 ring-white/10 text-white/80">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-sky animate-pulse-dot" /> {period}
            </span>
            <button
              type="button"
              aria-label={mobileNavOpen ? 'Cerrar navegación' : 'Abrir navegación'}
              aria-expanded={mobileNavOpen}
              aria-controls="dashboard-mobile-nav"
              onClick={() => setMobileNavOpen((open) => !open)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/15 transition-colors duration-200 hover:bg-white/16 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-sky lg:hidden"
            >
              {mobileNavOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
            </button>
          </div>
        </div>
        <div className="h-px w-full bg-gradient-to-r from-transparent via-brand-sky/60 to-transparent" />
      </header>

      {/* Main */}
      <div className="flex-1">
        <div className="mx-auto flex max-w-[1500px] gap-4 px-3 py-4 sm:px-4 sm:py-5">
          <aside className="hidden lg:block w-56 shrink-0">
            <nav className="sticky top-[84px] rounded-2xl border border-brand-line bg-white/70 backdrop-blur p-2 shadow-card">
              <div className="px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-400">Navegación</div>
              <ul className="space-y-0.5">
                {VISIBLE_NAV.map((n, i) => (
                  <li key={n.id} style={{ animationDelay: `${i * 35}ms` }} className="animate-fade-up">
                    <button
                      onClick={() => navigate(n.id)}
                      className={cn(
                        'group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] transition-all',
                        current === n.id
                          ? 'bg-brand-ink text-white shadow-glow'
                          : 'text-slate-600 hover:bg-brand-surface hover:text-brand-ink',
                      )}
                    >
                      <span className={cn('transition-transform group-hover:-translate-y-px', current === n.id ? 'text-white' : 'text-brand-blue')}>
                        {n.icon}
                      </span>
                      <span className="truncate">{n.label}</span>
                      {current === n.id && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-sky animate-pulse-dot" />}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-3 mx-1 rounded-xl border border-brand-line bg-brand-surface p-3">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Periodo</div>
                <div className="text-sm font-semibold text-brand-ink">{period}</div>
              </div>
            </nav>
          </aside>

          <main className="min-w-0 flex-1 space-y-4">
            <div className="lg:hidden -mt-1 rounded-2xl border border-brand-line bg-white/90 p-2 shadow-card backdrop-blur supports-[backdrop-filter]:bg-white/75">
              <button
                type="button"
                aria-expanded={mobileNavOpen}
                aria-controls="dashboard-mobile-nav"
                onClick={() => setMobileNavOpen((open) => !open)}
                className="flex w-full items-center justify-between gap-3 rounded-xl bg-brand-surface px-3 py-2.5 text-left text-sm text-brand-ink ring-1 ring-brand-line transition-colors duration-200 hover:bg-white active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
              >
                <span className="min-w-0">
                  <span className="block text-[10px] uppercase tracking-[0.18em] text-slate-400">Sección actual</span>
                  <span className="block truncate font-semibold">{currentLabel}</span>
                </span>
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-brand-blue ring-1 ring-brand-line">
                  {mobileNavOpen ? <X size={16} aria-hidden="true" /> : <Menu size={16} aria-hidden="true" />}
                </span>
              </button>

              <div
                id="dashboard-mobile-nav"
                className={cn(
                  'grid transition-[grid-template-rows,opacity] duration-200 ease-out',
                  mobileNavOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                )}
              >
                <div className="overflow-hidden">
                  <div className="grid grid-cols-1 gap-1 pt-2 sm:grid-cols-2">
                {VISIBLE_NAV.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => navigate(n.id)}
                    className={cn(
                      'flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors duration-200 active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue',
                      current === n.id
                        ? 'border-brand-ink bg-brand-ink text-white'
                        : 'border-brand-line bg-white text-slate-600 hover:border-brand-blue/30 hover:bg-brand-surface hover:text-brand-ink',
                    )}
                  >
                    <span className={cn('shrink-0', current === n.id ? 'text-white' : 'text-brand-blue')}>{n.icon}</span>
                    <span className="min-w-0 truncate text-left">{n.label}</span>
                  </button>
                ))}
                  </div>
                </div>
              </div>
            </div>
            <div key={current} className="animate-fade-up">{children}</div>
          </main>
        </div>
      </div>

      {/* Sticky Footer */}
      <footer className="sticky bottom-0 z-30 border-t border-brand-line bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-[11px]">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="inline-flex h-2 w-2 rounded-full bg-brand-ok animate-pulse-dot" />
            <span className="font-medium text-brand-ink">Droguería La Nena · 40 años</span>
            <span className="text-slate-300">·</span>
            <span>Prototipo consultivo</span>
          </div>
          <div className="flex items-center gap-3 text-slate-500 font-mono">
            <span className="hidden sm:inline">noindex,nofollow</span>
            <span className="text-slate-300">·</span>
            <span>Datos comerciales sensibles · Distribución restringida</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
