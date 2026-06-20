import { Card, CardHeader } from '@/components/ui/Card';
import { Lightbulb, Target, FileBarChart2, GitMerge, RefreshCcw } from 'lucide-react';

const findings = [
  { icon: <Lightbulb size={18} />, accent: '#d98a14', title: 'La data existe; la oportunidad está en convertirla en decisiones.',
    text: 'El cierre ya contiene ventas, cuotas, regiones, proveedores, clientes, cobranza y visitas. El siguiente salto es conectar esos bloques para que cada KPI tenga insight y acción.' },
  { icon: <FileBarChart2 size={18} />, accent: '#1f5dc9', title: 'Menos tablas densas, más lectura ejecutiva.',
    text: 'Cada vista debería responder: qué pasó, dónde pasó, por qué importa y qué acción tomar.' },
  { icon: <Target size={18} />, accent: '#01205e', title: 'Fuente oficial por KPI.',
    text: 'Conviene documentar qué número es oficial, de dónde sale, cuándo se actualiza y qué filtros aplica.' },
  { icon: <GitMerge size={18} />, accent: '#0a9a55', title: 'Cruzar ventas, visitas y cobranza.',
    text: 'Las mejores decisiones aparecen al cruzar ejecución comercial con resultado y riesgo: dónde se visita, cuánto se vende y cuánto se cobra.' },
  { icon: <RefreshCcw size={18} />, accent: '#3aa0e6', title: 'Automatizar el cierre mensual.',
    text: 'El flujo ideal puede ser: Odoo/Excel → modelo limpio → dashboard → presentación ejecutiva.' },
];

export function InsightPanel() {
  return (
    <Card>
      <CardHeader title="Cómo hacerlo mejor" subtitle="Hallazgos consultivos sobre el cierre actual" />
      <div className="stagger grid md:grid-cols-2 gap-3">
        {findings.map((f, i) => (
          <div key={i} className="group relative overflow-hidden rounded-xl border border-brand-line bg-white p-4 transition-transform duration-300 hover:-translate-y-0.5">
            <span className="absolute left-0 top-0 h-full w-0.5" style={{ background: f.accent }} />
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: `${f.accent}14`, color: f.accent }}>
                {f.icon}
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-400">Hallazgo {i + 1}</div>
                <div className="mt-0.5 text-sm font-semibold text-brand-ink tracking-tight">{f.title}</div>
                <p className="mt-1.5 text-[12.5px] text-slate-600 leading-relaxed">{f.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
