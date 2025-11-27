import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: true,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'Rajdhani, sans-serif',
});

interface MermaidProps {
  chart: string;
}

export const Mermaid: React.FC<MermaidProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (containerRef.current && chart) {
      setError(false);
      const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
      
      // Clean the chart string just in case
      const cleanChart = chart
        .replace(/```mermaid/g, '')
        .replace(/```/g, '')
        .replace(/^mermaid\s*/i, '') // Remove "mermaid" text if present at start
        .trim();

      containerRef.current.innerHTML = ''; // Clear previous

      try {
        mermaid.render(id, cleanChart).then(({ svg }) => {
          if (containerRef.current) {
            containerRef.current.innerHTML = svg;
          }
        }).catch((err) => {
            console.error("Mermaid syntax error:", err);
            setError(true);
        });
      } catch (e) {
        console.error("Mermaid render exception:", e);
        setError(true);
      }
    }
  }, [chart]);

  if (error) {
      return <div className="text-red-400 text-sm p-4 border border-red-500/50 rounded bg-red-900/20">Failed to render diagram. Raw syntax might be invalid.</div>;
  }

  return <div ref={containerRef} className="w-full flex justify-center my-4 overflow-x-auto" />;
};