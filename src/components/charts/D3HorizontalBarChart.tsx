import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { fmtNumber } from '@/lib/format';

export interface HBarDatum { key: string; value: number; meta?: string }

export function D3HorizontalBarChart({ data, height, format = (n: number) => fmtNumber(n, { short: true }), color = '#01205e' }:
  { data: HBarDatum[]; height?: number; format?: (n: number) => string; color?: string }) {
  const ref = useRef<SVGSVGElement | null>(null);
  const h = height ?? Math.max(180, data.length * 30 + 20);
  useEffect(() => {
    const svg = d3.select(ref.current!);
    svg.selectAll('*').remove();
    if (!data.length) {
      svg.append('text').attr('x', '50%').attr('y', '50%').attr('text-anchor', 'middle').attr('fill', '#94a3b8').attr('font-size', 12).text('Sin datos');
      return;
    }
    const w = ref.current!.clientWidth || 480;
    const margin = { top: 8, right: 72, bottom: 8, left: 140 };
    const iw = w - margin.left - margin.right;
    const ih = h - margin.top - margin.bottom;
    const g = svg.attr('viewBox', `0 0 ${w} ${h}`).append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const defs = svg.append('defs');
    const gid = `hgrad-${Math.random().toString(36).slice(2, 8)}`;
    const grad = defs.append('linearGradient').attr('id', gid).attr('x1', '0').attr('x2', '1');
    grad.append('stop').attr('offset', '0').attr('stop-color', color).attr('stop-opacity', 0.92);
    grad.append('stop').attr('offset', '1').attr('stop-color', color).attr('stop-opacity', 0.55);

    const y = d3.scaleBand<string>().domain(data.map((d) => d.key)).range([0, ih]).padding(0.25);
    const xmax = d3.max(data, (d) => d.value) || 1;
    const x = d3.scaleLinear().domain([0, xmax * 1.12]).range([0, iw]);

    g.append('g').call(d3.axisLeft(y).tickSize(0).tickPadding(8))
      .call((sel) => sel.select('.domain').remove())
      .selectAll('text').attr('font-size', 11).attr('fill', '#0f172a').attr('font-family', 'Geist, sans-serif');

    // backdrop tracks
    g.selectAll('.track').data(data).enter().append('rect')
      .attr('x', 0).attr('y', (d) => y(d.key) ?? 0)
      .attr('height', y.bandwidth()).attr('width', iw)
      .attr('fill', '#f1f3f9').attr('rx', 4);

    const bars = g.selectAll('rect.bar').data(data).enter().append('rect').attr('class', 'bar')
      .attr('x', 0).attr('y', (d) => y(d.key) ?? 0)
      .attr('height', y.bandwidth()).attr('width', 0)
      .attr('fill', `url(#${gid})`).attr('rx', 4);
    bars.transition().duration(900).delay((_, i) => i * 70).ease(d3.easeCubicOut)
      .attr('width', (d) => x(d.value));
    bars.append('title').text((d) => `${d.key}: ${format(d.value)}`);

    const labels = g.selectAll('.lbl').data(data).enter().append('text')
      .attr('y', (d) => (y(d.key) ?? 0) + y.bandwidth() / 2 + 4)
      .attr('font-size', 11).attr('fill', '#01205e').attr('font-family', 'Geist Mono, monospace')
      .attr('opacity', 0)
      .text((d) => format(d.value));
    labels.attr('x', 6)
      .transition().duration(900).delay((_, i) => i * 70 + 250).ease(d3.easeCubicOut)
      .attr('x', (d) => x(d.value) + 8).attr('opacity', 1);
  }, [data, h, format, color]);
  return <svg ref={ref} className="w-full" style={{ height: h }} />;
}
