import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { useAppContext } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Loader } from '../ui/Loader';
import { EmptyState } from '../ui/EmptyState';
import { ConceptMapData, ConceptNode, ConceptLink } from '../../types';

interface D3ConceptMapProps {
  data: ConceptMapData;
}

const D3Graph: React.FC<D3ConceptMapProps> = ({ data }) => {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        if (!data || !svgRef.current || !containerRef.current) return;

        const svg = d3.select(svgRef.current);
        const container = d3.select(containerRef.current);

        // Deep copy data as simulation mutates it
        const { nodes, links }: { nodes: ConceptNode[], links: ConceptLink[] } = JSON.parse(JSON.stringify(data));
        
        const color = d3.scaleOrdinal(d3.schemeReds[5].slice(2));

        const render = () => {
            const width = containerRef.current!.clientWidth;
            const height = containerRef.current!.clientHeight;

            svg.attr('width', width).attr('height', height).attr('viewBox', [-width / 2, -height / 2, width, height]);
            
            svg.selectAll('*').remove(); // Clear previous render

            const link = svg.append('g')
                .attr('class', 'links')
                .selectAll('line')
                .data(links)
                .join('line')
                .attr('stroke-width', d => Math.sqrt(d.value))
                .attr('class', 'concept-link');

            const node = svg.append('g')
                .attr('class', 'nodes')
                .selectAll('g')
                .data(nodes)
                .join('g')
                .attr('class', 'concept-node-group');

            node.append('circle')
                .attr('r', 12)
                .attr('fill', d => color(d.group.toString()))
                .attr('class', 'concept-node-circle');

            node.append('text')
                .text(d => d.id)
                .attr('x', 18)
                .attr('y', 5)
                .attr('class', 'concept-node-label');

            const simulation = d3.forceSimulation(nodes)
                .force('link', d3.forceLink<ConceptNode, ConceptLink>(links).id(d => d.id).distance(120))
                .force('charge', d3.forceManyBody().strength(-500))
                .force('center', d3.forceCenter(0, 0))
                .force('collide', d3.forceCollide().radius(50));

            // --- Interactivity ---
            const linkedByIndex = new Map<string, Set<string>>();
            links.forEach(d => {
                // FIX: Before simulation, source and target can be string IDs. Accessing .id would cause a runtime error. This checks the type before accessing properties.
                const sourceId = typeof d.source === 'string' ? d.source : (d.source as ConceptNode).id;
                const targetId = typeof d.target === 'string' ? d.target : (d.target as ConceptNode).id;
                if (!linkedByIndex.has(sourceId)) linkedByIndex.set(sourceId, new Set());
                if (!linkedByIndex.has(targetId)) linkedByIndex.set(targetId, new Set());
                linkedByIndex.get(sourceId)!.add(targetId);
                linkedByIndex.get(targetId)!.add(sourceId);
            });

            const isConnected = (a: ConceptNode, b: ConceptNode) => {
                return linkedByIndex.get(a.id)?.has(b.id) || linkedByIndex.get(b.id)?.has(a.id) || a.id === b.id;
            }

            const fade = (opacity: number) => (event: MouseEvent, d: ConceptNode) => {
                node.transition().duration(200).style('opacity', n => isConnected(d, n) ? 1 : opacity);
                link.transition().duration(200).style('opacity', l => (l.source as ConceptNode).id === d.id || (l.target as ConceptNode).id === d.id ? 1 : opacity);
            };

            node.on('mouseover', fade(0.1)).on('mouseout', fade(1));

            const drag = (simulation: d3.Simulation<ConceptNode, undefined>) => {
                const dragstarted = (event: d3.D3DragEvent<any, any, any>) => {
                    if (!event.active) simulation.alphaTarget(0.3).restart();
                    event.subject.fx = event.subject.x;
                    event.subject.fy = event.subject.y;
                }
                const dragged = (event: d3.D3DragEvent<any, any, any>) => {
                    event.subject.fx = event.x;
                    event.subject.fy = event.y;
                }
                const dragended = (event: d3.D3DragEvent<any, any, any>) => {
                    if (!event.active) simulation.alphaTarget(0);
                    event.subject.fx = null;
                    event.subject.fy = null;
                }
                return d3.drag<any, ConceptNode>().on('start', dragstarted).on('drag', dragged).on('end', dragended);
            }
            node.call(drag(simulation));

            // --- Zoom ---
            const zoom = d3.zoom<SVGSVGElement, unknown>()
                .scaleExtent([0.2, 5])
                .on('zoom', (event) => {
                    svg.selectAll('g').attr('transform', event.transform);
                });
            svg.call(zoom);

            simulation.on('tick', () => {
                link
                    // FIX: The d3 simulation adds x/y properties at runtime.
                    // Casting to `any` helps TypeScript handle these dynamic properties which exist on the node objects after simulation starts.
                    .attr('x1', d => (d.source as any).x!)
                    .attr('y1', d => (d.source as any).y!)
                    .attr('x2', d => (d.target as any).x!)
                    .attr('y2', d => (d.target as any).y!);
                node.attr('transform', d => `translate(${d.x},${d.y})`);
            });
        };
        
        render();

        const resizeObserver = new ResizeObserver(render);
        resizeObserver.observe(containerRef.current!);

        return () => {
            resizeObserver.disconnect();
        };

    }, [data, isFullscreen]); // Re-render on data change or fullscreen toggle

     const toggleFullscreen = () => {
        const elem = containerRef.current;
        if (!elem) return;

        if (!document.fullscreenElement) {
            elem.requestFullscreen().then(() => setIsFullscreen(true)).catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen().then(() => setIsFullscreen(false));
        }
    };
    
    useEffect(() => {
        const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    }, []);

    return (
        <div ref={containerRef} className="relative w-full h-[600px] bg-slate-900 rounded-md border border-slate-700 overflow-hidden group">
            <style>{`
                .concept-node-circle {
                    stroke: #f87171;
                    stroke-width: 2px;
                    animation: pulse 4s infinite;
                }
                .concept-node-group { cursor: grab; }
                .concept-node-group:active { cursor: grabbing; }
                .concept-node-label {
                    fill: #cbd5e1;
                    font-size: 13px;
                    paint-order: stroke;
                    stroke: #020617;
                    stroke-width: 3px;
                    stroke-linecap: butt;
                    stroke-linejoin: miter;
                    pointer-events: none;
                }
                .concept-link {
                    stroke: #ef4444;
                    stroke-opacity: 0.5;
                    stroke-dasharray: 10 5;
                    animation: energy-flow 1s linear infinite;
                }
            `}</style>
            <svg ref={svgRef}></svg>
            <Button
                onClick={toggleFullscreen}
                variant="secondary"
                className="absolute bottom-3 right-3 opacity-50 group-hover:opacity-100 transition-opacity !p-2"
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
                {isFullscreen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" /><path fillRule="evenodd" d="M10 5a1 1 0 011 1v8a1 1 0 11-2 0V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 10a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                )}
            </Button>
        </div>
    );
};

