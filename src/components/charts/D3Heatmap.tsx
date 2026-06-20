import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { fmtNumber } from '@/lib/format';

export interface HeatCell { x: string; y: string; value: number }
export function D3Heatmap({ data, height = 300, format = (n: number) => fmtNumber(n, { short: true }) }:
  { data: HeatCell[]; height?: number; format?: (n: number) => string }) {
  const ref = useRef<SVGSVGElement | null>(null);
  useEffect(() => {
    const svg = d3.select(ref.current!);
    svg.selectAll('*').remove();
    if (!data.length) {
      svg.append('text').attr('x', '50%').attr('y', '50%').attr('text-anchor', 'middle').attr('fill', '#94a3b8').attr('font-size', 12).text('Sin datos');
      return;
    }
    const xs = Array.from(new Set(data.map((d) => d.x)));
    const ys = Array.from(new Set(data.map((d) => d.y)));
    const w = ref.current!.clientWidth || 480;
    const margin = { top: 24, right: 16, bottom: 40, left: 140 };
    const iw = w - margin.left - margin.right;
    const ih = height - margin.top - margin.bottom;
    const g = svg.attr('viewBox', `0 0 ${w} ${height}`).append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const x = d3.scaleBand<string>().domain(xs).range([0, iw]).padding(0.06);
    const y = d3.scaleBand<string>().domain(ys).range([0, ih]).padding(0.06);
    const max = d3.max(data, (d) => d.value) || 1;
    const color = d3.scaleSequential<string>(t => d3.interpolate('#eef0f6', '#01205e')(t)).domain([0, max]);
    g.append('g').call(d3.axisLeft(y).tickSize(0).tickPadding(8)).call((s) => s.select('.domain').remove())
      .selectAll('text').attr('font-size', 11).attr('fill', '#0f172a').attr('font-family', 'Geist, sans-serif');
    g.append('g').attr('transform', `translate(0,${ih})`).call(d3.axisBottom(x).tickSize(0).tickPadding(8)).call((s) => s.select('.domain').remove())
      .selectAll('text').attr('font-size', 11).attr('fill', '#0f172a').attr('font-family', 'Geist Mono, monospace');
    const cells = g.selectAll('rect').data(data).enter().append('rect')
      .attr('x', (d) => x(d.x) ?? 0).attr('y', (d) => y(d.y) ?? 0)
      .attr('width', x.bandwidth()).attr('height', y.bandwidth())
      .attr('fill', '#eef0f6').attr('rx', 3).attr('opacity', 0);
    cells.transition().duration(700).delay((_, i) => (i % xs.length) * 50 + Math.floor(i / xs.length) * 30).ease(d3.easeCubicOut)
      .attr('fill', (d) => color(d.value)).attr('opacity', 1);
    cells.append('title').text((d) => `${d.x} · ${d.y}: ${format(d.value)}`);
  }, [data, height, format]);
  return <svg ref={ref} className="w-full" style={{ height }} />;
}
