'use client';

import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
  id?: string;
}

export default function MermaidDiagram({ chart, id }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement>(null);
  const chartId = id || `mermaid-${Math.random().toString(36).substr(2, 9)}`;

  useEffect(() => {
    if (ref.current) {
      // Initialize mermaid with configuration
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        fontFamily: 'inherit',
        fontSize: 14,
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
        },
        sequence: {
          useMaxWidth: true,
          wrap: true,
        },
        gantt: {
          useMaxWidth: true,
        },
        journey: {
          useMaxWidth: true,
        },
        gitGraph: {
          useMaxWidth: true,
        },
      });

      // Clear previous content
      ref.current.innerHTML = '';

      // Render the diagram
      mermaid.render(chartId, chart).then(({ svg }) => {
        if (ref.current) {
          ref.current.innerHTML = svg;
        }
      }).catch((error) => {
        console.error('Mermaid rendering error:', error);
        if (ref.current) {
          ref.current.innerHTML = `
    <div class="p-4 border border-red-200 rounded-lg bg-red-50 text-red-700">
      <p class="font-medium">图表渲染错误</p>
      <p class="text-sm mt-1">请检查 Mermaid 语法是否正确</p>
      <details class="mt-2">
      <summary class="cursor-pointer text-sm">查看错误详情</summary>
      <pre class="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">${error.message}</pre>
      </details>
    </div>
    `;
        }
      });
    }
  }, [chart, chartId]);

  return (
    <div
      ref={ref}
      className="mermaid-diagram my-4 flex justify-center"
      style={{
        minHeight: '100px',
        maxWidth: '100%',
        overflow: 'auto'
      }}
    />
  );
}
