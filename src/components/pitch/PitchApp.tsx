import { useEffect, useRef } from 'react';
import { SlideResumen } from './slides/SlideResumen';
import { SlideVentasCuota } from './slides/SlideVentasCuota';
import { SlideMixRegional } from './slides/SlideMixRegional';
import { SlideTopRegiones } from './slides/SlideTopRegiones';
import { SlideCategorias } from './slides/SlideCategorias';
import { SlideTopClientes } from './slides/SlideTopClientes';
import { SlideCxC } from './slides/SlideCxC';
import { SlideVisitas } from './slides/SlideVisitas';
import { SlideCobranza } from './slides/SlideCobranza';

export interface SlideMeta { id: string; num: string; label: string }

export const SLIDES: SlideMeta[] = [
  { id: 'resumen',     num: '01', label: 'Resumen' },
  { id: 'ventas',      num: '02', label: 'Ventas vs cuota' },
  { id: 'mix',         num: '03', label: 'Mix regional' },
  { id: 'top-regiones',num: '04', label: 'Top regiones' },
  { id: 'categorias',  num: '05', label: 'Categorías' },
  { id: 'clientes',    num: '06', label: 'Top clientes' },
  { id: 'cxc',         num: '07', label: 'Cuentas por cobrar' },
  { id: 'visitas',     num: '08', label: 'Visitas' },
  { id: 'cobranza',    num: '09', label: 'Tendencia cobranza' },
];

async function exportPDF() {
  const btn = document.querySelector<HTMLButtonElement>('[data-export-pdf]');

  if (btn) {
    btn.disabled = true;
    btn.dataset.exporting = 'true';
  }

  try {
    const [{ toCanvas }, { jsPDF }] = await Promise.all([
      import('html-to-image'),
      import('jspdf').then((m) => ({ jsPDF: m.jsPDF ?? (m as any).default })),
    ]);

    const slides = Array.from(document.querySelectorAll<HTMLElement>('.pitch-lamina'));
    if (!slides.length) return;

    const hidden = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-visible), [data-reveal-stagger]:not(.is-visible)'));
    hidden.forEach((el) => el.classList.add('is-visible'));

    const first = slides[0];
    const pageW = first.offsetWidth;
    const pageH = first.scrollHeight;
    const landscape = pageW >= pageH;

    const pdf = new jsPDF({ orientation: landscape ? 'landscape' : 'portrait', unit: 'px', format: [pageW, pageH] });

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const canvas = await toCanvas(slide, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });

      if (i > 0) {
        const w = slide.offsetWidth;
        const h = slide.scrollHeight;
        pdf.addPage([w, h], w >= h ? 'landscape' : 'portrait');
      }

      const img = canvas.toDataURL('image/jpeg', 0.93);
      pdf.addImage(img, 'JPEG', 0, 0, slide.offsetWidth, slide.scrollHeight);
    }

    pdf.save('dronena-cierre-mayo-2026.pdf');
  } finally {
    if (btn) { btn.disabled = false; delete btn.dataset.exporting; }
  }
}

export default function PitchApp() {
  const currentRef = useRef<string>('resumen');

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const revealItems = document.querySelectorAll<HTMLElement>('[data-reveal], [data-reveal-stagger]');
    if (reduce || !('IntersectionObserver' in window)) {
      revealItems.forEach((el) => el.classList.add('is-visible'));
    } else {
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add('is-visible');
              obs.unobserve(e.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -10% 0px' },
      );
      revealItems.forEach((el) => obs.observe(el));
    }

    const navButtons = document.querySelectorAll<HTMLButtonElement>('[data-pitch-nav]');
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-pitch-slide]'));

    const setCurrent = (id: string) => {
      currentRef.current = id;
      navButtons.forEach((b) => b.setAttribute('aria-current', b.dataset.pitchNav === id ? 'true' : 'false'));
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setCurrent((e.target as HTMLElement).dataset.pitchSlide ?? '');
        });
      },
      { threshold: 0.4 },
    );
    sections.forEach((s) => io.observe(s));

    const onKey = (event: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement)?.tagName)) return;
      const idx = SLIDES.findIndex((s) => s.id === currentRef.current);
      let next = idx;
      if (event.key === 'ArrowDown' || event.key === 'PageDown' || event.key === 'ArrowRight') next = Math.min(SLIDES.length - 1, idx + 1);
      if (event.key === 'ArrowUp' || event.key === 'PageUp' || event.key === 'ArrowLeft') next = Math.max(0, idx - 1);
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = SLIDES.length - 1;
      if (next !== idx) {
        event.preventDefault();
        document.getElementById(`lamina-${SLIDES[next].id}`)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      }
    };
    document.addEventListener('keydown', onKey);

    navButtons.forEach((b) => {
      b.addEventListener('click', () => {
        const id = b.dataset.pitchNav;
        document.getElementById(`lamina-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const navList = document.querySelector<HTMLElement>('[data-nav-list]');
        const navToggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]');
        if (navList && navToggle) {
          navList.classList.remove('is-open');
          navToggle.setAttribute('aria-expanded', 'false');
        }
      });
    });

    const navToggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]');
    const navList = document.querySelector<HTMLElement>('[data-nav-list]');
    navToggle?.addEventListener('click', () => {
      const isOpen = navList?.classList.toggle('is-open') ?? false;
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    const exportBtn = document.querySelector<HTMLButtonElement>('[data-export-pdf]');
    exportBtn?.addEventListener('click', exportPDF);

    return () => { document.removeEventListener('keydown', onKey); };
  }, []);

  return (
    <>
      <div className="pitch-stage">
        <div id="lamina-resumen" data-pitch-slide="resumen"><SlideResumen /></div>
        <div id="lamina-ventas" data-pitch-slide="ventas"><SlideVentasCuota /></div>
        <div id="lamina-mix" data-pitch-slide="mix"><SlideMixRegional /></div>
        <div id="lamina-top-regiones" data-pitch-slide="top-regiones"><SlideTopRegiones /></div>
        <div id="lamina-categorias" data-pitch-slide="categorias"><SlideCategorias /></div>
        <div id="lamina-clientes" data-pitch-slide="clientes"><SlideTopClientes /></div>
        <div id="lamina-cxc" data-pitch-slide="cxc"><SlideCxC /></div>
        <div id="lamina-visitas" data-pitch-slide="visitas"><SlideVisitas /></div>
        <div id="lamina-cobranza" data-pitch-slide="cobranza"><SlideCobranza /></div>
      </div>

      <footer className="pitch-foot">
        <span className="pitch-foot__brand"><span>DN</span> Dronena · Cierre comercial Mayo 2026</span>
        <span>Datos generados desde el Excel del cierre · Presentacion de los datos del Dashboard</span>
      </footer>
    </>
  );
}
