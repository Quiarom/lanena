import { SlideShell, SourceBadge } from '../SlideShell';

type Owner = 'now' | 'week' | 'month';

interface Accionable {
  n: string;
  title: string;
  desc: string;
  owner: Owner;
  ownerLabel: string;
}

const items: Accionable[] = [
  {
    n: '01',
    title: 'Convocar mesa comercial regional esta semana',
    desc: 'Las cinco regiones cierran debajo de cuota. Reunir a los jefes regionales con titular claro, revisar plan de recupero de la brecha de $4.1M y asignar responsables por region.',
    owner: 'now',
    ownerLabel: 'Esta semana',
  },
  {
    n: '02',
    title: 'Plan especifico para Centro Este',
    desc: 'Es la region mas grande y la que mas explica la brecha total. Definir plan de cuenta por cuenta del top 10 de clientes y meta realista de cuota para junio.',
    owner: 'now',
    ownerLabel: 'Esta semana',
  },
  {
    n: '03',
    title: 'Plan de cobranza para la cartera +90 días',
    desc: 'Reducir el tramo mayor a 90 días en 40% en 60 días. Visita conjunta de credito, cobranza y fuerza de ventas; acuerdos de pago y suspension preventiva.',
    owner: 'week',
    ownerLabel: 'Proximos 7-14 dias',
  },
  {
    n: '04',
    title: 'Reasignar rutas para cumplir plan de visitas',
    desc: 'La region con menor cumplimiento requiere reasignacion de rutas. Repriorizar agenda de la fuerza de ventas; reportar avance semanal.',
    owner: 'week',
    ownerLabel: 'Proximos 7-14 dias',
  },
  {
    n: '05',
    title: 'Revisar concentracion de top 5 clientes',
    desc: 'Asignar ejecutivo de cuenta por cliente del top 5; revisar salud de cartera, cobranza y frecuencia de visita. Definir plan trimestral con meta y plan B por cliente.',
    owner: 'month',
    ownerLabel: 'Este mes',
  },
];

const ownerClass: Record<Owner, string> = {
  now: 'pitch-actionable__owner--now',
  week: 'pitch-actionable__owner--week',
  month: 'pitch-actionable__owner--month',
};

export function SlideAccionables() {
  return (
    <SlideShell
      num="10"
      eyebrow="Accionables priorizados · Mayo 2026"
      title="Cinco decisiones para ejecutar esta semana, este mes y este trimestre."
      right={<SourceBadge label="Cierre comercial · Mayo 2026" />}
    >
      <div className="pitch-actionable-list" data-reveal-stagger>
        {items.map((it) => (
          <article key={it.n} className="pitch-actionable">
            <span className="pitch-actionable__num">{it.n}</span>
            <div>
              <h3>{it.title}</h3>
              <p>{it.desc}</p>
            </div>
            <span className={`pitch-actionable__owner ${ownerClass[it.owner]}`}>{it.ownerLabel}</span>
          </article>
        ))}
      </div>
    </SlideShell>
  );
}
