import { Card, CardHeader } from '@/components/ui/Card';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const phases = [
  { n: '01', title: 'Ordenar KPIs y fuentes', text: 'Definir indicador, fórmula, fuente oficial y dueño.' },
  { n: '02', title: 'Prototipo dashboard ejecutivo', text: 'Una vista por audiencia: gerencia, comercial, finanzas.' },
  { n: '03', title: 'Automatización Excel/Odoo/Power BI', text: 'Pipeline reproducible: extracción, modelo, dashboard.' },
  { n: '04', title: 'Capacitación y mejora continua', text: 'Ritmo de revisión mensual y backlog de iteraciones.' },
];

export function RoadmapPanel() {
  return (
    <Card>
      <CardHeader title="Siguiente paso recomendado" subtitle="Sprint de mejora comercial · 10 días" />
      <p className="text-[13px] text-slate-600 mb-5 max-w-3xl leading-relaxed">
        Sprint para ordenar KPIs, rediseñar el cierre mensual y crear un dashboard ejecutivo conectado al flujo real de datos.
      </p>
      <ol className="stagger grid md:grid-cols-2 gap-3 mb-5">
        {phases.map((p) => (
          <li key={p.n} className="group relative flex gap-3 overflow-hidden rounded-xl border border-brand-line bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-glow">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-ink text-white font-mono text-[12px] font-semibold">
              {p.n}
            </div>
            <div>
              <div className="text-sm font-semibold text-brand-ink tracking-tight flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-500" /> {p.title}
              </div>
              <p className="text-[12.5px] text-slate-600 mt-1 leading-relaxed">{p.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap items-center gap-3">
        <a
          href="mailto:?subject=Sprint%20de%20mejora%20comercial%20Dronena"
          className="group inline-flex items-center gap-2 rounded-lg bg-brand-ink px-4 py-2 text-sm font-medium text-white shadow-glow transition-all hover:-translate-y-0.5 hover:bg-brand-dark"
        >
          Proponer sprint inicial
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </a>
        <span className="text-[11px] text-slate-500 font-mono">prototipo consultivo · cierre mayo 2026</span>
      </div>
    </Card>
  );
}
