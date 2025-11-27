import React, { useState, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { generateCodeAnalysis, explainCodeAnalysis } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Loader } from '../ui/Loader';
import { Mermaid } from '../ui/Mermaid';
import { CodeAnalysisResult } from '../../types';


type ArtifactType = 'code' | 'algorithm' | 'pseudocode' | 'flowchart';

const CodeAnalysis: React.FC = () => {
    const { addNotification, language, llm } = useAppContext();
    const [code, setCode] = useState('');
    const [analysisResult, setAnalysisResult] = useState<CodeAnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // Explanation State
    const [explanationArtifact, setExplanationArtifact] = useState('');
    const [explanationType, setExplanationType] = useState<ArtifactType>('code');
    const [explanationResult, setExplanationResult] = useState<string | null>(null);
    const [isExplaining, setIsExplaining] = useState(false);

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
        } catch (e: any) {
            addNotification(e.message);
        } finally {
            setIsLoading(false);
        }
    }, [code, addNotification, language, llm]);

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
        }
    }

    return (
        <div className="space-y-6">
            <Card title="Code Analysis & Generation">
                <div className="space-y-4">
                    <textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="// Paste your code here (e.g., Python, JavaScript, Java)..."
                        className="w-full h-48 bg-slate-900 border border-slate-700 rounded-md p-3 text-slate-300 font-mono text-sm focus:ring-2 focus:ring-red-500 focus:outline-none transition"
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
                                <h3 className="text-xl font-semibold text-red-400">
                                    {key.charAt(0).toUpperCase() + key.slice(1)}
                                </h3>
                                
                                {key === 'flowchart' ? (
                                    <div className="bg-slate-900 p-3 rounded-md border border-slate-700 overflow-hidden">
                                        <Mermaid chart={value} />
                                    </div>
                                ) : (
                                    <div className="bg-slate-900 p-3 rounded-md border border-slate-700 h-64 overflow-y-auto whitespace-pre-wrap text-sm text-slate-300 custom-scrollbar">
                                        {value}
                                    </div>
                                )}

                                <Button onClick={() => copyToExplain(key as ArtifactType)} variant="secondary" className="text-xs w-full">
                                    Copy to Explain
                                </Button>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            <Card title="Explanation Tool">
                 <div className="flex flex-col space-y-4">
                    <div className="flex items-center gap-2 p-1 bg-slate-800 rounded-md">
                        {(['code', 'algorithm', 'pseudocode', 'flowchart'] as ArtifactType[]).map(type => (
                            <button key={type} onClick={() => { setExplanationType(type); setExplanationArtifact(''); }} 
                                className={`px-3 py-1 text-xs rounded transition-colors ${explanationType === type ? 'bg-red-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </button>
                        ))}
                    </div>
                    <textarea
                        value={explanationArtifact}
                        onChange={(e) => setExplanationArtifact(e.target.value)}
                        placeholder={`Paste the ${explanationType} here to get an explanation...`}
                        className="w-full h-32 bg-slate-900 border border-slate-700 rounded-md p-3 text-slate-300 font-mono text-sm focus:ring-2 focus:ring-red-500 focus:outline-none transition"
                        disabled={isExplaining}
                    />
                    <Button onClick={handleExplain} disabled={!explanationArtifact.trim() || isExplaining} className="w-full">
                        {isExplaining ? 'Explaining...' : `Explain ${explanationType.charAt(0).toUpperCase() + explanationType.slice(1)}`}
                    </Button>
                    {isExplaining && <Loader />}
                    {explanationResult && (
                         <div className="fade-in mt-4">
                             <h4 className="text-lg font-semibold text-slate-200 mb-2">AI Explanation</h4>
                             <p className="text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-900 p-4 rounded-md border border-slate-700">{explanationResult}</p>
                         </div>
                    )}
                 </div>
            </Card>
        </div>
    );
};

export default CodeAnalysis;