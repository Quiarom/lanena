import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { fmtNumber } from '@/lib/format';

export interface LinePoint { key: string; value: number }
export function D3LineChart({ data, height = 240, format = (n: number) => fmtNumber(n, { short: true }), color = '#01205e' }:
  { data: LinePoint[]; height?: number; format?: (n: number) => string; color?: string }) {
  const ref = useRef<SVGSVGElement | null>(null);
  useEffect(() => {
    const svg = d3.select(ref.current!);
    svg.selectAll('*').remove();
    if (data.length < 2) {
      svg.append('text').attr('x', '50%').attr('y', '50%').attr('text-anchor', 'middle').attr('fill', '#94a3b8').attr('font-size', 12).text('Sin datos');
      return;
    }
    const w = ref.current!.clientWidth || 480;
    const margin = { top: 14, right: 14, bottom: 30, left: 50 };
    const iw = w - margin.left - margin.right;
    const ih = height - margin.top - margin.bottom;
    const g = svg.attr('viewBox', `0 0 ${w} ${height}`).append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const defs = svg.append('defs');
    const fid = `area-${Math.random().toString(36).slice(2, 8)}`;
    const fg = defs.append('linearGradient').attr('id', fid).attr('x1', '0').attr('x2', '0').attr('y1', '0').attr('y2', '1');
    fg.append('stop').attr('offset', '0').attr('stop-color', color).attr('stop-opacity', 0.28);
    fg.append('stop').attr('offset', '1').attr('stop-color', color).attr('stop-opacity', 0);

    const x = d3.scalePoint<string>().domain(data.map((d) => d.key)).range([0, iw]).padding(0.4);
    const y = d3.scaleLinear().domain([d3.min(data, (d) => d.value) ?? 0, d3.max(data, (d) => d.value) ?? 1]).range([ih, 0]).nice();

    g.append('g').attr('transform', `translate(0,${ih})`).call(d3.axisBottom(x).tickSizeOuter(0).tickPadding(8))
      .call((s) => s.select('.domain').attr('stroke', '#e2e8f0'))
      .call((s) => s.selectAll('.tick line').attr('stroke', '#e2e8f0'))
      .selectAll('text').attr('font-size', 10).attr('fill', '#64748b').attr('font-family', 'Geist Mono, monospace');
    g.append('g').call(d3.axisLeft(y).ticks(4).tickFormat((d) => format(Number(d))).tickSize(0).tickPadding(8))
      .call((s) => s.select('.domain').remove())
      .selectAll('text').attr('font-size', 10).attr('fill', '#94a3b8').attr('font-family', 'Geist Mono, monospace');
    g.selectAll('.grid').data(y.ticks(4)).enter().append('line')
      .attr('x1', 0).attr('x2', iw).attr('y1', (d) => y(d)).attr('y2', (d) => y(d))
      .attr('stroke', '#eef0f6').attr('stroke-dasharray', '3,4');

    const line = d3.line<LinePoint>().x((d) => x(d.key) ?? 0).y((d) => y(d.value)).curve(d3.curveMonotoneX);
    const area = d3.area<LinePoint>().x((d) => x(d.key) ?? 0).y0(ih).y1((d) => y(d.value)).curve(d3.curveMonotoneX);

    const ap = g.append('path').datum(data).attr('fill', `url(#${fid})`).attr('opacity', 0).attr('d', area as any);
    ap.transition().duration(700).delay(400).attr('opacity', 1);

    const path = g.append('path').datum(data).attr('fill', 'none').attr('stroke', color).attr('stroke-width', 2.5).attr('stroke-linecap', 'round').attr('d', line as any);
    const total = (path.node() as SVGPathElement).getTotalLength();
    path.attr('stroke-dasharray', `${total} ${total}`).attr('stroke-dashoffset', total)
      .transition().duration(1100).ease(d3.easeCubicInOut).attr('stroke-dashoffset', 0);

    const dots = g.selectAll('circle').data(data).enter().append('circle')
      .attr('cx', (d) => x(d.key) ?? 0).attr('cy', (d) => y(d.value))
      .attr('r', 0).attr('fill', 'white').attr('stroke', color).attr('stroke-width', 2);
    dots.transition().duration(400).delay((_, i) => 900 + i * 60).attr('r', 3.5);
    dots.append('title').text((d) => `${d.key}: ${format(d.value)}`);
  }, [data, height, format, color]);
  return <svg ref={ref} className="w-full" style={{ height }} />;
}
