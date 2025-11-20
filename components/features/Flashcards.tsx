import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { generateFlashcards } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Loader } from '../ui/Loader';
import { SRFlashcard } from '../../types';
import { EmptyState } from '../ui/EmptyState';
import useLocalStorage from '../../hooks/useLocalStorage';

type StudyQuality = 0 | 1 | 2 | 3; // 0: Again, 1: Hard, 2: Good, 3: Easy

const SRS_KEY = 'srs-flashcards';

const Flashcard: React.FC<{ card: SRFlashcard; onGraded: (quality: StudyQuality) => void; isStudySession: boolean; }> = ({ card, onGraded, isStudySession }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
        setIsFlipped(false);
    }, [card]);

    return (
        <div className="w-full">
            <div className={`flip-card h-64 rounded-lg cursor-pointer group ${isFlipped ? 'flipped' : ''}`} onClick={() => setIsFlipped(!isFlipped)}>
                <div className="flip-card-inner rounded-lg shadow-lg">
                    <div className="flip-card-front bg-slate-800 border border-slate-700 group-hover:border-red-500/50 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all duration-300">
                        <span className="text-sm text-slate-400 absolute top-2 left-2">Question</span>
                        <p className="text-center text-slate-200 font-semibold text-lg">{card.question}</p>
                    </div>
                    <div className="flip-card-back bg-green-900/50 border border-green-700 flex-col justify-between">
                        <div>
                            <span className="text-sm text-green-300 absolute top-2 left-2">Answer</span>
                            <p className="text-center text-slate-200 text-lg">{card.answer}</p>
                        </div>
                        {isStudySession && (
                             <div className="absolute bottom-4 left-4 right-4 flex justify-around">
                                <Button variant="secondary" className="bg-red-800 hover:bg-red-700 text-xs" onClick={(e) => {e.stopPropagation(); onGraded(0);}}>Again</Button>
                                <Button variant="secondary" className="bg-yellow-700 hover:bg-yellow-600 text-xs" onClick={(e) => {e.stopPropagation(); onGraded(1);}}>Hard</Button>
                                <Button variant="secondary" className="bg-blue-700 hover:bg-blue-600 text-xs" onClick={(e) => {e.stopPropagation(); onGraded(2);}}>Good</Button>
                                <Button variant="secondary" className="bg-green-700 hover:bg-green-600 text-xs" onClick={(e) => {e.stopPropagation(); onGraded(3);}}>Easy</Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const Flashcards: React.FC = () => {
    const { ingestedText, addNotification, language, llm } = useAppContext();
    const [srsCards, setSrsCards] = useLocalStorage<SRFlashcard[]>(SRS_KEY, []);
    const [isLoading, setIsLoading] = useState(false);
    const [isStudying, setIsStudying] = useState(false);
    const [studyQueue, setStudyQueue] = useState<SRFlashcard[]>([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);

    const cardsDueCount = useMemo(() => {
        const now = new Date();
        return srsCards.filter(card => new Date(card.dueDate) <= now).length;
    }, [srsCards]);
    
    const startStudySession = () => {
        const now = new Date();
        const dueCards = srsCards
            .filter(card => new Date(card.dueDate) <= now)
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        if (dueCards.length === 0) {
            addNotification("No cards are due for review today!", "info");
            return;
        }
        setStudyQueue(dueCards);
        setCurrentCardIndex(0);
        setIsStudying(true);
    };

    const handleGenerateFlashcards = useCallback(async () => {
        if (!ingestedText) {
            addNotification('Please ingest some text first.', 'info');
            return;
        }
        setIsLoading(true);
        try {
            const results = await generateFlashcards(llm, ingestedText, language);
            const now = new Date().toISOString();
            const newCards: SRFlashcard[] = results.map(r => ({
                ...r,
                id: r.question,
                easeFactor: 2.5,
                interval: 0,
                dueDate: now,
            }));
            setSrsCards(prev => [...prev.filter(pc => !newCards.some(nc => nc.id === pc.id)), ...newCards]);
            addNotification("New flashcards have been added to your deck.", "success");
        } 
        catch (e: any) {
            addNotification(e.message);
        } finally {
            setIsLoading(false);
        }
    }, [ingestedText, addNotification, language, llm, setSrsCards]);

    const gradeCard = (quality: StudyQuality) => {
        const card = studyQueue[currentCardIndex];
        let { easeFactor, interval } = card;

        if (quality < 2) { 
            interval = 1;
        } 
        else {
            if (interval === 0) {
                interval = 1;
            } 
            else if (interval === 1) {
                interval = 6;
            } 
            else {
                interval = Math.round(interval * easeFactor);
            }
        }
        
        easeFactor = easeFactor + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02));
        if (easeFactor < 1.3) easeFactor = 1.3;

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + interval);

        const updatedCard: SRFlashcard = { ...card, easeFactor, interval, dueDate: dueDate.toISOString() };

        setSrsCards(srsCards.map(c => c.id === updatedCard.id ? updatedCard : c));

        if (currentCardIndex < studyQueue.length - 1) {
            setCurrentCardIndex(currentCardIndex + 1);
        } 
        else {
            setIsStudying(false);
            addNotification("Study session complete!", "success");
        }
    };

    if (!ingestedText && srsCards.length === 0) {
        return <EmptyState 
          title="SRS Flashcards"
          message="Upload or paste your study material in the 'Ingest' tab to automatically create smart flashcards that optimize your study sessions for long-term memory."
        />;
    }

    if (isStudying) {
        return (
             <Card title={`Studying (${currentCardIndex + 1} / ${studyQueue.length})`} className="fade-in">
                <Flashcard card={studyQueue[currentCardIndex]} onGraded={gradeCard} isStudySession={true} />
                <Button onClick={() => setIsStudying(false)} variant="secondary" className="mt-4">End Session</Button>
            </Card>
        )
    }

    return (
        <Card title="SRS Flashcards">
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button onClick={handleGenerateFlashcards} disabled={isLoading || !ingestedText}>
                        {isLoading ? 'Generating...' : 'Generate from Ingested Text'}
                    </Button>
                    <Button onClick={startStudySession} disabled={cardsDueCount === 0}>
                        Study Due Cards ({cardsDueCount})
                    </Button>
                </div>
                {isLoading && <Loader />}
                
                <div className="fade-in">
                    <h3 className="text-xl font-semibold text-slate-200 mb-2">Full Deck ({srsCards.length} cards)</h3>
                    {srsCards.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[60vh] overflow-y-auto pr-2">
                            {srsCards.map((card) => (
                                <div key={card.id} className="p-3 bg-slate-800/50 rounded-md border border-slate-700">
                                    <p className="font-semibold text-slate-300">{card.question}</p>
                                    <p className="text-sm text-slate-400 mt-1">{card.answer}</p>
                                    <p className="text-xs text-slate-500 mt-2">Due: {new Date(card.dueDate).toLocaleDateString()}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-400">Your deck is empty. Generate some cards from your ingested text to get started.</p>
                    )}
                </div>
            </div>
        </Card>
    );
};