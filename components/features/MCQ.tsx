import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { generateMCQs, generatePersonalizedStudyGuide } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Loader } from '../ui/Loader';
import { MCQ as MCQType, MCQAttempt } from '../../types';
import { EmptyState } from '../ui/EmptyState';

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
                        if (isCorrect) optionClass = "bg-green-800/70";
                        else if (isSelected) optionClass = "bg-red-800/70";
                        else optionClass = "bg-slate-700 opacity-50";
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
    const { activeProject, addNotification, language, llm, projects, updateProjectData } = useAppContext();
    const history = activeProject?.mcqAttempts || [];
    
    const [mcqs, setMcqs] = useState<MCQType[]>([]);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);
    const [personalizedGuide, setPersonalizedGuide] = useState<string | null>(null);
    const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
    
    useEffect(() => {
        setMcqs([]);
        setUserAnswers({});
        setPersonalizedGuide(null);
    }, [activeProject]);

    const isQuizFinished = useMemo(() => mcqs.length > 0 && Object.keys(userAnswers).length === mcqs.length, [mcqs, userAnswers]);
    
    const score = useMemo(() => mcqs.reduce((c, mcq, i) => userAnswers[i] === mcq.correctAnswer ? c + 1 : c, 0), [mcqs, userAnswers]);

    const incorrectMCQs = useMemo(() => isQuizFinished ? mcqs.filter((mcq, i) => userAnswers[i] !== mcq.correctAnswer) : [], [mcqs, userAnswers, isQuizFinished]);

    const handleGenerateMCQs = useCallback(async () => {
        if (!activeProject) return;
        
        setIsGenerating(true);
        setMcqs([]);
        setUserAnswers({});
        setPersonalizedGuide(null);
        try {
            const result = await generateMCQs(llm, activeProject.ingestedText, language, difficulty);
            setMcqs(result);
        } catch (e: any) {
            addNotification(e.message);
        } finally {
            setIsGenerating(false);
        }
    }, [activeProject, addNotification, language, difficulty, llm]);

    const handleAnswer = (questionIndex: number, answer: string) => {
        setUserAnswers(prev => ({ ...prev, [questionIndex]: answer }));
    };
    
    // Logic to save history when quiz is finished
    useEffect(() => {
        if(isQuizFinished && activeProject) {
             const newAttempt: MCQAttempt = {
                date: new Date().toISOString(),
                score,
                total: mcqs.length,
                incorrectQuestions: incorrectMCQs.map(mcq => mcq.question),
            };
            const newHistory = [newAttempt, ...(history || [])].slice(0, 20);
            // FIX: Ensure the correct project identifier `_id` is used when updating data.
            updateProjectData(activeProject._id, { mcqAttempts: newHistory });
        }
    }, [isQuizFinished, score, mcqs.length, incorrectMCQs, history, activeProject, updateProjectData]);

    const handleGeneratePersonalizedGuide = useCallback(async () => {
        if (!activeProject || incorrectMCQs.length === 0) return;
        setIsGeneratingGuide(true);
        setPersonalizedGuide(null);
        try {
            const guide = await generatePersonalizedStudyGuide(llm, activeProject.ingestedText, incorrectMCQs, language);
            setPersonalizedGuide(guide);
        } catch (e: any) { addNotification(e.message); } 
        finally { setIsGeneratingGuide(false); }
    }, [activeProject, incorrectMCQs, language, addNotification, llm]);

    if (!projects.length) {
        return <EmptyState title="MCQ Generator" message="Test your knowledge. Ingest your study material to automatically generate multiple-choice questions and quizzes." />;
    }
    
    if (!activeProject) {
        return <EmptyState title="Select a Study" message="Please select a study from the sidebar to generate a quiz, or create a new one." />;
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
                                    <button key={level} onClick={() => setDifficulty(level)} className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${difficulty === level ? 'bg-red-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <Button onClick={handleGenerateMCQs} disabled={isGenerating} className="w-full sm:w-auto">
                            {isGenerating ? 'Generating...' : mcqs.length > 0 ? 'Generate New Quiz' : 'Generate MCQs'}
                        </Button>
                    </div>
                    {isGenerating && <Loader />}
                    {mcqs.length > 0 && (
                        <div className="space-y-4 fade-in">
                            {mcqs.map((mcq, index) => (
                               // FIX: Use the project `_id` to create a more robust unique key for each MCQ item.
                               <MCQItem key={`${activeProject._id}-${index}`} mcq={mcq} index={index} onAnswer={(option) => handleAnswer(index, option)} userAnswer={userAnswers[index] || null}/>
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
                            <p className="text-slate-400 mb-4">It looks like you had some trouble. Here's a personalized study guide to help you reinforce those weak areas.</p>
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
                    <div className="text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-900 p-4 rounded-md border border-slate-700">{personalizedGuide}</div>
                </Card>
            )}
        </div>
    );
};
