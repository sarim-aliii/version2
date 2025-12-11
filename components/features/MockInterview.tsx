import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { conductMockInterview } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Loader } from '../ui/Loader';
import { ChatMessage, Difficulty } from '../../types';
import { MarkdownRenderer } from '../ui/MarkdownRenderer';
import { useSpeech } from '../../hooks/useSpeech';

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
    
    // --- VOICE MODE STATE & HOOKS ---
    const [isVoiceMode, setIsVoiceMode] = useState(false);
    
    const { 
        isListening, 
        transcript, 
        startListening, 
        stopListening, 
        speak, 
        cancelSpeaking, 
        browserSupportsSpeech,
        setTranscript 
    } = useSpeech(language);

    const chatContainerRef = useRef<HTMLDivElement>(null);

    // --- API HOOKS ---
    // Note: We ignore the 'data' property here and use the promise result directly 
    // to prevent duplicate effects/speaking triggers.
    const { 
        execute: initInterview, 
        loading: isStarting 
    } = useApi(conductMockInterview);

    const { 
        execute: sendMessage, 
        loading: isSending 
    } = useApi(conductMockInterview);

    // Scroll to bottom on updates
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory, isSending]);

    // Sync Voice Transcript to Input
    useEffect(() => {
        if (isVoiceMode && isListening) {
            setCurrentMessage(transcript);
        }
    }, [transcript, isVoiceMode, isListening]);

    // Cleanup audio on unmount
    useEffect(() => {
        return () => cancelSpeaking();
    }, [cancelSpeaking]);

    const handleClose = () => {
        cancelSpeaking();
        onClose();
    };

    const startInterview = async () => {
        setStatus('active');
        const initialPrompt = "Hello, I am ready for the interview.";
        
        // Optimistic update for user message (implicit)
        
        try {
            const response = await initInterview(llm, topic, initialPrompt, [], language, difficulty);
            
            if (response) {
                setChatHistory([
                    { role: 'user', content: initialPrompt }, 
                    { role: 'model', content: response }
                ]);
                
                if (isVoiceMode) {
                    speak(response);
                }
            }
        } catch (e) {
            // Error handled by useApi toast
            setStatus('setup');
        }
    };

    const handleSendMessage = async () => {
        if (!currentMessage.trim()) return;

        // Ensure listening is stopped if user clicks send manually while recording
        if (isListening) stopListening();

        const userMsg: ChatMessage = { role: 'user', content: currentMessage };
        
        // 1. Update UI immediately
        const newHistory = [...chatHistory, userMsg];
        setChatHistory(newHistory); 
        setCurrentMessage('');
        setTranscript(''); // Clear voice buffer

        // 2. Check for exit command
        const isEnding = currentMessage.toLowerCase().includes('end interview') || currentMessage.toLowerCase().includes('stop');

        if (isEnding) {
             setStatus('feedback');
             updateProgress(100, topic); 
        }

        try {
            // 3. Send to AI
            // We pass chatHistory (state before this message) as context because that's what the API expects
            // or we could pass newHistory if the backend handles duplication. 
            // Based on geminiService, it appends the current message to history for the prompt.
            const response = await sendMessage(llm, topic, userMsg.content, chatHistory, language, difficulty);
            
            if (response) {
                setChatHistory(prev => [...prev, { role: 'model', content: response }]);
                
                if (isVoiceMode) {
                    speak(response);
                }
            }
        } catch (e) {
            // Error handled by hook
        }
    };

    // Combined loading state
    const isLoading = isStarting || isSending;

    return (
        <Card title={`Mock Interview: ${topic}`} className="h-[600px] flex flex-col relative">
            {/* SETUP SCREEN */}
            {status === 'setup' && (
                <div className="flex flex-col items-center justify-center h-full space-y-8 animate-in fade-in">
                    <div className="text-center space-y-2">
                        <h3 className="text-xl font-bold text-slate-200">Ready to practice?</h3>
                        <p className="text-slate-400 max-w-md">I will act as your technical interviewer. I'll ask questions, evaluate your answers, and provide hints if you get stuck.</p>
                    </div>

                    <div className="space-y-4 w-full max-w-xs flex flex-col items-center">
                        <div className="w-full">
                            <label className="text-sm font-medium text-slate-300 mb-1 block">Select Difficulty</label>
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

                        {browserSupportsSpeech && (
                             <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-900/50 border border-slate-700 rounded-md w-full justify-center hover:bg-slate-800 transition-colors">
                                <input 
                                    type="checkbox" 
                                    checked={isVoiceMode} 
                                    onChange={() => setIsVoiceMode(!isVoiceMode)} 
                                    className="accent-red-500 w-4 h-4"
                                />
                                <span className={`text-sm font-medium ${isVoiceMode ? 'text-red-400' : 'text-slate-400'}`}>
                                    Enable Voice Mode 🎙️
                                </span>
                            </label>
                        )}
                    </div>

                    <div className="flex gap-4">
                        <Button onClick={handleClose} variant="secondary">Cancel</Button>
                        <Button onClick={startInterview} disabled={isStarting}>
                            {isStarting ? 'Starting...' : 'Start Interview'}
                        </Button>
                    </div>
                </div>
            )}

            {/* ACTIVE INTERVIEW / FEEDBACK SCREEN */}
            {(status === 'active' || status === 'feedback') && (
                <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                         <div className="flex items-center gap-3">
                             <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                                {status === 'feedback' ? 'Interview Complete' : 'Live Interview'}
                             </span>
                             {/* Mini Voice Toggle */}
                             {browserSupportsSpeech && status === 'active' && (
                                <button 
                                    onClick={() => {
                                        setIsVoiceMode(!isVoiceMode);
                                        cancelSpeaking(); // Stop any current speech if toggled off
                                    }}
                                    className={`p-1 rounded-full transition-colors ${isVoiceMode ? 'bg-red-500/20 text-red-400' : 'text-slate-600 hover:text-slate-400'}`}
                                    title={isVoiceMode ? "Disable Voice" : "Enable Voice"}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                                    </svg>
                                </button>
                             )}
                         </div>
                         <button onClick={handleClose} className="text-slate-400 hover:text-white text-sm">Exit</button>
                    </div>

                    {/* Chat History */}
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
                                <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg flex items-center gap-2">
                                    <Loader spinnerClassName="w-4 h-4" />
                                    <span className="text-xs text-slate-400">Interviewer is thinking...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    {status === 'active' && (
                        <div className="mt-4 pt-4 border-t border-slate-700 flex gap-2 items-end">
                             {/* Mic Button (Only visible in Voice Mode) */}
                             {isVoiceMode && (
                                 <button
                                    onMouseDown={startListening}
                                    onMouseUp={stopListening}
                                    onMouseLeave={stopListening} // Stop if dragged out
                                    onTouchStart={startListening}
                                    onTouchEnd={stopListening}
                                    disabled={isLoading}
                                    className={`p-3.5 rounded-lg border transition-all duration-200 flex-shrink-0 ${
                                        isListening 
                                        ? 'bg-red-600 border-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)] scale-105' 
                                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'
                                    }`}
                                    title="Hold to Speak"
                                 >
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                                    </svg>
                                 </button>
                             )}

                             <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={currentMessage}
                                    onChange={(e) => setCurrentMessage(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !isLoading) handleSendMessage(); }}
                                    placeholder={isVoiceMode ? "Hold mic to speak, or type..." : "Type your answer... (or 'End Interview')"}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 pr-10 text-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none transition disabled:opacity-50"
                                    disabled={isLoading}
                                    autoFocus
                                />
                                {isVoiceMode && isListening && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                    </span>
                                )}
                             </div>

                            <Button onClick={handleSendMessage} disabled={!currentMessage.trim() || isLoading}>
                                Send
                            </Button>
                        </div>
                    )}

                    {status === 'feedback' && (
                        <div className="mt-4 pt-4 border-t border-slate-700 text-center">
                            <p className="text-green-400 mb-4 font-medium">Interview Completed. Review the AI feedback above.</p>
                            <Button onClick={handleClose}>Close Session</Button>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
};