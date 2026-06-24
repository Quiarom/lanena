import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { fmtNumber } from '@/lib/format';

export interface HBarDatum { key: string; value: number; valuePrev?: number; meta?: string }

function truncateLabel(label: string, max = 26): string {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

export function D3HorizontalBarChart({
  data,
  height,
  format = (n: number) => fmtNumber(n, { short: true }),
  color = '#01205e',
  labelPrev = '2025',
  labelCurr = '2026',
}: {
  data: HBarDatum[];
  height?: number;
  format?: (n: number) => string;
  color?: string;
  labelPrev?: string;
  labelCurr?: string;
}) {
  const ref = useRef<SVGSVGElement | null>(null);
  const hasComparison = data.some((d) => d.valuePrev !== undefined);
  const h = height ?? Math.max(180, data.length * (hasComparison ? 52 : 32) + (hasComparison ? 36 : 20));

  useEffect(() => {
    const svg = d3.select(ref.current!);
    svg.selectAll('*').remove();

    if (!data.length) {
      svg
        .append('text')
        .attr('x', '50%')
        .attr('y', '50%')
        .attr('text-anchor', 'middle')
        .attr('fill', '#94a3b8')
        .attr('font-size', 12)
        .text('Sin datos');
      return;
    }

    const w = ref.current!.clientWidth || 480;
    const margin = { top: 8, right: 10, bottom: hasComparison ? 28 : 8, left: 8 };
    const rowWidth = Math.max(260, w - margin.left - margin.right);
    const ih = h - margin.top - margin.bottom;
    const labelWidth = Math.min(320, Math.max(170, rowWidth * 0.42));
    const labelMaxChars = Math.max(12, Math.floor((labelWidth - 28) / 6.4));
    const valueGutter = 76;
    const barEnd = Math.max(labelWidth + 32, rowWidth - valueGutter);
    const g = svg
      .attr('viewBox', `0 0 ${w} ${h}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const defs = svg.append('defs');
    const gid = `hgrad-${Math.random().toString(36).slice(2, 8)}`;
    const labelClipId = `hlabel-clip-${Math.random().toString(36).slice(2, 8)}`;
    const grad = defs.append('linearGradient').attr('id', gid).attr('x1', '0').attr('x2', '1');
    grad.append('stop').attr('offset', '0').attr('stop-color', color).attr('stop-opacity', 0.94);
    grad.append('stop').attr('offset', '1').attr('stop-color', color).attr('stop-opacity', 0.58);
    defs.append('clipPath')
      .attr('id', labelClipId)
      .append('rect')
      .attr('x', 8)
      .attr('y', 0)
      .attr('width', Math.max(80, labelWidth - 20))
      .attr('height', ih);

    const y = d3.scaleBand<string>().domain(data.map((d) => d.key)).range([0, ih]).padding(0.22);

    const addTracks = () => {
      g.selectAll('.track')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'track')
        .attr('x', 0)
        .attr('y', (d) => y(d.key) ?? 0)
        .attr('height', y.bandwidth())
        .attr('width', rowWidth)
        .attr('fill', '#f1f3f9')
        .attr('rx', 8);

      const labels = g.selectAll('.row-label')
        .data(data)
        .enter()
        .append('text')
        .attr('class', 'row-label')
        .attr('x', 12)
        .attr('y', (d) => (y(d.key) ?? 0) + y.bandwidth() / 2 + 4)
        .attr('font-size', 11)
        .attr('font-weight', 600)
        .attr('fill', '#0f172a')
        .attr('font-family', 'Geist, sans-serif')
        .attr('clip-path', `url(#${labelClipId})`)
        .text((d) => truncateLabel(d.key, labelMaxChars));

      labels.append('title').text((d) => d.key);
    };

    const labelX = (xValue: number) => Math.min(xValue + 8, rowWidth - 8);
    const labelAnchor = (xValue: number) => (xValue + 72 > rowWidth ? 'end' : 'start');

    addTracks();

    if (hasComparison) {
      const allVals = data.flatMap((d) => [d.value, d.valuePrev ?? 0]);
      const xmax = d3.max(allVals) || 1;
      const comparisonGap = 6;
      const centerX = labelWidth + Math.max(72, (barEnd - labelWidth) * 0.48);
      const xPrev = d3.scaleLinear().domain([0, xmax]).range([centerX - comparisonGap, labelWidth]);
      const xCurr = d3.scaleLinear().domain([0, xmax]).range([centerX + comparisonGap, barEnd]);
      const barHeight = Math.min(16, Math.max(8, y.bandwidth() * 0.44));
      const barY = (d: HBarDatum) => (y(d.key) ?? 0) + y.bandwidth() / 2 - barHeight / 2;
      const prevLabelX = (value: number) => Math.max(labelWidth + 8, xPrev(value) - 8);
      const currLabelX = (value: number) => Math.min(rowWidth - 8, xCurr(value) + 8);

      g.append('line')
        .attr('x1', centerX)
        .attr('x2', centerX)
        .attr('y1', 0)
        .attr('y2', ih)
        .attr('stroke', '#cbd5e1')
        .attr('stroke-dasharray', '3,3');

      const prevBars = g.selectAll('rect.bar-prev').data(data).enter().append('rect').attr('class', 'bar-prev')
        .attr('x', centerX - comparisonGap)
        .attr('y', barY)
        .attr('height', barHeight)
        .attr('width', 0)
        .attr('fill', '#94a3b8')
        .attr('rx', 4);

      prevBars.transition().duration(900).delay((_, i) => i * 60).ease(d3.easeCubicOut)
        .attr('x', (d) => xPrev(d.valuePrev ?? 0))
        .attr('width', (d) => Math.max(0, centerX - comparisonGap - xPrev(d.valuePrev ?? 0)));
      prevBars.append('title').text((d) => `${d.key} ${labelPrev}: ${format(d.valuePrev ?? 0)}`);

      const currBars = g.selectAll('rect.bar-curr').data(data).enter().append('rect').attr('class', 'bar-curr')
        .attr('x', centerX + comparisonGap)
        .attr('y', barY)
        .attr('height', barHeight)
        .attr('width', 0)
        .attr('fill', `url(#${gid})`)
        .attr('rx', 4);

      currBars.transition().duration(900).delay((_, i) => i * 60 + 150).ease(d3.easeCubicOut)
        .attr('width', (d) => Math.max(0, xCurr(d.value) - centerX - comparisonGap));
      currBars.append('title').text((d) => `${d.key} ${labelCurr}: ${format(d.value)}`);

      g.selectAll('.lbl-prev').data(data).enter().append('text')
        .attr('y', (d) => (y(d.key) ?? 0) + y.bandwidth() / 2 + 4)
        .attr('font-size', 10)
        .attr('fill', '#64748b')
        .attr('font-family', 'Geist Mono, monospace')
        .attr('opacity', 0)
        .attr('text-anchor', 'end')
        .text((d) => format(d.valuePrev ?? 0))
        .attr('x', centerX - comparisonGap - 6)
        .transition().duration(700).delay((_, i) => i * 60 + 320).ease(d3.easeCubicOut)
        .attr('x', (d) => prevLabelX(d.valuePrev ?? 0))
        .attr('opacity', 1);

      g.selectAll('.lbl-curr').data(data).enter().append('text')
        .attr('y', (d) => (y(d.key) ?? 0) + y.bandwidth() / 2 + 4)
        .attr('font-size', 10)
        .attr('fill', '#01205e')
        .attr('font-family', 'Geist Mono, monospace')
        .attr('opacity', 0)
        .attr('text-anchor', 'start')
        .text((d) => format(d.value))
        .attr('x', centerX + comparisonGap + 6)
        .transition().duration(700).delay((_, i) => i * 60 + 470).ease(d3.easeCubicOut)
        .attr('x', (d) => currLabelX(d.value))
        .attr('opacity', 1);

      const lg = svg.append('g').attr('transform', `translate(${margin.left}, ${h - 16})`);
      lg.append('rect').attr('width', 10).attr('height', 10).attr('rx', 2).attr('fill', '#94a3b8');
      lg.append('text').attr('x', 14).attr('y', 9).attr('font-size', 10).attr('fill', '#64748b').attr('font-family', 'Geist, sans-serif').text(`${labelPrev} izquierda`);
      lg.append('rect').attr('x', 105).attr('width', 10).attr('height', 10).attr('rx', 2).attr('fill', color);
      lg.append('text').attr('x', 119).attr('y', 9).attr('font-size', 10).attr('fill', '#01205e').attr('font-family', 'Geist, sans-serif').text(`${labelCurr} derecha`);
    } else {
      const xmax = d3.max(data, (d) => d.value) || 1;
      const x = d3.scaleLinear().domain([0, xmax]).range([labelWidth, barEnd]);

      const bars = g.selectAll('rect.bar').data(data).enter().append('rect').attr('class', 'bar')
        .attr('x', labelWidth)
        .attr('y', (d) => y(d.key) ?? 0)
        .attr('height', y.bandwidth())
        .attr('width', 0)
        .attr('fill', `url(#${gid})`)
        .attr('rx', 5);

      bars.transition().duration(900).delay((_, i) => i * 70).ease(d3.easeCubicOut)
        .attr('width', (d) => Math.max(0, x(d.value) - labelWidth));
      bars.append('title').text((d) => `${d.key}: ${format(d.value)}`);

      g.selectAll('.lbl').data(data).enter().append('text')
        .attr('y', (d) => (y(d.key) ?? 0) + y.bandwidth() / 2 + 4)
        .attr('font-size', 11)
        .attr('fill', '#01205e')
        .attr('font-family', 'Geist Mono, monospace')
        .attr('opacity', 0)
        .text((d) => format(d.value))
        .attr('x', labelWidth + 6)
        .transition().duration(900).delay((_, i) => i * 70 + 250).ease(d3.easeCubicOut)
        .attr('x', (d) => labelX(x(d.value)))
        .attr('text-anchor', (d) => labelAnchor(x(d.value)))
        .attr('opacity', 1);
    }
  }, [data, h, format, color, hasComparison, labelPrev, labelCurr]);

  return <svg ref={ref} className="w-full" style={{ height: h }} />;
}
