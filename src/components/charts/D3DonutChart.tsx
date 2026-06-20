import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { fmtNumber } from '@/lib/format';

export interface DonutDatum { key: string; value: number }

const PALETTE = ['#01205e', '#1f5dc9', '#3aa0e6', '#0a9a55', '#d98a14', '#7c3aed', '#c8232c', '#0f766e', '#64748b'];

export function D3DonutChart({ data, size: propSize = 240, format = (n: number) => fmtNumber(n, { short: true }) }:
  { data: DonutDatum[]; size?: number; format?: (n: number) => string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const ref = useRef<SVGSVGElement | null>(null);
  const [size, setSize] = useState(propSize);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const update = () => {
      const w = container.clientWidth;
      setSize(Math.min(propSize, w - 16));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(container);
    return () => ro.disconnect();
  }, [propSize]);

  useEffect(() => {
    const svg = d3.select(ref.current!);
    svg.selectAll('*').remove();
    if (!data.length || data.every((d) => d.value === 0)) {
      svg.append('text').attr('x', '50%').attr('y', '50%').attr('text-anchor', 'middle').attr('fill', '#94a3b8').attr('font-size', 12).text('Sin datos');
      return;
    }
    const r = size / 2;
    const ir = r * 0.66;
    const g = svg.attr('viewBox', `0 0 ${size} ${size}`).append('g').attr('transform', `translate(${r},${r})`);

    const pie = d3.pie<DonutDatum>().value((d) => d.value).sort(null).padAngle(0.012);
    const arc = d3.arc<d3.PieArcDatum<DonutDatum>>().innerRadius(ir).outerRadius(r - 6).cornerRadius(3);

    const arcs = g.selectAll('path').data(pie(data)).enter().append('path')
      .attr('fill', (_, i) => PALETTE[i % PALETTE.length])
      .attr('stroke', 'white').attr('stroke-width', 2);

    arcs.transition().duration(900).delay((_, i) => i * 70).ease(d3.easeCubicOut)
      .attrTween('d', function (d) {
        const i = d3.interpolate({ startAngle: 0, endAngle: 0 } as any, d);
        return (t) => arc(i(t)) as string;
      });
    arcs.append('title').text((d) => `${d.data.key}: ${format(d.data.value)}`);

    const total = d3.sum(data, (d) => d.value);
    const center = g.append('g').attr('opacity', 0);
    center.transition().delay(700).duration(400).attr('opacity', 1);
    center.append('text').attr('text-anchor', 'middle').attr('dy', -2).attr('fill', '#94a3b8').attr('font-size', 10).attr('letter-spacing', '0.12em').text('TOTAL');
    center.append('text').attr('text-anchor', 'middle').attr('dy', 18).attr('fill', '#01205e').attr('font-size', 18).attr('font-weight', 600).attr('font-family', 'Geist Mono, monospace').text(format(total));
  }, [data, size, format]);
  return (
    <div ref={containerRef} className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
      <svg ref={ref} style={{ width: size, height: size, flexShrink: 0 }} />
      <ul className="text-xs space-y-1.5 stagger">
        {data.slice(0, 8).map((d, i) => (
          <li key={d.key} className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: PALETTE[i % PALETTE.length] }} />
            <span className="text-slate-600 truncate max-w-[16ch]">{d.key}</span>
            <span className="ml-auto font-mono text-slate-800 tab-num">{format(d.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
