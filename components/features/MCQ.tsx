import React, { useState, useCallback, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { generateMCQs, generatePersonalizedStudyGuide } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Loader } from '../ui/Loader';
import { MCQ as MCQType, MCQAttempt } from '../../types';
import { EmptyState } from '../ui/EmptyState';
import useLocalStorage from '../../hooks/useLocalStorage';

const MCQ_HISTORY_KEY = 'mcq-history';

type Difficulty = 'Easy' | 'Medium' | 'Hard';

interface MCQItemProps {
    mcq: MCQType;
    index: number;
    onAnswer: (option: string) => void;
    userAnswer: string | null;
}

const MCQItem: React.FC<MCQItemProps> = ({ mcq, index, onAnswer, userAnswer }) => {
    const isAnswered = userAnswer !== null;

    const handleOptionSelect = (option: string) => {
        if (!isAnswered) {
            onAnswer(option);
        }
    };

    return (
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
            <p className="font-semibold text-slate-300 mb-3">{`Q${index + 1}. ${mcq.question}`}</p>
            <div className="space-y-2">
                {mcq.options.map((option, i) => {
                    const isCorrect = option === mcq.correctAnswer;
                    const isSelected = userAnswer === option;
                    let optionClass = "bg-slate-700 hover:bg-slate-600";
                    
                    if (isAnswered) {
                        if (isCorrect) {
                           optionClass = "bg-green-800/70";
                        } 
                        else if (isSelected) {
                           optionClass = "bg-red-800/70";
                        } 
                        else {
                           optionClass = "bg-slate-700 opacity-50";
                        }
                    }

                    return (
                        <div key={i} onClick={() => handleOptionSelect(option)}
                            className={`flex items-center p-3 rounded-md transition-all duration-300 ${!isAnswered ? 'cursor-pointer' : 'cursor-default'} ${optionClass}`}>
                            <div className={`w-5 h-5 mr-3 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'border-red-500' : 'border-slate-500'}`}>
                                {isSelected && <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>}
                            </div>
                            <span className="text-slate-300">{option}</span>
                        </div>
                    );
                })}
            </div>
            {isAnswered && (
                <div className={`mt-4 p-3 rounded-md text-sm fade-in border ${userAnswer === mcq.correctAnswer ? 'bg-green-900/30 border-green-700/50' : 'bg-red-900/30 border-red-700/50'}`}>
                    <p className={`font-bold ${userAnswer === mcq.correctAnswer ? 'text-green-400' : 'text-red-400'}`}>
                        {userAnswer === mcq.correctAnswer ? 'Correct!' : 'Incorrect'}
                    </p>
                    <p className="text-slate-300 mt-1 leading-relaxed">{mcq.explanation}</p>
                </div>
            )}
        </div>
    );
};


