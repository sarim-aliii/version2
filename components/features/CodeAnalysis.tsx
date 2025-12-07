import React, { useState, useCallback, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { generateCodeAnalysis, explainCodeAnalysis } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Loader } from '../ui/Loader';
import { Mermaid } from '../ui/Mermaid';
import { CodeAnalysisResult } from '../../types';
import { MarkdownRenderer } from '../ui/MarkdownRenderer';

type ArtifactType = 'code' | 'algorithm' | 'pseudocode' | 'flowchart';

const CodeAnalysis: React.FC = () => {
    const { addNotification, language, llm, activeProject, updateActiveProjectData } = useAppContext();
    
    const [code, setCode] = useState(activeProject?.codeSnippet || '');
    const [analysisResult, setAnalysisResult] = useState<CodeAnalysisResult | null>(activeProject?.codeAnalysis || null);
    const [isLoading, setIsLoading] = useState(false);
    
    const [mermaidTheme, setMermaidTheme] = useState<'dark' | 'default'>('dark');
    
    const [explanationArtifact, setExplanationArtifact] = useState('');
    const [explanationType, setExplanationType] = useState<ArtifactType>('code');
    const [explanationResult, setExplanationResult] = useState<string | null>(null);
    const [isExplaining, setIsExplaining] = useState(false);

    // State for text fullscreen mode
    const [expandedArtifact, setExpandedArtifact] = useState<{ title: string, content: string } | null>(null);

    useEffect(() => {
        if (activeProject) {
            setCode(activeProject.codeSnippet || '');
            setAnalysisResult(activeProject.codeAnalysis || null);
        }
    }, [activeProject]);

    // Close fullscreen on Escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setExpandedArtifact(null);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const handleGenerate = useCallback(async () => {
        if (!code.trim()) {
            addNotification('Please paste code to analyze.', 'info');
            return;
        }
        setIsLoading(true);
        setAnalysisResult(null);
        setExplanationResult(null);
        try {
            const result = await generateCodeAnalysis(llm, code, language);
            setAnalysisResult(result);
            await updateActiveProjectData({ 
                codeSnippet: code,
                codeAnalysis: result 
            });
        } catch (e: any) {
            addNotification(e.message);
        } finally {
            setIsLoading(false);
        }
    }, [code, addNotification, language, llm, updateActiveProjectData]);

    const handleExplain = useCallback(async () => {
        if (!explanationArtifact.trim()) {
            addNotification(`Please provide the ${explanationType} to explain.`, 'info');
            return;
        }
        setIsExplaining(true);
        setExplanationResult(null);
        try {
            const result = await explainCodeAnalysis(llm, explanationArtifact, language, explanationType);
            setExplanationResult(result);
        } catch (e: any) {
            addNotification(e.message);
        } finally {
            setIsExplaining(false);
        }
    }, [explanationArtifact, explanationType, addNotification, language, llm]);

    const copyToExplain = (type: ArtifactType) => {
        if (analysisResult) {
            switch (type) {
                case 'algorithm': setExplanationArtifact(analysisResult.algorithm); break;
                case 'pseudocode': setExplanationArtifact(analysisResult.pseudocode); break;
                case 'flowchart': setExplanationArtifact(analysisResult.flowchart); break;
                default: break;
            }
            setExplanationType(type);
            // ADDED: Notification to inform user
            addNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} copied to Explanation Tool. Scroll down to view.`, 'success');
        }
    }

    const toggleMermaidTheme = () => {
        setMermaidTheme(prev => prev === 'dark' ? 'default' : 'dark');
    };

    const downloadArtifact = (type: string, content: string) => {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${type}_kairon_ai.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <Card title="Code Analysis & Generation">
                <div className="space-y-4">
                    <textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="// Paste your code here (e.g., Python, JavaScript, Java)..."
                        className="w-full h-48 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md p-3 text-slate-800 dark:text-slate-300 font-mono text-sm focus:ring-2 focus:ring-red-500 focus:outline-none transition"
                        disabled={isLoading}
                    />
                    <Button onClick={handleGenerate} disabled={!code.trim() || isLoading} className="w-full">
                        {isLoading ? 'Analyzing Code...' : 'Generate Algorithm, Pseudocode & Flowchart'}
                    </Button>
                </div>
            </Card>

            {isLoading && <Loader />}

            {analysisResult && (
                <Card title="Generated Artifacts" className="fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(analysisResult).map(([key, value]) => (
                            <div 
                                key={key} 
                                className={`space-y-2 ${key === 'flowchart' ? 'md:col-span-2' : ''}`}
                            > 
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-semibold text-red-600 dark:text-red-400">
                                        {key.charAt(0).toUpperCase() + key.slice(1)}
                                    </h3>
                                    {key === 'flowchart' && (
                                        <button 
                                            onClick={toggleMermaidTheme}
                                            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white underline"
                                        >
                                            Theme: {mermaidTheme === 'dark' ? 'Dark' : 'Light'}
                                        </button>
                                    )}
                                </div>
                                
                                {key === 'flowchart' ? (
                                    <div className={`p-1 rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden ${mermaidTheme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
                                        <Mermaid chart={value} theme={mermaidTheme} />
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 dark:bg-slate-900 p-3 rounded-md border border-slate-200 dark:border-slate-700 h-64 overflow-y-auto whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 custom-scrollbar font-mono">
                                        {value}
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <Button onClick={() => copyToExplain(key as ArtifactType)} variant="secondary" className="text-xs flex-1">
                                        Copy to Explain
                                    </Button>
                                    {/* Action Buttons for Text Artifacts */}
                                    {key !== 'flowchart' && (
                                        <>
                                            {/* Fullscreen Button */}
                                            <Button 
                                                onClick={() => setExpandedArtifact({ title: key, content: value })} 
                                                variant="secondary" 
                                                className="text-xs px-3" 
                                                title="Fullscreen"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 011 1v1.586l2.293-2.293a1 1 0 011.414 1.414L5.414 15H7a1 1 0 010 2H3a1 1 0 01-1-1v-4a1 1 0 011-1zm10 0a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                                                </svg>
                                            </Button>
                                            {/* Download Button */}
                                            <Button onClick={() => downloadArtifact(key, value)} variant="secondary" className="text-xs px-3" title="Download as Text">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            <Card title="Explanation Tool">
                 <div className="flex flex-col space-y-4">
                    <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-slate-800 rounded-md">
                        {(['code', 'algorithm', 'pseudocode', 'flowchart'] as ArtifactType[]).map(type => (
                            <button key={type} onClick={() => { setExplanationType(type); setExplanationArtifact(''); }} 
                                className={`px-3 py-1 text-xs rounded transition-colors ${explanationType === type ? 'bg-red-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'}`}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </button>
                        ))}
                    </div>
                    <textarea
                        value={explanationArtifact}
                        onChange={(e) => setExplanationArtifact(e.target.value)}
                        placeholder={`Paste the ${explanationType} here to get an explanation...`}
                        className="w-full h-32 bg-gray-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md p-3 text-slate-800 dark:text-slate-300 font-mono text-sm focus:ring-2 focus:ring-red-500 focus:outline-none transition"
                        disabled={isExplaining}
                    />
                    <Button onClick={handleExplain} disabled={!explanationArtifact.trim() || isExplaining} className="w-full">
                        {isExplaining ? 'Explaining...' : `Explain ${explanationType.charAt(0).toUpperCase() + explanationType.slice(1)}`}
                    </Button>
                    {isExplaining && <Loader />}
                    {explanationResult && (
                         <div className="fade-in mt-4">
                             <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">AI Explanation</h4>
                             <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-md border border-slate-200 dark:border-slate-700 w-full overflow-hidden">
                                <MarkdownRenderer content={explanationResult} />
                             </div>
                         </div>
                    )}
                 </div>
            </Card>

            {/* FULLSCREEN MODAL */}
            {expandedArtifact && (
                <div className="fixed inset-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm flex flex-col p-4 md:p-8 animate-in fade-in duration-200">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-3xl font-bold text-red-600 dark:text-red-400 capitalize">{expandedArtifact.title}</h2>
                        <button 
                            onClick={() => setExpandedArtifact(null)}
                            className="p-2 rounded-full bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                            title="Close (Esc)"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-base text-slate-800 dark:text-slate-300 whitespace-pre-wrap shadow-2xl">
                        {expandedArtifact.content}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CodeAnalysis;