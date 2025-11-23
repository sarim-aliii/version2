import React, { useState, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { FileUploader } from '../ui/FileUploader';
import { useAppContext } from '../../context/AppContext';
import { EmptyState } from '../ui/EmptyState';
import { transcribeAudio, generateSummary, generateFlashcards, generateAnswer } from '../../services/geminiService';
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
  const [mediaFile, setMediaFile] = useState<File | null>(null);
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
        resetState();
    }
  };
  
  const handleTranscribe = useCallback(async () => {
    if (!mediaFile) {
        addNotification('Please upload an audio or video file first.', 'info');
        return;
    }
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
            <div className="space-y-4">
                <FileUploader 
                    onFileUpload={handleFileUpload} 
                    acceptedMimeTypes={acceptedMimeTypes} 
                    multiple={false}
                    unsupportedFormatError="Unsupported format. Please upload a WAV, MP3, M4A, MP4, MOV or WEBM file."
                    onError={addNotification}
                />
                {mediaFile && <p className="text-sm text-slate-400">Selected file: <strong>{mediaFile.name}</strong></p>}
                <div className="flex justify-end">
                    <Button onClick={handleTranscribe} disabled={!mediaFile || isLoading}>
                        {isLoading && !transcribedText ? 'Transcribing...' : 'Transcribe Media'}
                    </Button>
                </div>
            </div>
        </Card>

        {isLoading && !transcribedText && <div className="flex flex-col items-center gap-4"><Loader /><p className="text-slate-400">Transcribing media, this may take a moment...</p></div>}
        
        {transcribedText && (
            <Card title="Transcription & Analysis" className="fade-in">
                <div className="space-y-6">
                    <div>
                        <h3 className="text-xl font-semibold text-slate-200 mb-2">Full Transcript</h3>
                        <p className="text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-900 p-4 rounded-md border border-slate-700 max-h-60 overflow-y-auto">{transcribedText}</p>
                    </div>
                    <hr className="border-slate-700"/>
                    <div>
                         <h3 className="text-xl font-semibold text-slate-200 mb-4">Analyze Content</h3>
                         <div className="space-y-4">
                            {/* Summary */}
                            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                                <Button onClick={() => handleAction('summary')} disabled={isLoading}>Generate Summary</Button>
                                {isLoading && currentAction === 'summary' && <div className="mt-4"><Loader /></div>}
                                {summary && <p className="text-slate-300 mt-4 whitespace-pre-wrap fade-in">{summary}</p>}
                            </div>
                            {/* Flashcards */}
                             <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                                <Button onClick={() => handleAction('flashcards')} disabled={isLoading}>Generate Flashcards</Button>
                                {isLoading && currentAction === 'flashcards' && <div className="mt-4"><Loader /></div>}
                                {flashcards.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 fade-in">
                                        {flashcards.map(fc => <div key={fc.question} className="p-3 bg-slate-700 rounded-md"><strong>Q:</strong> {fc.question}<br/><strong>A:</strong> {fc.answer}</div>)}
                                    </div>
                                )}
                            </div>
                            {/* Q&A */}
                            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <input type="text" value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ask a question about the transcript..." className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none transition" />
                                    <Button onClick={() => handleAction('qa')} disabled={isLoading || !question.trim()}>Ask</Button>
                                </div>
                                {isLoading && currentAction === 'qa' && <div className="mt-4"><Loader /></div>}
                                {answer && <p className="text-slate-300 mt-4 whitespace-pre-wrap fade-in">{answer}</p>}
                            </div>
                         </div>
                    </div>
                </div>
            </Card>
        )}

        {!mediaFile && <EmptyState 
            title="Analyze Lecture Recordings"
            message="Upload an audio or video file of a lecture or meeting. The AI will transcribe it, allowing you to summarize, create flashcards, or ask questions about the content."
        />}
    </div>
  );
};