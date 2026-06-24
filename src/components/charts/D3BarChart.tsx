import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { fmtNumber } from '@/lib/format';

export interface BarDatum { key: string; value: number; compare?: number }

export function D3BarChart({ data, height = 260, format = (n: number) => fmtNumber(n, { short: true }), colorA = '#01205e', colorB = '#3aa0e6' }:
  { data: BarDatum[]; height?: number; format?: (n: number) => string; colorA?: string; colorB?: string }) {
  const ref = useRef<SVGSVGElement | null>(null);
  useEffect(() => {
    const svg = d3.select(ref.current!);
    svg.selectAll('*').remove();
    if (!data.length) {
      svg.append('text').attr('x', '50%').attr('y', '50%').attr('text-anchor', 'middle').attr('fill', '#94a3b8').attr('font-size', 12).text('Sin datos');
      return;
    }
    const w = ref.current!.clientWidth || 480;
    const margin = { top: 28, right: 14, bottom: 38, left: 50 };
    const iw = w - margin.left - margin.right;
    const ih = height - margin.top - margin.bottom;
    const g = svg.attr('viewBox', `0 0 ${w} ${height}`).append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const defs = svg.append('defs');
    const grad = defs.append('linearGradient').attr('id', 'bar-grad-a').attr('x1', '0').attr('x2', '0').attr('y1', '0').attr('y2', '1');
    grad.append('stop').attr('offset', '0').attr('stop-color', colorA).attr('stop-opacity', 1);
    grad.append('stop').attr('offset', '1').attr('stop-color', colorA).attr('stop-opacity', 0.7);
    const grad2 = defs.append('linearGradient').attr('id', 'bar-grad-b').attr('x1', '0').attr('x2', '0').attr('y1', '0').attr('y2', '1');
    grad2.append('stop').attr('offset', '0').attr('stop-color', colorB).attr('stop-opacity', 0.95);
    grad2.append('stop').attr('offset', '1').attr('stop-color', colorB).attr('stop-opacity', 0.65);

    const x = d3.scaleBand<string>().domain(data.map((d) => d.key)).range([0, iw]).padding(0.28);
    const ymax = d3.max(data, (d) => Math.max(d.value, d.compare ?? 0)) || 1;
    const y = d3.scaleLinear().domain([0, ymax * 1.08]).range([ih, 0]).nice();

    g.append('g').attr('transform', `translate(0,${ih})`).call(d3.axisBottom(x).tickSizeOuter(0).tickPadding(8))
      .call((sel) => sel.select('.domain').remove())
      .selectAll('text').attr('font-size', 11).attr('fill', '#475569').attr('font-family', 'Geist, sans-serif');

    g.append('g').call(d3.axisLeft(y).ticks(5).tickSizeOuter(0).tickFormat((v) => format(Number(v))))
      .call((sel) => sel.select('.domain').remove())
      .selectAll('text').attr('font-size', 10).attr('fill', '#94a3b8');

    g.selectAll('.grid').data(y.ticks(5)).enter().append('line')
      .attr('x1', 0).attr('x2', iw).attr('y1', (d) => y(d)).attr('y2', (d) => y(d))
      .attr('stroke', '#e2e8f0').attr('stroke-dasharray', '3,3');

    const hasCompare = data.some((d) => d.compare !== undefined);
    const bw = hasCompare ? x.bandwidth() / 2 - 2 : x.bandwidth();

    const bars1 = g.selectAll('.bar1').data(data).enter().append('rect')
      .attr('x', (d) => x(d.key) ?? 0)
      .attr('width', bw)
      .attr('y', ih).attr('height', 0)
      .attr('fill', 'url(#bar-grad-a)').attr('rx', 3);
    bars1.transition().duration(900).delay((_, i) => i * 60).ease(d3.easeCubicOut)
      .attr('y', (d) => y(d.value)).attr('height', (d) => ih - y(d.value));
    bars1.append('title').text((d) => `${d.key}: ${format(d.value)}`);

    // value labels above bars1
    g.selectAll('.lbl1').data(data).enter().append('text')
      .attr('class', 'lbl1')
      .attr('x', (d) => (x(d.key) ?? 0) + bw / 2)
      .attr('y', ih)
      .attr('text-anchor', 'middle')
      .attr('font-size', 11)
      .attr('font-family', 'Geist Mono, monospace')
      .attr('fill', '#01205e')
      .attr('opacity', 0)
      .text((d) => ih - y(d.value) >= 20 ? format(d.value) : '')
      .transition().duration(700).delay((_, i) => i * 60 + 300).ease(d3.easeCubicOut)
      .attr('y', (d) => y(d.value) - 5)
      .attr('opacity', 1);

    if (hasCompare) {
      const bars2 = g.selectAll('.bar2').data(data).enter().append('rect')
        .attr('x', (d) => (x(d.key) ?? 0) + x.bandwidth() / 2 + 2)
        .attr('width', bw)
        .attr('y', ih).attr('height', 0)
        .attr('fill', 'url(#bar-grad-b)').attr('rx', 3);
      bars2.transition().duration(900).delay((_, i) => i * 60 + 120).ease(d3.easeCubicOut)
        .attr('y', (d) => y(d.compare ?? 0)).attr('height', (d) => ih - y(d.compare ?? 0));
      bars2.append('title').text((d) => `${d.key}: ${format(d.compare ?? 0)}`);

      // value labels above bars2
      g.selectAll('.lbl2').data(data).enter().append('text')
        .attr('class', 'lbl2')
        .attr('x', (d) => (x(d.key) ?? 0) + x.bandwidth() / 2 + 2 + bw / 2)
        .attr('y', ih)
        .attr('text-anchor', 'middle')
        .attr('font-size', 11)
        .attr('font-family', 'Geist Mono, monospace')
        .attr('fill', '#3aa0e6')
        .attr('opacity', 0)
        .text((d) => ih - y(d.compare ?? 0) >= 20 ? format(d.compare ?? 0) : '')
        .transition().duration(700).delay((_, i) => i * 60 + 420).ease(d3.easeCubicOut)
        .attr('y', (d) => y(d.compare ?? 0) - 5)
        .attr('opacity', 1);
    }
  }, [data, height, format, colorA, colorB]);
  return <svg ref={ref} className="w-full" style={{ height }} />;
}
