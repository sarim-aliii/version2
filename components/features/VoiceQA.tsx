import React, { useState, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { FileUploader } from '../ui/FileUploader';
import { useAppContext } from '../../context/AppContext';
import { EmptyState } from '../ui/EmptyState';
import { transcribeAudio, transcribeYoutube, generateSummary, generateFlashcards, generateAnswer } from '../../services/geminiService';
import { Loader } from '../ui/Loader';
import { Flashcard as FlashcardType } from '../../types';

type AnalysisAction = 'summary' | 'flashcards' | 'qa';

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
};

export const AudioAnalysis: React.FC = () => {
  const { addNotification, language, llm } = useAppContext();
  
  // Media File State
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  
  // YouTube Link State
  const [youtubeLink, setYoutubeLink] = useState('');
  
  // General State
  const [transcribedText, setTranscribedText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState<AnalysisAction | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [flashcards, setFlashcards] = useState<FlashcardType[]>([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);

  const acceptedMimeTypes = {
    'audio/wav': ['.wav'],
    'audio/mpeg': ['.mp3'],
    'audio/mp4': ['.m4a'],
    'audio/x-m4a': ['.m4a'],
    'video/mp4': ['.mp4'],
    'video/quicktime': ['.mov'],
    'video/webm': ['.webm'],
  };

  const resetState = () => {
    setTranscribedText(null);
    setSummary(null);
    setFlashcards([]);
    setQuestion('');
    setAnswer(null);
    setCurrentAction(null);
  };

  const handleFileUpload = (files: File[]) => {
    if (files.length > 0) {
        setMediaFile(files[0]);
        setYoutubeLink('');
        resetState();
    }
  };

  // Handle File Transcription
  const handleTranscribeFile = useCallback(async () => {
    if (!mediaFile) return;
    setIsLoading(true);
    resetState();
    try {
        const base64Data = await fileToBase64(mediaFile);
        const transcription = await transcribeAudio(llm, base64Data, mediaFile.type);
        setTranscribedText(transcription);
    } catch (e: any) {
        addNotification(e.message);
    } finally {
        setIsLoading(false);
    }
  }, [mediaFile, addNotification, llm]);

  // Handle YouTube Transcription
  const handleTranscribeYoutube = useCallback(async () => {
    if (!youtubeLink.trim()) {
        addNotification('Please enter a YouTube URL.', 'info');
        return;
    }
    setIsLoading(true);
    resetState();
    try {
        const transcription = await transcribeYoutube(llm, youtubeLink);
        setTranscribedText(transcription);
    } catch (e: any) {
        addNotification(e.message);
    } finally {
        setIsLoading(false);
    }
  }, [youtubeLink, addNotification, llm]);

  const handleAction = async (action: AnalysisAction) => {
    if (!transcribedText) return;
    setCurrentAction(action);
    setIsLoading(true);

    try {
        if (action === 'summary') {
            setSummary(null);
            const result = await generateSummary(llm, transcribedText, language);
            setSummary(result);
        } 
        else if (action === 'flashcards') {
            setFlashcards([]);
            const result = await generateFlashcards(llm, transcribedText, language);
            setFlashcards(result);
        } 
        else if (action === 'qa') {
            if(!question.trim()) {
                addNotification('Please enter a question.', 'info');
                setIsLoading(false);
                return;
            }
            setAnswer(null);
            const result = await generateAnswer(llm, transcribedText, question, language);
            setAnswer(result);
        }
    } 
    catch(e: any) {
        addNotification(e.message);
    } 
    finally {
        setIsLoading(false);
        setCurrentAction(null);
    }
  };

  return (
    <div className="space-y-6">
        <Card title="Audio & Video Analysis">
            <div className="space-y-6">
                
                <div className={`transition-opacity ${youtubeLink ? 'opacity-50' : 'opacity-100'}`}>
                    <FileUploader 
                        onFileUpload={handleFileUpload} 
                        acceptedMimeTypes={acceptedMimeTypes} 
                        multiple={false}
                        unsupportedFormatError="Unsupported format."
                        onError={addNotification}
                    />
                    {mediaFile && (
                        <div className="flex items-center justify-between mt-3 p-3 bg-slate-900 rounded-md border border-slate-700">
                             <p className="text-sm text-slate-300 truncate">Selected: <strong>{mediaFile.name}</strong></p>
                             <Button onClick={handleTranscribeFile} disabled={isLoading} className="text-sm py-1 px-3">
                                {isLoading && !transcribedText ? 'Transcribing...' : 'Transcribe File'}
                            </Button>
                        </div>
                    )}
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-slate-800 text-slate-400">OR USE YOUTUBE</span>
                    </div>
                </div>

                <div className={`flex flex-col sm:flex-row gap-3 transition-opacity ${mediaFile ? 'opacity-50' : 'opacity-100'}`}>
                    <input 
                        type="text" 
                        value={youtubeLink}
                        onChange={(e) => {
                            setYoutubeLink(e.target.value);
                            setMediaFile(null);
                            resetState();
                        }}
                        placeholder="Paste YouTube Video URL here..." 
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-md p-3 text-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none transition"
                        disabled={isLoading}
                    />
                    <Button onClick={handleTranscribeYoutube} disabled={!youtubeLink.trim() || isLoading} className="sm:w-auto">
                        {isLoading && !transcribedText ? 'Fetching...' : 'Transcribe YouTube'}
                    </Button>
                </div>

            </div>
        </Card>

        {/* Loading Indicator */}
        {isLoading && !transcribedText && (
            <div className="flex flex-col items-center gap-4 py-8">
                <Loader />
                <p className="text-slate-400">Processing content...</p>
            </div>
        )}
        
        {/* Results Section */}
        {transcribedText && (
            <Card title="Analysis Results" className="fade-in">
                <div className="space-y-6">
                    <div>
                        <h3 className="text-xl font-semibold text-slate-200 mb-2">Transcript</h3>
                        <div className="bg-slate-900 p-4 rounded-md border border-slate-700 max-h-60 overflow-y-auto custom-scrollbar">
                            <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{transcribedText}</p>
                        </div>
                    </div>
                    
                    <hr className="border-slate-700"/>
                    
                    <div>
                         <h3 className="text-xl font-semibold text-slate-200 mb-4">AI Tools</h3>
                         <div className="grid grid-cols-1 gap-4">
                            
                            {/* Summary Tool */}
                            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-semibold text-slate-300">Summary</h4>
                                    <Button onClick={() => handleAction('summary')} disabled={isLoading} variant="secondary" className="text-xs">Generate</Button>
                                </div>
                                {isLoading && currentAction === 'summary' && <Loader spinnerClassName="w-6 h-6" />}
                                {summary && <p className="text-slate-300 text-sm whitespace-pre-wrap fade-in">{summary}</p>}
                            </div>

                            {/* Flashcards Tool */}
                             <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-semibold text-slate-300">Flashcards</h4>
                                    <Button onClick={() => handleAction('flashcards')} disabled={isLoading} variant="secondary" className="text-xs">Generate</Button>
                                </div>
                                {isLoading && currentAction === 'flashcards' && <Loader spinnerClassName="w-6 h-6" />}
                                {flashcards.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 fade-in">
                                        {flashcards.map((fc, i) => (
                                            <div key={i} className="p-3 bg-slate-900/80 rounded border border-slate-600">
                                                <p className="text-xs text-slate-400 mb-1">Q: {fc.question}</p>
                                                <p className="text-sm text-slate-200">A: {fc.answer}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Q&A Tool */}
                            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                                <h4 className="font-semibold text-slate-300 mb-3">Ask a Question</h4>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={question} 
                                        onChange={e => setQuestion(e.target.value)} 
                                        placeholder="What did the speaker say about..." 
                                        className="flex-1 bg-slate-900 border border-slate-700 rounded text-sm p-2 text-slate-300 focus:ring-1 focus:ring-red-500 outline-none" 
                                        onKeyDown={(e) => e.key === 'Enter' && handleAction('qa')}
                                    />
                                    <Button onClick={() => handleAction('qa')} disabled={isLoading || !question.trim()}>Ask</Button>
                                </div>
                                {isLoading && currentAction === 'qa' && <div className="mt-3"><Loader spinnerClassName="w-6 h-6" /></div>}
                                {answer && (
                                    <div className="mt-3 p-3 bg-slate-900/80 rounded border-l-2 border-red-500 fade-in">
                                        <p className="text-slate-300 text-sm">{answer}</p>
                                    </div>
                                )}
                            </div>

                         </div>
                    </div>
                </div>
            </Card>
        )}

        {!mediaFile && !youtubeLink && !transcribedText && <EmptyState 
            title="Audio & Video Analysis"
            message="Upload a lecture recording or paste a YouTube link. Kairon AI will transcribe it, enabling you to summarize, study, and ask questions about the content."
        />}
    </div>
  );
};