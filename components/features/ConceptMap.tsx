import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    select,
    forceSimulation,
    forceLink,
    forceManyBody,
    forceCenter,
    scaleOrdinal,
    schemeCategory10,
    zoom,
    drag,
    Simulation,
    SimulationNodeDatum
} from 'd3';
import { useAppContext } from '../../context/AppContext';
import { generateConceptMapData, generateConceptMapForTopic } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Loader } from '../ui/Loader';
import { ConceptMapData, ConceptNode, ConceptLink } from '../../types';
import { EmptyState } from '../ui/EmptyState';

interface D3GraphProps {
  data: ConceptMapData;
  isFullscreen: boolean;
}

const D3Graph: React.FC<D3GraphProps> = ({ data, isFullscreen }) => {
    const ref = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!data || !ref.current || data.nodes.length === 0) return;

        const svg = select(ref.current);
        svg.selectAll("*").remove();

        const parent = ref.current.parentElement;
        const width = parent?.clientWidth || 800;
        const height = parent?.clientHeight || 600;
        
        const tooltip = select("body").append("div")
            .attr("class", "absolute p-2 text-sm bg-slate-950 border border-slate-700 rounded-md pointer-events-none opacity-0 transition-opacity text-slate-200")
            .style("z-index", "10");

        svg.attr('viewBox', [0, 0, width, height].join(' '));

        const g = svg.append("g"); 

        const simulation = forceSimulation<ConceptNode>(data.nodes)
            .force("link", forceLink<ConceptNode, ConceptLink>(data.links).id((d: any) => d.id).distance(100))
            .force("charge", forceManyBody().strength(-300))
            .force("center", forceCenter(width / 2, height / 2));

        const link = g.append("g")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(data.links)
            .join("line")
            .attr("stroke-width", d => Math.sqrt(d.value));

        let selectedNode: ConceptNode | null = null;
        
        const node = g.append("g")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .selectAll("g")
            .data(data.nodes)
            .join("g")
            .call(createDragHandler(simulation) as any)
            .on("mouseover", (event, d) => {
                tooltip.transition().duration(200).style("opacity", .9);
                tooltip.html(`<strong>${d.id}</strong><br/>Group: ${d.group}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", () => {
                tooltip.transition().duration(500).style("opacity", 0);
            })
            .on("click", clickHandler);

        function resetHighlights() {
            selectedNode = null;
            node.transition().duration(300).style('opacity', 1);
            link.transition().duration(300).style('opacity', 0.6);
        }

        function clickHandler(event: MouseEvent, d: ConceptNode) {
            event.stopPropagation();
            const isReselecting = selectedNode && selectedNode.id === d.id;
            
            if (isReselecting) {
                resetHighlights();
                return;
            }

            selectedNode = d;
            const connectedNodes = new Set<string>();
            connectedNodes.add(d.id);

            link.each(function(l) {
                const source = l.source as ConceptNode;
                const target = l.target as ConceptNode;
                if (source.id === d.id || target.id === d.id) {
                    connectedNodes.add(source.id);
                    connectedNodes.add(target.id);
                }
            });

            node.transition().duration(300).style("opacity", n => connectedNodes.has(n.id) ? 1 : 0.15);
            link.transition().duration(300).style("opacity", l => {
                const source = l.source as ConceptNode;
                const target = l.target as ConceptNode;
                return source.id === d.id || target.id === d.id ? 1 : 0.1;
            });
        }
        
        svg.on('click', resetHighlights);

        const color = scaleOrdinal(schemeCategory10);
        
        node.append("circle")
            .attr("r", 10)
            .attr("fill", d => color(d.group.toString()));

        node.append("text")
            .attr("x", 12)
            .attr("y", "0.31em")
            .text(d => d.id)
            .attr("fill", "#ccc")
            .attr("stroke", "none")
            .style("font-size", "12px");

        simulation.on("tick", () => {
            link
                .attr("x1", d => (d.source as SimulationNodeDatum).x!)
                .attr("y1", d => (d.source as SimulationNodeDatum).y!)
                .attr("x2", d => (d.target as SimulationNodeDatum).x!)
                .attr("y2", d => (d.target as SimulationNodeDatum).y!);
            node
                .attr("transform", d => `translate(${(d as SimulationNodeDatum).x!},${(d as SimulationNodeDatum).y!})`);
        });

        const zoomBehavior = zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on("zoom", (event) => g.attr("transform", event.transform));
        svg.call(zoomBehavior);

        function createDragHandler(simulation: Simulation<ConceptNode, undefined>) {
            function dragstarted(event: any) {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                event.subject.fx = event.subject.x;
                event.subject.fy = event.subject.y;
            }
            function dragged(event: any) {
                event.subject.fx = event.x;
                event.subject.fy = event.y;
            }
            function dragended(event: any) {
                if (!event.active) simulation.alphaTarget(0);
                event.subject.fx = null;
                event.subject.fy = null;
            }
            return drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended);
        }
        
        return () => {
            tooltip.remove();
        };

    }, [data, isFullscreen]);

    return <svg ref={ref} className="w-full h-full min-h-[600px] bg-slate-950/50 rounded-md border border-slate-700 cursor-pointer"></svg>;
};

export const ConceptMap: React.FC = () => {
    const { ingestedText, addNotification, language, llm } = useAppContext();
    const [mapData, setMapData] = useState<ConceptMapData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [topic, setTopic] = useState('');
    const [activeGenerator, setActiveGenerator] = useState<'text' | 'topic' | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const mapContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(document.fullscreenElement !== null);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = () => {
        if (!mapContainerRef.current) return;
        if (!isFullscreen) {
            mapContainerRef.current.requestFullscreen().catch(err => {
                addNotification(`Error entering fullscreen mode: ${err.message}`, 'error');
            });
        } else {
            document.exitFullscreen();
        }
    };

    const handleBuildMap = useCallback(async () => {
        if (!ingestedText) {
            addNotification('Please ingest some text first.', 'info');
            return;
        }
        setIsLoading(true);
        setActiveGenerator('text');
        setMapData(null);
        try {
            const result = await generateConceptMapData(llm, ingestedText, language);
            if (result && result.nodes && result.links) {
                const nodeIds = new Set(result.nodes.map(n => n.id));
                const sanitizedLinks = result.links.filter(link => 
                    nodeIds.has(link.source as string) && nodeIds.has(link.target as string)
                );
                setMapData({ nodes: result.nodes, links: sanitizedLinks });
            } else {
                setMapData(result);
            }
        } catch (e: any) {
            addNotification(e.message);
        } finally {
            setIsLoading(false);
            setActiveGenerator(null);
        }
    }, [ingestedText, addNotification, language, llm]);

    const handleGenerateFromTopic = useCallback(async () => {
        if (!topic.trim()) {
            addNotification('Please enter a topic.', 'info');
            return;
        }
        setIsLoading(true);
        setActiveGenerator('topic');
        setMapData(null);
        try {
            const result = await generateConceptMapForTopic(llm, topic, language);
            if (result && result.nodes && result.links) {
                const nodeIds = new Set(result.nodes.map(n => n.id));
                const sanitizedLinks = result.links.filter(link => 
                    nodeIds.has(link.source as string) && nodeIds.has(link.target as string)
                );
                setMapData({ nodes: result.nodes, links: sanitizedLinks });
            } else {
                setMapData(result);
            }
        } catch (e: any) {
            addNotification(e.message);
        } finally {
            setIsLoading(false);
            setActiveGenerator(null);
        }
    }, [topic, addNotification, language, llm]);

    const isTextLoading = isLoading && activeGenerator === 'text';
    const isTopicLoading = isLoading && activeGenerator === 'topic';

    if (!ingestedText && !mapData) {
        return (
            <Card title="Concept Map">
                 <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <Button onClick={handleBuildMap} disabled={true} className="w-full sm:w-auto">
                            Build from Ingested Text
                        </Button>
                        <div className="w-full flex items-center gap-2">
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="Generate map from a topic..."
                                className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none transition"
                                disabled={isLoading}
                            />
                            <Button onClick={handleGenerateFromTopic} variant="secondary" disabled={!topic.trim() || isLoading} className="flex-shrink-0">
                                {isTopicLoading ? 'Building...' : 'Generate'}
                            </Button>
                        </div>
                    </div>
                     <EmptyState 
                        title="Visualize Your Notes"
                        message="Ingest text to generate a concept map, or enter a topic above to create one from scratch."
                    />
                 </div>
            </Card>
        )
    }

    return (
        <Card title="Concept Map">
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <Button onClick={handleBuildMap} disabled={!ingestedText || isLoading} className="w-full sm:w-auto">
                        {isTextLoading ? 'Building from text...' : 'Build from Ingested Text'}
                    </Button>
                    <div className="w-full flex items-center gap-2">
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="Or generate map from a topic..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none transition"
                            disabled={isLoading}
                        />
                        <Button onClick={handleGenerateFromTopic} variant="secondary" disabled={!topic.trim() || isLoading} className="flex-shrink-0">
                            {isTopicLoading ? 'Building...' : 'Generate'}
                        </Button>
                    </div>
                </div>
                {isLoading && <Loader />}
                {mapData && mapData.nodes.length > 0 && (
                    <div ref={mapContainerRef} className="relative fade-in bg-slate-950">
                        <button onClick={toggleFullscreen} className="absolute top-2 right-2 z-10 p-2 bg-slate-800/50 hover:bg-red-600 rounded-full text-slate-300 hover:text-white transition-colors" aria-label={isFullscreen ? 'Exit full-screen' : 'Enter full-screen'}>
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
                        <D3Graph data={mapData} isFullscreen={isFullscreen} />
                    </div>
                )}
            </div>
        </Card>
    );
};