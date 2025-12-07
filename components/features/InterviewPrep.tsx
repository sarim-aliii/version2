import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Loader } from '../ui/Loader';
import { getTutorResponse } from '../../services/geminiService';

import { dsaQuestions } from '../constants/dsaQuestions';
import { webQuestions } from '../constants/webQuestions';
import { mobileQuestions } from '../constants/mobileQuestions';
import { cnQuestions } from '../constants/cnQuestions';
import { oodQuestions } from '../constants/oodQuestions';
import { sysQuestions } from '../constants/sysQuestions';
import { genaiQuestions } from '../constants/genaiQuestions';
import { cloudQuestions } from '../constants/cloudQuestions';
import { securityQuestions } from '../constants/securityQuestions';
import { hrQuestions } from '../constants/hrQuestions';
import { dbmsQuestions } from '../constants/dbmsQuestions';
import { osQuestions } from '../constants/osQuestions';


// --- DATA STRUCTURES ---

type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Concept';

interface Question {
    id: string;
    title: string;
    difficulty: Difficulty;
    tags?: string[];
    link?: string;
}

interface Category {
    id: string;
    title: string;
    icon: React.ReactNode;
    description: string;
    questions: Question[];
}

// --- CURATED CONTENT ---

const INTERVIEW_DATA: Category[] = [
    {
        id: 'dsa',
        title: 'Data Structures & Algo',
        description: 'Top 100 Questions: Arrays, Trees, Graphs & DP.',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>,
        questions: dsaQuestions
    },
    {
        id: 'web',
        title: 'Web Development',
        description: 'React, Node.js, CSS, and System Architecture.',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>,
        questions: webQuestions
    },
    {
        id: 'mobile',
        title: 'Mobile App Dev',
        description: 'React Native, Flutter, iOS, and Android concepts.',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
        questions: mobileQuestions
    },
    {
        id: 'networks',
        title: 'Computer Networks',
        description: 'OSI Model, TCP/IP, Protocols, and Security.',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>,
        questions: cnQuestions
    },
    {
        id: 'ood',
        title: 'Object-Oriented Design',
        description: 'Design Patterns, SOLID Principles, and UML.',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
        questions: oodQuestions
    },
    {
        id: 'system',
        title: 'System Design',
        description: 'Scalability, Load Balancing, Databases, and CAP Theorem.',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
        questions: sysQuestions
    },
    {
        id: 'genai',
        title: 'Generative AI & LLMs',
        description: 'Transformers, RAG, Prompt Engineering.',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
        questions: genaiQuestions
    },
    {
        id: 'cloud',
        title: 'Cloud & DevOps',
        description: 'AWS, Docker, Kubernetes, CI/CD.',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>,
        questions: cloudQuestions
    },
    {
        id: 'dbms',
        title: 'Database Management Systems',
        description: 'SQL, Normalization, Transactions, Indexing & Query Optimization.',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 6v10a2 2 0 002 2h12a2 2 0 002-2V6m-16 0a6 6 0 006 6h4a6 6 0 006-6M4 6a6 6 0 016-6h4a6 6 0 016 6" />
            </svg>
        ),
        questions: dbmsQuestions
    },
    {
        id: 'os',
        title: 'Operating Systems',
        description: 'Processes, Threads, Scheduling, Memory, File Systems, Concurrency.',
        icon: (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9.75 17L8 21l4-1.75L16 21l-1.75-4M12 3v10m9 4a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        questions: osQuestions
    },
    {
        id: 'security',
        title: 'Cybersecurity',
        description: 'OWASP Top 10, Cryptography, Auth.',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
        questions: securityQuestions
    },
    {
        id: 'hr',
        title: 'Behavioral & HR',
        description: 'STAR Method, Soft Skills, Leadership.',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
        questions: hrQuestions
    }
];

// --- COMPONENT ---

