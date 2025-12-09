import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import * as d3 from 'd3';

interface MermaidProps {
  chart: string;
  theme?: 'dark' | 'default' | 'forest' | 'neutral';
}

const sanitizeMermaidCode = (code: string): string => {
  let clean = code
    .replace(/```mermaid/g, '')
    .replace(/```/g, '')
    .replace(/^mermaid\s*/i, '')
    .replace(/--">/g, '-->')
    .replace(/-">/g, '->')
    .replace(/\("([^"]+);/g, '("$1")')
    .replace(/"\)\)/g, '")')
    .replace(/";/g, '"')
    .replace(/([\[\{\(])([^\}\]\)\"\n]*\([^\}\]\)\"\n]*\)[^\}\]\)\"\n]*)([\]\}\)])/g, '$1"$2"$3')
    .trim();

  return clean;
};

export const Mermaid: React.FC<MermaidProps> = ({ chart, theme = 'dark' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const zoomBehaviorRef = useRef<d3.ZoomBehavior<Element, unknown> | null>(null);
  const svgSelectionRef = useRef<d3.Selection<Element, unknown, null, undefined> | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: theme,
      securityLevel: 'loose',
      fontFamily: 'Rajdhani, sans-serif',
      // This helps text fit better in nodes
      flowchart: { htmlLabels: true, curve: 'basis' }
    });
  }, [theme]);

  // Handle fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === wrapperRef.current);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (containerRef.current && chart) {
      setError(false);
      const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

      // RUN THE CLEANER
      const cleanChart = sanitizeMermaidCode(chart);

      containerRef.current.innerHTML = '';

      const renderDiagram = async () => {
        try {
          // Attempt render
          const { svg } = await mermaid.render(id, cleanChart);

          if (containerRef.current) {
            containerRef.current.innerHTML = svg;

            // --- D3 Zoom Logic ---
            const svgElement = containerRef.current.querySelector('svg');
            if (svgElement) {
              svgElement.style.maxWidth = 'none';
              svgElement.style.width = '100%';
              svgElement.style.height = '100%';
              svgElement.setAttribute('height', '100%');
              svgElement.setAttribute('width', '100%');

              const d3Svg = d3.select(svgElement);
              svgSelectionRef.current = d3Svg;

              const zoom = d3.zoom()
                .scaleExtent([0.1, 5])
                .on('zoom', (event) => {
                  d3Svg.select('g').attr('transform', event.transform);
                });

              zoomBehaviorRef.current = zoom;
              d3Svg.call(zoom as any);
            }
          }
        } catch (e) {
          console.error("Mermaid render exception:", e);
          console.log("Failed Chart Syntax:", cleanChart);
          setError(true);
        }
      };

      renderDiagram();
    }
  }, [chart, theme]);

  const handleZoom = (scaleFactor: number) => {
    if (svgSelectionRef.current && zoomBehaviorRef.current) {
      svgSelectionRef.current.transition().duration(300).call(zoomBehaviorRef.current.scaleBy as any, scaleFactor);
    }
  };

  const handleReset = () => {
    if (svgSelectionRef.current && zoomBehaviorRef.current) {
      svgSelectionRef.current.transition().duration(300).call(zoomBehaviorRef.current.transform as any, d3.zoomIdentity);
    }
  };

  const toggleFullscreen = () => {
    if (!wrapperRef.current) return;
    if (!document.fullscreenElement) {
      wrapperRef.current.requestFullscreen().catch((err) => console.error(err));
    } else {
      document.exitFullscreen();
    }
  };

  const handleDownload = () => {
    if (!containerRef.current) return;
    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;

    const serializer = new XMLSerializer();
    const svgData = serializer.serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `flowchart-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-red-400 text-sm p-4 border border-red-500/30 rounded bg-red-900/10">
        <p className="font-bold mb-2">Failed to render flowchart</p>
        <p className="text-xs text-slate-500 text-center max-w-xs">
          The AI generated invalid syntax. Try regenerating the analysis.
        </p>
      </div>
    );
  }

  const bgClass = theme === 'dark' ? 'bg-slate-950' : 'bg-white';
  const borderClass = theme === 'dark' ? 'border-slate-700' : 'border-slate-200';

  return (
    <div
      ref={wrapperRef}
      className={`relative w-full h-[500px] border ${borderClass} rounded-md ${bgClass} overflow-hidden group transition-colors duration-300 ${isFullscreen ? 'flex items-center justify-center' : ''}`}
    >
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center cursor-move touch-none"
      />

      {/* Controls Overlay */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
        <button onClick={toggleFullscreen} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded shadow-lg border border-slate-600">
          {isFullscreen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 5a1 1 0 011-1h2a1 1 0 110 2H6v1a1 1 0 11-2 0V5zm10 0a1 1 0 011 1v1a1 1 0 11-2 0V6h-1a1 1 0 110-2h2zM5 15a1 1 0 011 1h1a1 1 0 110 2H6a1 1 0 01-1-1v-2a1 1 0 112 0v1zm11-1a1 1 0 10-2 0v1h-1a1 1 0 100 2h2a1 1 0 001-1v-2z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h2a1 1 0 110 2H5v1a1 1 0 11-2 0V5zm12 0a1 1 0 011 1v2a1 1 0 11-2 0V6h-1a1 1 0 110-2h2zM5 13a1 1 0 100 2h1v1a1 1 0 102 0v-2a1 1 0 00-1-1H5zm11-1a1 1 0 10-2 0v2a1 1 0 001 1h2a1 1 0 100-2h-1v-1z" clipRule="evenodd" />
            </svg>
          )}
        </button>
        <button onClick={() => handleZoom(1.2)} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded shadow-lg border border-slate-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
        </button>
        <button onClick={() => handleZoom(0.8)} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded shadow-lg border border-slate-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
        </button>
        <button onClick={handleReset} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded shadow-lg border border-slate-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>
        </button>
        <button onClick={handleDownload} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded shadow-lg border border-slate-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
        </button>
      </div>
    </div>
  );
};