export const MCQ: React.FC = () => {
    const { ingestedText, addNotification, language, llm } = useAppContext();
    const [mcqs, setMcqs] = useState<MCQType[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);
    const [personalizedGuide, setPersonalizedGuide] = useState<string | null>(null);
    const [history, setHistory] = useLocalStorage<MCQAttempt[]>(MCQ_HISTORY_KEY, []);
    const [difficulty, setDifficulty] = useState<Difficulty>('Medium');

    const isQuizFinished = useMemo(() => mcqs.length > 0 && Object.keys(userAnswers).length === mcqs.length, [mcqs, userAnswers]);
    
    const score = useMemo(() => {
        return mcqs.reduce((correctCount, mcq, index) => {
            if (userAnswers[index] === mcq.correctAnswer) {
                return correctCount + 1;
            }
            return correctCount;
        }, 0);
    }, [mcqs, userAnswers]);

    const incorrectMCQs = useMemo(() => {
        if (!isQuizFinished) return [];
        return mcqs.filter((mcq, index) => userAnswers[index] !== mcq.correctAnswer);
    }, [mcqs, userAnswers, isQuizFinished]);

    const handleGenerateMCQs = useCallback(async () => {
        if (!ingestedText) {
            addNotification('Please ingest some text first.', 'info');
            return;
        }
        setIsLoading(true);
        setMcqs([]);
        setUserAnswers({});
        setPersonalizedGuide(null);
        try {
            const result = await generateMCQs(llm, ingestedText, language, difficulty);
            setMcqs(result);
        } catch (e: any) {
            addNotification(e.message);
        } finally {
            setIsLoading(false);
        }
    }, [ingestedText, addNotification, language, difficulty, llm]);

    const handleAnswer = (questionIndex: number, answer: string) => {
        const newAnswers = { ...userAnswers, [questionIndex]: answer };
        setUserAnswers(newAnswers);

        if (mcqs.length > 0 && Object.keys(newAnswers).length === mcqs.length) {
            const finalScore = mcqs.reduce((correctCount, mcq, index) => {
                return newAnswers[index] === mcq.correctAnswer ? correctCount + 1 : correctCount;
            }, 0);
            
            const finalIncorrectMCQs = mcqs.filter((mcq, index) => newAnswers[index] !== mcq.correctAnswer);

            const newAttempt: MCQAttempt = {
                date: new Date().toISOString(),
                score: finalScore,
                total: mcqs.length,
                incorrectQuestions: finalIncorrectMCQs.map(mcq => mcq.question),
            };
            setHistory(prev => [newAttempt, ...prev].slice(0, 20));
        }
    };

    const handleGeneratePersonalizedGuide = useCallback(async () => {
        if (!ingestedText || incorrectMCQs.length === 0) return;
        setIsGeneratingGuide(true);
        setPersonalizedGuide(null);
        try {
            const guide = await generatePersonalizedStudyGuide(llm, ingestedText, incorrectMCQs, language);
            setPersonalizedGuide(guide);
        } 
        catch (e: any)
        {
            addNotification(e.message);
        } 
        finally {
            setIsGeneratingGuide(false);
        }
    }, [ingestedText, incorrectMCQs, language, addNotification, llm]);

    if (!ingestedText) {
        return <EmptyState 
          title="MCQ Generator"
          message="Test your knowledge. Ingest your study material to automatically generate multiple-choice questions and quizzes."
        />;
    }

    return (
        <div className="space-y-6">
            <Card title="MCQ Generator">
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-300">Difficulty:</span>
                            <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-md">
                                {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(level => (
                                    <button 
                                        key={level} 
                                        onClick={() => setDifficulty(level)}
                                        className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${difficulty === level ? 'bg-red-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <Button onClick={handleGenerateMCQs} disabled={isLoading} className="w-full sm:w-auto">
                            {isLoading ? 'Generating...' : mcqs.length > 0 ? 'Generate New Quiz' : 'Generate MCQs'}
                        </Button>
                    </div>
                    {isLoading && <Loader />}
                    {mcqs.length > 0 && (
                        <div className="space-y-4 fade-in">
                            {mcqs.map((mcq, index) => (
                               <MCQItem 
                                 key={index} 
                                 mcq={mcq} 
                                 index={index} 
                                 onAnswer={(option) => handleAnswer(index, option)}
                                 userAnswer={userAnswers[index] || null}
                               />
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            {isQuizFinished && (
                <Card title="Quiz Results" className="fade-in">
                    <p className="text-lg text-slate-300">You scored <span className="font-bold text-red-400">{score}</span> out of <span className="font-bold text-red-400">{mcqs.length}</span>.</p>
                    {incorrectMCQs.length > 0 && (
                         <div className="mt-6">
                            <h3 className="text-xl font-semibold text-slate-200 mb-3">Adaptive Learning Path</h3>
                            <p className="text-slate-400 mb-4">It looks like you had some trouble with a few concepts. Here's a personalized study guide to help you reinforce those weak areas.</p>
                            <Button onClick={handleGeneratePersonalizedGuide} disabled={isGeneratingGuide}>
                                {isGeneratingGuide ? 'Generating Guide...' : 'Generate Personalized Study Guide'}
                            </Button>
                        </div>
                    )}
                </Card>
            )}

            {isGeneratingGuide && <Loader />}

            {personalizedGuide && (
                <Card title="Your Personalized Study Guide" className="fade-in">
                    <div className="text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-900 p-4 rounded-md border border-slate-700">
                        {personalizedGuide}
                    </div>
                </Card>
            )}

            {history.length > 0 && (
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-slate-100">Progress History</h2>
                        <Button variant="secondary" onClick={() => setHistory([])} className="text-xs !py-1 !px-2">
                            Clear History
                        </Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-400">
                            <thead className="text-xs text-slate-300 uppercase bg-slate-800">
                                <tr>
                                    <th scope="col" className="px-4 py-2">Date</th>
                                    <th scope="col" className="px-4 py-2">Score</th>
                                    <th scope="col" className="px-4 py-2">Percentage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map(attempt => (
                                    <tr key={attempt.date} className="border-b border-slate-700 hover:bg-slate-800/50">
                                        <td className="px-4 py-2">{new Date(attempt.date).toLocaleDateString()}</td>
                                        <td className="px-4 py-2">{attempt.score} / {attempt.total}</td>
                                        <td className="px-4 py-2 font-semibold text-red-400">{((attempt.score / attempt.total) * 100).toFixed(0)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
};