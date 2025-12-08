import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { conductMockInterview } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Loader } from '../ui/Loader';
import { ChatMessage, Difficulty } from '../../types';
import { MarkdownRenderer } from '../ui/MarkdownRenderer';

interface MockInterviewProps {
    topic: string;
    onClose: () => void;
}

export const MockInterview: React.FC<MockInterviewProps> = ({ topic, onClose }) => {
    const { llm, language, addNotification, updateProgress } = useAppContext();
    const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
    const [status, setStatus] = useState<'setup' | 'active' | 'feedback'>('setup');
    
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);

    const startInterview = async () => {
        setStatus('active');
        setIsLoading(true);
        // Initial context seeding
        const initialPrompt = "Hello, I am ready for the interview.";
        
        try {
            // FIX: Pass empty history for the very first turn
            const response = await conductMockInterview(llm, topic, initialPrompt, [], language, difficulty);
            
            // Manually set state to include the hidden initial prompt + AI response
            setChatHistory([
                { role: 'user', content: initialPrompt }, 
                { role: 'model', content: response }
            ]);
        } catch (e: any) {
            console.error(e);
            addNotification("Failed to start interview. Check console for details.", "error");
            setStatus('setup');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!currentMessage.trim()) return;

        // 1. Create the new history for the UI immediately
        const userMsg: ChatMessage = { role: 'user', content: currentMessage };
        
        // IMPORTANT: We do NOT send 'newHistory' to the backend. We send the OLD 'chatHistory'.
        // The backend appends the current message to the history automatically.
        const newHistory = [...chatHistory, userMsg];
        
        setChatHistory(newHistory); // Update UI
        setCurrentMessage('');
        setIsLoading(true);

        try {
            let response;
            
            // FIX: Pass 'chatHistory' (the history BEFORE this message), NOT 'newHistory'
            if (currentMessage.toLowerCase().includes('end interview') || currentMessage.toLowerCase().includes('stop')) {
                 response = await conductMockInterview(llm, topic, currentMessage, chatHistory, language, difficulty);
                 setStatus('feedback');
                 updateProgress(100, topic); 
            } else {
                 response = await conductMockInterview(llm, topic, currentMessage, chatHistory, language, difficulty);
            }

            // 3. Update UI with the AI's response
            setChatHistory(prev => [...prev, { role: 'model', content: response }]);

        } catch (e: any) {
             console.error(e);
             addNotification("Failed to get response.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card title={`Mock Interview: ${topic}`} className="h-[600px] flex flex-col">
            {/* SETUP SCREEN */}
            {status === 'setup' && (
                <div className="flex flex-col items-center justify-center h-full space-y-8 animate-in fade-in">
                    <div className="text-center space-y-2">
                        <h3 className="text-xl font-bold text-slate-200">Ready to practice?</h3>
                        <p className="text-slate-400 max-w-md">I will act as your technical interviewer. I'll ask questions, evaluate your answers, and provide hints if you get stuck.</p>
                    </div>

                    <div className="space-y-2 w-full max-w-xs">
                        <label className="text-sm font-medium text-slate-300">Select Difficulty</label>
                        <select 
                            value={difficulty} 
                            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-slate-200 focus:ring-2 focus:ring-red-500 outline-none"
                        >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                        </select>
                    </div>

                    <div className="flex gap-4">
                        <Button onClick={onClose} variant="secondary">Cancel</Button>
                        <Button onClick={startInterview}>Start Interview</Button>
                    </div>
                </div>
            )}

            {/* ACTIVE INTERVIEW / FEEDBACK SCREEN */}
            {(status === 'active' || status === 'feedback') && (
                <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                         <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">{status === 'feedback' ? 'Interview Complete' : 'Live Interview'}</span>
                         <button onClick={onClose} className="text-slate-400 hover:text-white text-sm">Exit</button>
                    </div>

                    <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                        {chatHistory.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-red-900/40 border border-red-500/30' : 'bg-slate-800 border border-slate-700'}`}>
                                    {msg.role === 'model' ? (
                                        <div className="text-slate-200 text-sm">
                                            <MarkdownRenderer content={msg.content} />
                                        </div>
                                    ) : (
                                        <p className="text-slate-200 text-sm whitespace-pre-wrap">{msg.content}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                         {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg">
                                    <Loader spinnerClassName="w-5 h-5" />
                                </div>
                            </div>
                        )}
                    </div>

                    {status === 'active' && (
                        <div className="mt-4 pt-4 border-t border-slate-700 flex gap-2">
                             <input
                                type="text"
                                value={currentMessage}
                                onChange={(e) => setCurrentMessage(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !isLoading) handleSendMessage(); }}
                                placeholder="Type your answer... (or 'End Interview' to finish)"
                                className="flex-1 bg-slate-900 border border-slate-700 rounded-md p-3 text-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none transition"
                                disabled={isLoading}
                                autoFocus
                            />
                            <Button onClick={handleSendMessage} disabled={!currentMessage.trim() || isLoading}>
                                Send
                            </Button>
                        </div>
                    )}

                    {status === 'feedback' && (
                        <div className="mt-4 pt-4 border-t border-slate-700 text-center">
                            <p className="text-green-400 mb-4">Interview Completed. Review the feedback above.</p>
                            <Button onClick={onClose}>Close Session</Button>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
};