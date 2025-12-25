import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { generateMCQs, generatePersonalizedStudyGuide } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Loader } from '../ui/Loader';
import { MCQ as MCQType, MCQAttempt } from '../../types';
import { EmptyState } from '../ui/EmptyState';
import { Slider } from '../ui/Slider';
import { generateMCQPdf } from '../../utils/pdfGenerator';

type Difficulty = 'Easy' | 'Medium' | 'Hard';

// --- MCQItem Component (Unchanged) ---
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
        <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <p className="font-semibold text-slate-800 dark:text-slate-300 mb-3">{`Q${index + 1}. ${mcq.question}`}</p>
            <div className="space-y-2">
                {mcq.options.map((option, i) => {
                    const isCorrect = option === mcq.correctAnswer;
                    const isSelected = userAnswer === option;
                    let optionClass = "bg-white dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-transparent";
                    
                    if (isAnswered) {
                        if (isCorrect) {
                           optionClass = "bg-green-100 dark:bg-green-800/70 border-green-200 dark:border-transparent";
                        } 
                        else if (isSelected) {
                           optionClass = "bg-red-100 dark:bg-red-800/70 border-red-200 dark:border-transparent";
                        } 
                        else {
                           optionClass = "bg-gray-100 dark:bg-slate-700 opacity-50";
                        }
                    }

                    return (
                        <div key={i} onClick={() => handleOptionSelect(option)}
                            className={`flex items-center p-3 rounded-md transition-all duration-300 ${!isAnswered ? 'cursor-pointer' : 'cursor-default'} ${optionClass}`}>
                            <div className={`w-5 h-5 mr-3 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'border-red-500' : 'border-slate-400'}`}>
                                {isSelected && <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>}
                            </div>
                            <span className="text-slate-800 dark:text-slate-300">{option}</span>
                        </div>
                    );
                })}
            </div>
            {isAnswered && (
                <div className={`mt-4 p-3 rounded-md text-sm fade-in border ${userAnswer === mcq.correctAnswer ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700/50' : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700/50'}`}>
                    <p className={`font-bold ${userAnswer === mcq.correctAnswer ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {userAnswer === mcq.correctAnswer ? 'Correct!' : 'Incorrect'}
                    </p>
                    <p className="text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">{mcq.explanation}</p>
                </div>
            )}
        </div>
    );
};

// --- Main MCQ Component ---
export const MCQ: React.FC = () => {
    const { ingestedText, addNotification, language, llm, activeProject, updateActiveProjectData, updateProgress } = useAppContext();
    
    // Load persisted data from activeProject
    const [mcqs, setMcqs] = useState<MCQType[]>(activeProject?.currentMcqs || []);
    const [history, setHistory] = useState<MCQAttempt[]>(activeProject?.mcqAttempts || []);
    
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
    const [numQuestions, setNumQuestions] = useState<number>(5); // Default to 5

    // Adaptive Learning State
    const [personalizedGuide, setPersonalizedGuide] = useState<string | null>(null);

    // Track project ID to prevent clearing answers when switching tabs within the same project
    const [loadedProjectId, setLoadedProjectId] = useState<string | null>(activeProject?._id || null);

    // --- API HOOKS ---

    // 1. Generate MCQs Hook
    const { 
        execute: generateQuiz, 
        loading: isGeneratingQuiz 
    } = useApi(generateMCQs); 

    // 2. Generate Guide Hook
    const { 
        execute: generateGuide, 
        loading: isGeneratingGuide 
    } = useApi(generatePersonalizedStudyGuide);


    useEffect(() => {
        if (activeProject) {
            setMcqs(activeProject.currentMcqs || []);
            setHistory(activeProject.mcqAttempts || []);
            
            // Only reset if we switched to a DIFFERENT project entirely
            if (activeProject._id !== loadedProjectId) {
                setUserAnswers({});
                setPersonalizedGuide(null);
                setLoadedProjectId(activeProject._id);
            }
        }
    }, [activeProject, loadedProjectId]);

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
        
        // Explicitly reset answers when generating NEW questions
        setUserAnswers({});
        setPersonalizedGuide(null);
        setMcqs([]); 
        
        // Use hook with numQuestions
        const result = await generateQuiz(llm, ingestedText, language, difficulty, numQuestions);
        
        if (result) {
            setMcqs(result);
            // Save generated MCQs to DB
            try {
                await updateActiveProjectData({ currentMcqs: result });
            } catch (e) {
                // Silently fail or log
            }
        }
    }, [ingestedText, addNotification, language, difficulty, numQuestions, llm, updateActiveProjectData, generateQuiz]);

    const handleAnswer = async (questionIndex: number, answer: string) => {
        const newAnswers = { ...userAnswers, [questionIndex]: answer };
        setUserAnswers(newAnswers);

        // Check if quiz is finished
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
            
            const newHistory = [newAttempt, ...history].slice(0, 20);
            setHistory(newHistory);

            // GAMIFICATION: Award XP for completing quiz
            updateProgress(50); 
            addNotification(`Quiz Complete! +50 XP`, 'success');

            // Save history to DB
            await updateActiveProjectData({ mcqAttempts: newHistory });
        }
    };

    const handleClearHistory = async () => {
        setHistory([]);
        await updateActiveProjectData({ mcqAttempts: [] });
    };

    const handleGeneratePersonalizedGuide = useCallback(async () => {
        if (!ingestedText || incorrectMCQs.length === 0) return;
        
        setPersonalizedGuide(null);
        
        // Use hook
        const guide = await generateGuide(llm, ingestedText, incorrectMCQs, language);
        
        if (guide) {
            setPersonalizedGuide(guide);
        }
    }, [ingestedText, incorrectMCQs, language, llm, generateGuide]);

    // PDF Download Handler
    const handleDownloadPdf = () => {
        if (mcqs.length > 0) {
            generateMCQPdf(mcqs, activeProject?.name || 'Study Quiz');
            addNotification('PDF Downloaded!', 'success');
        }
    };

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
                    {/* Controls Section */}
                    <div className="flex flex-col gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Difficulty Selection */}
                            <div className="space-y-2">
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Difficulty:</span>
                                <div className="flex items-center gap-1 p-1 bg-gray-200 dark:bg-slate-900 rounded-md">
                                    {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(level => (
                                        <button 
                                            key={level} 
                                            onClick={() => setDifficulty(level)}
                                            className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded transition-colors ${difficulty === level ? 'bg-red-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-gray-300 dark:hover:bg-slate-700'}`}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Number of Questions Slider */}
                            <div className="space-y-2">
                                <Slider 
                                    label="Number of Questions" 
                                    min={5} 
                                    max={20} 
                                    step={1}
                                    value={numQuestions} 
                                    onChange={setNumQuestions} 
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <Button onClick={handleGenerateMCQs} disabled={isGeneratingQuiz} className="flex-1">
                                {isGeneratingQuiz ? 'Generating Quiz...' : mcqs.length > 0 ? 'Generate New Quiz' : 'Generate Quiz'}
                            </Button>
                            
                            {mcqs.length > 0 && (
                                <Button onClick={handleDownloadPdf} variant="secondary" className="flex-1 sm:flex-none">
                                    Download PDF
                                </Button>
                            )}
                        </div>
                    </div>

                    {isGeneratingQuiz && <Loader />}
                    
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
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <p className="text-lg text-slate-800 dark:text-slate-300">You scored <span className="font-bold text-red-600 dark:text-red-400">{score}</span> out of <span className="font-bold text-red-600 dark:text-red-400">{mcqs.length}</span>.</p>
                        <Button onClick={handleDownloadPdf} variant="secondary" className="text-xs">
                            Save Results as PDF
                        </Button>
                    </div>
                    
                    {incorrectMCQs.length > 0 ? (
                         <div className="mt-6">
                            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">Adaptive Learning Path</h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-4">It looks like you had some trouble with a few concepts. Here's a personalized study guide to help you reinforce those weak areas.</p>
                            <Button onClick={handleGeneratePersonalizedGuide} disabled={isGeneratingGuide}>
                                {isGeneratingGuide ? 'Generating Guide...' : 'Generate Personalized Study Guide'}
                            </Button>
                        </div>
                    ) : (
                        <div className="mt-6">
                            <p className="text-green-600 dark:text-green-400 font-semibold">Perfect score! Great job mastering these concepts.</p>
                        </div>
                    )}
                </Card>
            )}

            {isGeneratingGuide && <Loader />}

            {personalizedGuide && (
                <Card title="Your Personalized Study Guide" className="fade-in">
                    <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed bg-gray-50 dark:bg-slate-900 p-4 rounded-md border border-slate-200 dark:border-slate-700">
                        {personalizedGuide}
                    </div>
                </Card>
            )}

            {history.length > 0 && (
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Progress History</h2>
                        <Button variant="secondary" onClick={handleClearHistory} className="text-xs !py-1 !px-2">
                            Clear History
                        </Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
                            <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-gray-100 dark:bg-slate-800">
                                <tr>
                                    <th scope="col" className="px-4 py-2">Date</th>
                                    <th scope="col" className="px-4 py-2">Score</th>
                                    <th scope="col" className="px-4 py-2">Percentage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map(attempt => (
                                    <tr key={attempt.date} className="border-b border-slate-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                        <td className="px-4 py-2">{new Date(attempt.date).toLocaleDateString()}</td>
                                        <td className="px-4 py-2">{attempt.score} / {attempt.total}</td>
                                        <td className="px-4 py-2 font-semibold text-red-600 dark:text-red-400">{((attempt.score / attempt.total) * 100).toFixed(0)}%</td>
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