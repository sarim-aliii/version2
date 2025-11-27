import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import * as d3 from 'd3';

interface MermaidProps {
  chart: string;
  theme?: 'dark' | 'default' | 'forest' | 'neutral';
}

export const Mermaid: React.FC<MermaidProps> = ({ chart, theme = 'dark' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<Element, unknown> | null>(null);
  const svgSelectionRef = useRef<d3.Selection<Element, unknown, null, undefined> | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: theme,
      securityLevel: 'loose',
      fontFamily: 'Rajdhani, sans-serif',
    });
  }, [theme]);

  useEffect(() => {
    if (containerRef.current && chart) {
      setError(false);
      const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
    
      const cleanChart = chart
        .replace(/```mermaid/g, '')
        .replace(/```/g, '')
        .replace(/^mermaid\s*/i, '')
        .trim();

      containerRef.current.innerHTML = '';

      const renderDiagram = async () => {
        try {
          const { svg } = await mermaid.render(id, cleanChart);
          
          if (containerRef.current) {
            containerRef.current.innerHTML = svg;
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
                    .scaleExtent([0.1, 5]) // Min zoom 0.1x, Max zoom 5x
                    .on('zoom', (event) => {
                        d3Svg.select('g').attr('transform', event.transform);
                    });
                
                zoomBehaviorRef.current = zoom;

                d3Svg.call(zoom as any);
            }
          }
        } catch (e) {
          console.error("Mermaid render exception:", e);
          setError(true);
        }
      };

      renderDiagram();
    }
  }, [chart, theme]);

  // Zoom Controls
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

  // Download Handler
  const handleDownload = () => {
      if (!containerRef.current) return;
      const svg = containerRef.current.querySelector('svg');
      if (!svg) return;

      // Serialize the SVG
      const serializer = new XMLSerializer();
      const svgData = serializer.serializeToString(svg);
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `flowchart-${Date.now()}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  if (error) {
      return <div className="text-red-400 text-sm p-4 border border-red-500/50 rounded bg-red-900/20">Failed to render diagram. Raw syntax might be invalid.</div>;
  }

  return (
    <div className="relative w-full h-[500px] border border-slate-700 rounded-md bg-slate-950 overflow-hidden group">
        <div 
            ref={containerRef} 
            className="w-full h-full flex items-center justify-center cursor-move touch-none" 
        />
        
        {/* Controls Overlay */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button onClick={() => handleZoom(1.2)} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded shadow-lg border border-slate-600" title="Zoom In">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
            </button>
            <button onClick={() => handleZoom(0.8)} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded shadow-lg border border-slate-600" title="Zoom Out">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
            </button>
            <button onClick={handleReset} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded shadow-lg border border-slate-600" title="Reset View">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>
            </button>
            <button onClick={handleDownload} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded shadow-lg border border-slate-600" title="Download SVG">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
        </div>
    </div>
  );
};