export const ConceptMap: React.FC = () => {
    const { 
        activeProject, projects,
        isGeneratingConceptMap, generateConceptMapForActiveProject
    } = useAppContext();

    const conceptMapData = useMemo(() => activeProject?.conceptMapData, [activeProject]);

    if (!projects.length) {
        return <EmptyState 
          title="Visualize Concepts"
          message="Understand complex topics at a glance. Ingest your study material to automatically generate a concept map that shows the relationships between key ideas."
        />;
    }
    
    if (!activeProject) {
        return <EmptyState 
          title="Select a Study"
          message="Please select a study from the sidebar to visualize its concept map, or create a new one."
        />;
    }
    
    const hasData = !!conceptMapData;

    return (
        <Card title="Concept Map">
            <div className="space-y-6">
                <div>
                    <Button onClick={generateConceptMapForActiveProject} disabled={isGeneratingConceptMap}>
                        {isGeneratingConceptMap ? 'Generating...' : hasData ? 'Re-generate Map' : 'Generate Concept Map'}
                    </Button>
                </div>
                {isGeneratingConceptMap && (
                    <div className="flex flex-col items-center gap-4 py-8">
                        <Loader />
                        <p className="text-slate-400">Analyzing relationships and building map...</p>
                    </div>
                )}
                {hasData && !isGeneratingConceptMap && (
                    <div className="fade-in">
                        <D3Graph data={conceptMapData} />
                    </div>
                )}
            </div>
        </Card>
    );
};
