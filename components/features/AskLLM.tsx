import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi'; // 1. Import the hook
import { getTutorResponse, generateEssayOutline, generateEssayArguments } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Loader } from '../ui/Loader';
import { EmptyState } from '../ui/EmptyState';
import { ChatMessage, EssayOutline } from '../../types';

type AIToolMode = 'tutor' | 'essay';

const EssayOutlineDisplay: React.FC<{ outline: EssayOutline }> = ({ outline }) => (
    <div className="space-y-4 text-slate-300 bg-slate-900 p-4 rounded-md border border-slate-700">
        <h3 className="text-2xl font-bold text-red-400 text-center">{outline.title}</h3>
        <div>
            <h4 className="text-lg font-semibold text-slate-200 border-b border-slate-600 pb-1 mb-2">Introduction</h4>
            <p className="leading-relaxed">{outline.introduction}</p>
        </div>
        <div>
            <h4 className="text-lg font-semibold text-slate-200 border-b border-slate-600 pb-1 mb-2">Body</h4>
            <div className="space-y-3">
                {outline.body.map((section, index) => (
                    <div key={index}>
                        <h5 className="font-semibold text-slate-300">{section.heading}</h5>
                        <ul className="list-disc list-inside pl-4 text-slate-400">
                            {section.points.map((point, pIndex) => (
                                <li key={pIndex}>{point}</li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
        <div>
            <h4 className="text-lg font-semibold text-slate-200 border-b border-slate-600 pb-1 mb-2">Conclusion</h4>
            <p className="leading-relaxed">{outline.conclusion}</p>
        </div>
    </div>
);

export const AITutor: React.FC = () => {
  const { ingestedText, addNotification, language, llm } = useAppContext();
  const [mode, setMode] = useState<AIToolMode>('tutor');
  
  // Tutor state
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Essay Prep state
  const [essayTopic, setEssayTopic] = useState('');

  // --- API HOOKS ---

  // 1. Tutor Hook
  const { 
    execute: fetchTutorResponse, 
    loading: chatLoading 
  } = useApi(getTutorResponse);

  // 2. Outline Hook
  const { 
    execute: generateOutline, 
    loading: outlineLoading, 
    data: essayOutline, // Rename 'data' to 'essayOutline' for clarity
    setData: setEssayOutline 
  } = useApi(generateEssayOutline, "Essay outline generated!");

  // 3. Arguments Hook
  const { 
    execute: generateArgs, 
    loading: argsLoading, 
    data: essayArguments, // Rename 'data' to 'essayArguments'
    setData: setEssayArguments 
  } = useApi(generateEssayArguments, "Counter-arguments generated!");


  useEffect(() => {
    // Scroll to bottom of chat on new message
    if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, chatLoading]); // Added chatLoading to scroll when loading starts

  const handleSendMessage = useCallback(async () => {
    if (!ingestedText) {
      addNotification('Please ingest some text first to provide context.', 'info');
      return;
    }
    if (!currentMessage.trim()) return;

    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: currentMessage }];
    setChatHistory(newHistory);
    setCurrentMessage('');

    try {
      // The hook handles the loading state and error toast automatically
      const response = await fetchTutorResponse(llm, ingestedText, newHistory, currentMessage, language);
      
      if (response) {
        setChatHistory([...newHistory, { role: 'model', content: response }]);
      }
    } catch (e) {
      // If it fails, we might want to keep the user message but maybe mark it failed
      // For now, the global Toast will show the error, so we just catch it to prevent crashes.
    }
  }, [ingestedText, currentMessage, chatHistory, addNotification, language, llm, fetchTutorResponse]);

  const handleGenerateOutline = useCallback(async () => {
    if (!ingestedText) {
      addNotification('Please ingest some text first to provide context.', 'info');
      return;
    }
    if (!essayTopic.trim()) {
        addNotification('Please enter an essay topic or thesis.', 'info');
        return;
    }
    
    // Clear previous results
    setEssayOutline(null);
    setEssayArguments(null);

    await generateOutline(llm, ingestedText, essayTopic, language);
  }, [ingestedText, essayTopic, addNotification, language, llm, generateOutline, setEssayOutline, setEssayArguments]);

  const handleGenerateArguments = useCallback(async () => {
      if (!ingestedText || !essayTopic.trim()) return;
      
      // Clear previous args
      setEssayArguments(null);

      await generateArgs(llm, ingestedText, essayTopic, language);
  }, [ingestedText, essayTopic, language, llm, generateArgs, setEssayArguments]);

  if (!ingestedText) {
    return <EmptyState 
      title="AI Tutor & Essay Prep"
      message="Ingest your study material first. Then you can engage in a guided conversation with the AI Tutor or generate a structured essay outline."
    />;
  }

  const renderModeContent = () => {
    if (mode === 'tutor') {
      return (
        <>
            <div ref={chatContainerRef} className="h-96 overflow-y-auto bg-slate-900/50 p-4 rounded-md border border-slate-700 space-y-4 mb-4">
                {chatHistory.length === 0 && (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-slate-400">Ask a question to start your tutoring session.</p>
                    </div>
                )}
                {chatHistory.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-lg p-3 rounded-lg ${msg.role === 'user' ? 'bg-red-800/60' : 'bg-slate-700/80'}`}>
                            <p className="text-slate-200 whitespace-pre-wrap">{msg.content}</p>
                        </div>
                    </div>
                ))}
                 {chatLoading && (
                    <div className="flex justify-start">
                        <div className="max-w-lg p-3 rounded-lg bg-slate-700/80">
                           <Loader spinnerClassName="w-6 h-6"/>
                        </div>
                    </div>
                 )}
            </div>
            <div className="flex gap-4">
                <input
                    type="text"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !chatLoading) handleSendMessage(); }}
                    placeholder="Ask a question..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none transition"
                    disabled={chatLoading}
                />
                <Button onClick={handleSendMessage} disabled={!currentMessage.trim() || chatLoading}>
                    Send
                </Button>
            </div>
        </>
      );
    }
    
    // Essay mode
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <input
                    type="text"
                    value={essayTopic}
                    onChange={(e) => setEssayTopic(e.target.value)}
                    placeholder="Enter your essay topic or thesis statement..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none transition"
                    disabled={outlineLoading || argsLoading}
                />
                <Button onClick={handleGenerateOutline} disabled={!essayTopic.trim() || outlineLoading} className="w-full sm:w-auto flex-shrink-0">
                    {outlineLoading ? 'Generating...' : 'Generate Outline'}
                </Button>
            </div>
            
            {outlineLoading && <Loader />}
            
            {essayOutline && (
                <div className="space-y-4 fade-in">
                    <EssayOutlineDisplay outline={essayOutline} />
                    
                    <Button onClick={handleGenerateArguments} disabled={argsLoading} variant="secondary">
                        {argsLoading ? 'Thinking...' : "Generate Counter-Arguments"}
                    </Button>
                    
                    {argsLoading && <Loader />}
                    
                    {essayArguments && (
                        <div className="fade-in">
                             <h4 className="text-lg font-semibold text-slate-200 border-b border-slate-600 pb-1 mb-2">Counter-Arguments & Considerations</h4>
                             <p className="text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-900 p-4 rounded-md border border-slate-700">{essayArguments}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-6 border-b border-slate-700 pb-3">
        <h2 className="text-2xl font-bold text-slate-100">{mode === 'tutor' ? 'AI Tutor' : 'Essay Prep'}</h2>
        <div className="flex items-center gap-2 p-1 bg-slate-900 rounded-md">
            <button onClick={() => setMode('tutor')} className={`px-3 py-1 text-sm rounded transition-colors ${mode === 'tutor' ? 'bg-red-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>Tutor</button>
            <button onClick={() => setMode('essay')} className={`px-3 py-1 text-sm rounded transition-colors ${mode === 'essay' ? 'bg-red-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>Essay Prep</button>
        </div>
      </div>
      {renderModeContent()}
    </Card>
  );
};