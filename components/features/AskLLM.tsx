import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Loader } from '../ui/Loader';
import { EmptyState } from '../ui/EmptyState';
import { useSpeech } from '../../hooks/useSpeech';
import { ChatMessage } from '../../types';

const ChatBubble: React.FC<{ message: ChatMessage; onSpeak: (text: string) => void }> = ({ message, onSpeak }) => {
    const isModel = message.role === 'model';
    return (
        <div className={`flex items-start gap-3 ${isModel ? '' : 'flex-row-reverse'}`}>
            {isModel && <div className="w-8 h-8 rounded-full bg-red-500 flex-shrink-0 flex items-center justify-center font-bold text-white">AI</div>}
            <div className={`max-w-xl p-3 rounded-lg ${isModel ? 'bg-slate-700' : 'bg-red-800'}`}>
                <p className="text-slate-200 whitespace-pre-wrap">{message.content}</p>
                 {isModel && (
                    <button onClick={() => onSpeak(message.content)} className="text-slate-400 hover:text-white mt-2 p-1 rounded-full hover:bg-slate-600 transition-colors" aria-label="Read response aloud">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                           <path d="M10 2a6 6 0 00-6 6v3.586l-1.707 1.707A1 1 0 003 15v1a1 1 0 001 1h12a1 1 0 001-1v-1a1 1 0 00-.293-.707L16 11.586V8a6 6 0 00-6-6zM8.293 16a1 1 0 011.414 0l.001.001A2 2 0 0012 15a2 2 0 002.292 1.001l.001-.001a1 1 0 011.414 0h-6.818z" />
                        </svg>
                    </button>
                 )}
            </div>
        </div>
    );
};


export const AITutor: React.FC = () => {
    const { activeProject, projects, language, isTutorResponding, sendTutorMessage, addNotification } = useAppContext();
    const { isListening, transcript, startListening, stopListening, isSpeaking, speak, cancelSpeaking, browserSupportsSpeech, setTranscript, error: speechError } = useSpeech(language);
    
    const [input, setInput] = useState('');
    const chatHistory = activeProject?.aiTutorHistory || [];
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const isProcessing = isTutorResponding || isListening || isSpeaking;

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory, isTutorResponding]);

    useEffect(() => {
        setInput(transcript);
    }, [transcript]);
    
    useEffect(() => {
        if (speechError) {
            addNotification(speechError, 'error');
        }
    }, [speechError, addNotification]);

    const handleSend = useCallback(async () => {
        if (!input.trim() || !activeProject) return;
        const message = input;
        
        cancelSpeaking();
        stopListening();
        setTranscript('');
        setInput('');
        
        await sendTutorMessage(message);
        // Do not auto-speak. Let the user decide.
        // if (responseText) {
        //     speak(responseText);
        // }

    }, [input, activeProject, cancelSpeaking, stopListening, setTranscript, sendTutorMessage]);

    const handleMicClick = () => {
        if (isListening) {
            stopListening();
        } else {
            cancelSpeaking();
            setInput('');
            setTranscript('');
            startListening();
        }
    };
    
    if (!projects.length) {
        return <EmptyState title="AI Tutor" message="Engage in a conversation with an AI tutor. Ingest your study material to get personalized help and answers." />;
    }
    
    if (!activeProject) {
        return <EmptyState title="Select a Study" message="Please select a study from the sidebar to start a conversation with the AI tutor." />;
    }

    if (activeProject.status !== 'ready') {
        return <EmptyState title="Study is Processing" message="Please wait for the current study to finish processing before using the AI Tutor." />;
    }

    return (
        <Card title="AI Tutor">
            <div className="flex flex-col h-[75vh]">
                <div ref={chatContainerRef} className="flex-1 space-y-4 overflow-y-auto p-4 bg-slate-900/50 rounded-t-lg border border-b-0 border-slate-700">
                    {chatHistory.map((msg, index) => (
                        <ChatBubble key={index} message={msg} onSpeak={speak} />
                    ))}
                    {isTutorResponding && (
                        <div className="flex justify-start">
                             <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-red-500 flex-shrink-0 flex items-center justify-center font-bold text-white">AI</div>
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-700">
                                    <Loader spinnerClassName="w-5 h-5" />
                                    <span className="text-slate-400 text-sm">AI is thinking...</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-4 bg-slate-800 border border-slate-700 rounded-b-lg">
                    <div className="flex items-center gap-2">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            placeholder={isListening ? 'Listening...' : 'Ask a question about your study material...'}
                            className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none transition resize-none"
                            rows={2}
                            disabled={isProcessing}
                        />
                        {browserSupportsSpeech && (
                           <Button onClick={handleMicClick} variant="secondary" disabled={isSpeaking} className={`!p-3 ${isListening ? 'bg-red-600 hover:bg-red-700 ring-red-500 animate-pulse' : ''}`} aria-label={isListening ? 'Stop listening' : 'Start listening'}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93V17h-2v-2.07A8.002 8.002 0 012 8V6a1 1 0 011-1h1a1 1 0 011 1v2a5 5 0 0010 0V6a1 1 0 011 1h1a1 1 0 011 1v2a8.002 8.002 0 01-6 8.93z" clipRule="evenodd" /></svg>
                           </Button>
                        )}
                        <Button onClick={handleSend} disabled={!input.trim() || isProcessing} className="!p-3" aria-label="Send message">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
};