export const InterviewPrep: React.FC = () => {
    const { llm, language, addNotification } = useAppContext();
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
    const [explanations, setExplanations] = useState<{ [key: string]: string }>({});
    const [isLoading, setIsLoading] = useState(false);

    const [sortOrder, setSortOrder] = useState<'default' | 'asc' | 'desc'>('default');
    const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | 'All'>('All');

    const getDifficultyColor = (diff: Difficulty) => {
        switch (diff) {
            case 'Easy': return 'text-green-400 border-green-400/30 bg-green-400/10';
            case 'Medium': return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
            case 'Hard': return 'text-red-400 border-red-400/30 bg-red-400/10';
            case 'Concept': return 'text-blue-400 border-blue-400/30 bg-blue-400/10';
        }
    };

    const getDifficultyWeight = (d: Difficulty) => {
        switch (d) {
            case 'Concept': return 0;
            case 'Easy': return 1;
            case 'Medium': return 2;
            case 'Hard': return 3;
            default: return 99;
        }
    };

    const filteredQuestions = useMemo(() => {
        if (!selectedCategory) return [];
        let questions = [...selectedCategory.questions];

        if (filterDifficulty !== 'All') {
            questions = questions.filter(q => q.difficulty === filterDifficulty);
        }

        if (sortOrder === 'asc') {
            questions.sort((a, b) => getDifficultyWeight(a.difficulty) - getDifficultyWeight(b.difficulty));
        } else if (sortOrder === 'desc') {
            questions.sort((a, b) => getDifficultyWeight(b.difficulty) - getDifficultyWeight(a.difficulty));
        }

        return questions;
    }, [selectedCategory, sortOrder, filterDifficulty]);

    const handleExplain = async (question: string, id: string, category: string) => {
        setIsLoading(true);
        setExpandedQuestion(id);

        if (explanations[id]) {
            setIsLoading(false);
            return;
        }

        try {
            const prompt = `Act as a senior technical interviewer. Provide a comprehensive answer to the following interview question in the field of ${category}. 
            Include: 
            1. A concise direct answer.
            2. Key concepts involved.
            3. Code example (if applicable).
            4. Complexity analysis (Time/Space) (if applicable).
            5. Common pitfalls or follow-up questions.
            
            Question: "${question}"
            
            Respond in ${language}.`;

            const response = await getTutorResponse(llm, "General Interview Knowledge Base", [], prompt, language);

            setExplanations(prev => ({ ...prev, [id]: response }));
            if (updateProgress) updateProgress(10, category);
        } catch (e: any) {
            addNotification("Failed to generate explanation. Please try again.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSort = () => {
        setSortOrder(prev => {
            if (prev === 'default') return 'asc';
            if (prev === 'asc') return 'desc';
            return 'default';
        });
    };

    return (
        <div className="space-y-6">
            {!selectedCategory ? (
                <div className="space-y-6 fade-in">
                    <div className="text-center space-y-2">
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Interview Prep Hub</h2>
                        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">Select a track to access curated questions, concepts, and AI-powered explanations to crack your next interview.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {INTERVIEW_DATA.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => {
                                    setSelectedCategory(cat);
                                    setSortOrder('default');
                                    setFilterDifficulty('All');
                                }}
                                className="flex flex-col items-start p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-red-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all group text-left shadow-sm"
                            >
                                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-red-500 mb-4 group-hover:scale-110 transition-transform">
                                    {cat.icon}
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">{cat.title}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{cat.description}</p>
                                <div className="mt-4 text-xs font-semibold text-slate-400 dark:text-slate-500 group-hover:text-red-400 transition-colors">
                                    {cat.questions.length} Resources Available →
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="fade-in space-y-6">
                    <div className="flex flex-col gap-4 mb-6">
                        <div className="flex items-center gap-4">
                            <Button onClick={() => setSelectedCategory(null)} variant="secondary" className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                                Back to Tracks
                            </Button>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{selectedCategory.title}</h2>
                                <p className="text-slate-500 dark:text-slate-400 text-sm hidden sm:block">{selectedCategory.description}</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                            <div className="flex flex-wrap items-center gap-2">
                                {(['All', 'Concept', 'Easy', 'Medium', 'Hard'] as const).map((diff) => (
                                    <button
                                        key={diff}
                                        onClick={() => setFilterDifficulty(diff)}
                                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${filterDifficulty === diff
                                            ? 'bg-red-600 text-white shadow-sm'
                                            : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                                            }`}
                                    >
                                        {diff}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={toggleSort}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md hover:text-slate-900 dark:hover:text-slate-200 transition-colors shadow-sm ml-auto"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                                </svg>
                                {sortOrder === 'default' ? 'Sort' : sortOrder === 'asc' ? 'Low -> High' : 'High -> Low'}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {filteredQuestions.length > 0 ? (
                            filteredQuestions.map((q) => (
                                <Card key={q.id} className="!p-0 overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30">
                                    <div
                                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                    >
                                        <div
                                            className="flex-1 flex items-start gap-4"
                                            onClick={() => {
                                                if (expandedQuestion === q.id) setExpandedQuestion(null);
                                                else handleExplain(q.title, q.id, selectedCategory.title);
                                            }}
                                        >
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${getDifficultyColor(q.difficulty)}`}>
                                                {q.difficulty}
                                            </span>
                                            <span className="font-medium text-slate-700 dark:text-slate-200 text-lg">{q.title}</span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* LINK BUTTON */}
                                            {q.link && (
                                                <a
                                                    href={q.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                                    title="Open Resource"
                                                    onClick={(e) => e.stopPropagation()} // Prevent expanding
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                </a>
                                            )}

                                            <div
                                                className="flex items-center gap-2"
                                                onClick={() => {
                                                    if (expandedQuestion === q.id) setExpandedQuestion(null);
                                                    else handleExplain(q.title, q.id, selectedCategory.title);
                                                }}
                                            >
                                                {expandedQuestion === q.id && isLoading && !explanations[q.id] ? (
                                                    <span className="text-xs text-red-400 animate-pulse">Generating...</span>
                                                ) : (
                                                    <span className="text-xs text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300">
                                                        {expandedQuestion === q.id ? 'Close' : 'Reveal Answer'}
                                                    </span>
                                                )}
                                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-slate-400 dark:text-slate-500 transition-transform ${expandedQuestion === q.id ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    {expandedQuestion === q.id && (
                                        <div className="px-6 pb-6 pt-2 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-2">
                                            {isLoading && !explanations[q.id] ? (
                                                <div className="py-8 flex justify-center">
                                                    <Loader />
                                                </div>
                                            ) : (
                                                <div className="prose prose-invert max-w-none">
                                                    <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-light">
                                                        {explanations[q.id]}
                                                    </div>
                                                    <div className="mt-4 flex justify-end">
                                                        <Button onClick={() => navigator.clipboard.writeText(explanations[q.id])} variant="secondary" className="text-xs">
                                                            Copy Answer
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Card>
                            ))
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-slate-500 dark:text-slate-400">No questions found for this difficulty level.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};