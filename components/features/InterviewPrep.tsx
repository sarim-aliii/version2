import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Loader } from '../ui/Loader';
import { getTutorResponse } from '../../services/geminiService';
import useLocalStorage from '../../hooks/useLocalStorage';
import { Difficulty, Category } from '@/types';
import { dsaTop150, dsaBlind75, dsaLeetCode75 } from '../constants/dsaQuestions';
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

import { MarkdownRenderer } from '../ui/MarkdownRenderer';


// --- DATA STRUCTURES ---
const INTERVIEW_DATA: Category[] = [
    {
        id: 'dsa',
        title: 'Data Structures & Algo',
        description: 'Top 100 Questions: Arrays, Trees, Graphs & DP.',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>,
        // Default to Top 150, but logic will handle the swap
        questions: dsaTop150 
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
    const { llm, language, addNotification, updateProgress } = useAppContext();
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
    const [explanations, setExplanations] = useState<{ [key: string]: string }>({});
    const [isLoading, setIsLoading] = useState(false);
    
    // Persistent state for completed questions
    const [completedQuestions, setCompletedQuestions] = useLocalStorage<string[]>('kairon-interview-completed', []);

    const [sortOrder, setSortOrder] = useState<'default' | 'asc' | 'desc'>('default');
    const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | 'All'>('All');

    // New state for DSA View (Menu vs Lists)
    const [dsaView, setDsaView] = useState<'menu' | 'top150' | 'blind75' | 'leetcode75'>('menu');

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

    const toggleComplete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setCompletedQuestions(prev => {
            if (prev.includes(id)) {
                if (selectedCategory) updateProgress(-10, selectedCategory.title);
                return prev.filter(q => q !== id);
            } else {
                addNotification("Marked as complete!", "success");
                if (selectedCategory) updateProgress(10, selectedCategory.title);
                return [...prev, id];
            }
        });
    };

    // Calculate questions based on category and sub-views (for DSA)
    const currentQuestions = useMemo(() => {
        if (!selectedCategory) return [];
        if (selectedCategory.id === 'dsa') {
            if (dsaView === 'top150') return dsaTop150;
            if (dsaView === 'blind75') return dsaBlind75;
            if (dsaView === 'leetcode75') return dsaLeetCode75;
            return []; // Menu view
        }
        return selectedCategory.questions;
    }, [selectedCategory, dsaView]);

    const stats = useMemo(() => {
        if (!selectedCategory) return { completed: 0, total: 0, percentage: 0 };
        // For stats in list view, use currentQuestions
        const total = currentQuestions.length;
        if (total === 0) return { completed: 0, total: 0, percentage: 0 };
        
        const completed = currentQuestions.filter(q => completedQuestions.includes(q.id)).length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { completed, total, percentage };
    }, [selectedCategory, currentQuestions, completedQuestions]);

    const filteredQuestions = useMemo(() => {
        let questions = [...currentQuestions];

        if (filterDifficulty !== 'All') {
            questions = questions.filter(q => q.difficulty === filterDifficulty);
        }

        if (sortOrder === 'asc') {
            questions.sort((a, b) => getDifficultyWeight(a.difficulty) - getDifficultyWeight(b.difficulty));
        } else if (sortOrder === 'desc') {
            questions.sort((a, b) => getDifficultyWeight(b.difficulty) - getDifficultyWeight(a.difficulty));
        }

        return questions;
    }, [currentQuestions, sortOrder, filterDifficulty]);

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
            // Note: We're awarding XP on "Reveal Answer" as well, essentially double dipping if they reveal AND mark complete. 
            // This is generally acceptable in gamification to reward engagement.
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

    // Handle Back Button Logic
    const handleBack = () => {
        if (selectedCategory?.id === 'dsa' && dsaView !== 'menu') {
            setDsaView('menu');
        } else {
            setSelectedCategory(null);
            setDsaView('menu'); // Reset for next time
        }
    };

    return (
        <div className="space-y-6">
            {!selectedCategory ? (
                // --- MAIN CATEGORY SELECTION ---
                <div className="space-y-6 fade-in">
                    <div className="text-center space-y-2">
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Interview Prep Hub</h2>
                        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">Select a track to access curated questions, concepts, and AI-powered explanations to crack your next interview.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {INTERVIEW_DATA.map((cat) => {
                            // Calculate preview stats for the card (using default questions for non-dsa, or sum for dsa?)
                            // For simplicity on main card, we show default length or total available resources text
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => {
                                        setSelectedCategory(cat);
                                        setSortOrder('default');
                                        setFilterDifficulty('All');
                                        setDsaView('menu'); // Default to menu for DSA
                                    }}
                                    className="flex flex-col items-start p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-red-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all group text-left shadow-sm relative overflow-hidden"
                                >
                                    <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-red-500 mb-4 group-hover:scale-110 transition-transform">
                                        {cat.icon}
                                    </div>
                                    <div className="w-full flex justify-between items-start mb-2">
                                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">{cat.title}</h3>
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{cat.description}</p>
                                    <div className="mt-4 text-xs font-semibold text-slate-400 dark:text-slate-500 group-hover:text-red-400 transition-colors">
                                        {cat.id === 'dsa' ? '300+ Resources Available' : `${cat.questions.length} Resources Available`} →
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ) : (
                // --- CATEGORY SELECTED ---
                <div className="fade-in space-y-6">
                    <div className="flex flex-col gap-4 mb-2">
                        <div className="flex items-center gap-4">
                            <Button onClick={handleBack} variant="secondary" className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                                {selectedCategory.id === 'dsa' && dsaView !== 'menu' ? 'Back to DSA Menu' : 'Back to Tracks'}
                            </Button>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{selectedCategory.title}</h2>
                                {selectedCategory.id === 'dsa' && dsaView !== 'menu' && (
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                                        {dsaView === 'top150' ? 'Top Interview 150' : dsaView === 'blind75' ? 'Blind 75' : 'LeetCode 75'}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* --- DSA MENU VIEW --- */}
                        {selectedCategory.id === 'dsa' && dsaView === 'menu' ? (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {/* Top 150 Card */}
                                    <div 
                                        onClick={() => setDsaView('top150')}
                                        className="relative overflow-hidden rounded-2xl p-8 h-64 flex flex-col justify-center items-start bg-gradient-to-br from-blue-600 to-blue-800 shadow-xl group cursor-pointer transition-transform hover:scale-[1.02] border border-blue-500/30"
                                    >
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:opacity-15 transition-opacity"></div>
                                        <h3 className="text-3xl font-bold text-white mb-2 relative z-10">Top Interview 150</h3>
                                        <p className="text-blue-100 mb-6 relative z-10 max-w-xs font-medium">Comprehensive list covering all major topics for technical interviews.</p>
                                        <button className="bg-white text-blue-700 px-6 py-2.5 rounded-full font-bold shadow-lg hover:bg-blue-50 transition-colors relative z-10 text-sm tracking-wide">
                                            Get Started
                                        </button>
                                    </div>

                                    {/* Blind 75 Card */}
                                    <div 
                                        onClick={() => setDsaView('blind75')}
                                        className="relative overflow-hidden rounded-2xl p-8 h-64 flex flex-col justify-center items-start bg-gradient-to-br from-purple-600 to-purple-800 shadow-xl group cursor-pointer transition-transform hover:scale-[1.02] border border-purple-500/30"
                                    >
                                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white opacity-10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl group-hover:opacity-15 transition-opacity"></div>
                                        <h3 className="text-3xl font-bold text-white mb-2 relative z-10">Blind 75</h3>
                                        <p className="text-purple-100 mb-6 relative z-10 max-w-xs font-medium">Most frequently asked LeetCode questions for FAANG interviews.</p>
                                        <button className="bg-white text-purple-700 px-6 py-2.5 rounded-full font-bold shadow-lg hover:bg-purple-50 transition-colors relative z-10 text-sm tracking-wide">
                                            Start Learning
                                        </button>
                                    </div>

                                     {/* LeetCode 75 Card */}
                                     <div 
                                        onClick={() => setDsaView('leetcode75')}
                                        className="relative overflow-hidden rounded-2xl p-8 h-64 flex flex-col justify-center items-start bg-gradient-to-br from-emerald-600 to-emerald-800 shadow-xl group cursor-pointer transition-transform hover:scale-[1.02] border border-emerald-500/30"
                                    >
                                        <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-y-1/2 -translate-x-1/2 blur-3xl group-hover:opacity-15 transition-opacity"></div>
                                        <h3 className="text-3xl font-bold text-white mb-2 relative z-10">LeetCode 75</h3>
                                        <p className="text-emerald-100 mb-6 relative z-10 max-w-xs font-medium">Essential coding interview questions to master DSA patterns.</p>
                                        <button className="bg-white text-emerald-700 px-6 py-2.5 rounded-full font-bold shadow-lg hover:bg-emerald-50 transition-colors relative z-10 text-sm tracking-wide">
                                            Start Learning
                                        </button>
                                    </div>
                                </div>

                                {/* Mock Interview Button */}
                                <div className="flex justify-center">
                                    <button 
                                        onClick={() => addNotification("Mock Interview feature coming soon!", "info")}
                                        className="flex items-center gap-4 px-8 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl shadow-lg transition-all hover:shadow-2xl hover:-translate-y-1 group w-full md:w-auto"
                                    >
                                         <div className="p-2.5 bg-red-500/20 rounded-lg text-red-400 group-hover:text-red-300 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                            </svg>
                                         </div>
                                         <div className="text-left">
                                             <div className="text-lg font-bold">Take Mock Interview</div>
                                             <div className="text-xs text-slate-400 group-hover:text-slate-300">AI-powered simulation</div>
                                         </div>
                                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500 group-hover:text-white ml-2 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // --- QUESTION LIST VIEW ---
                            <>
                                {/* DSA SUB-TABS (Visible only inside a DSA list) */}
                                {selectedCategory.id === 'dsa' && (
                                     <div className="flex p-1 bg-slate-200 dark:bg-slate-800/50 rounded-lg w-full sm:w-auto self-start mb-4 overflow-x-auto">
                                        <button
                                            onClick={() => setDsaView('top150')}
                                            className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${dsaView === 'top150' ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                        >
                                            Top Interview 150
                                        </button>
                                        <button
                                            onClick={() => setDsaView('blind75')}
                                            className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${dsaView === 'blind75' ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                        >
                                            Blind 75
                                        </button>
                                        <button
                                            onClick={() => setDsaView('leetcode75')}
                                            className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${dsaView === 'leetcode75' ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                        >
                                            LeetCode 75
                                        </button>
                                     </div>
                                )}

                                {/* PROGRESS BAR */}
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg shadow-sm flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex-1">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Track Progress</span>
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                                {stats.percentage}% ({stats.completed}/{stats.total})
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                                            <div 
                                                className="bg-green-500 h-2.5 rounded-full transition-all duration-700 ease-out" 
                                                style={{ width: `${stats.percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                {/* FILTERS */}
                                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-3">
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

                                {/* LIST */}
                                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4">
                                    {filteredQuestions.length > 0 ? (
                                        filteredQuestions.map((q) => {
                                            const isCompleted = completedQuestions.includes(q.id);
                                            return (
                                                <Card key={q.id} className={`!p-0 overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30 transition-all ${isCompleted ? 'opacity-80' : ''}`}>
                                                    <div
                                                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                                    >
                                                        <div
                                                            className="flex-1 flex items-start gap-3"
                                                            onClick={() => {
                                                                if (expandedQuestion === q.id) setExpandedQuestion(null);
                                                                else handleExplain(q.title, q.id, selectedCategory.title);
                                                            }}
                                                        >
                                                            {/* TOGGLE COMPLETE BUTTON */}
                                                            <button
                                                                onClick={(e) => toggleComplete(e, q.id)}
                                                                className={`p-1 rounded-full flex-shrink-0 mt-0.5 transition-all duration-200 focus:outline-none ${
                                                                    isCompleted 
                                                                        ? 'text-green-500 hover:text-green-600 bg-green-100 dark:bg-green-900/30' 
                                                                        : 'text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 border border-slate-300 dark:border-slate-600 hover:border-slate-400'
                                                                }`}
                                                                title={isCompleted ? "Mark as incomplete" : "Mark as complete"}
                                                            >
                                                                {isCompleted ? (
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                    </svg>
                                                                ) : (
                                                                    <div className="w-5 h-5 rounded-full" />
                                                                )}
                                                            </button>

                                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border self-start ${getDifficultyColor(q.difficulty)}`}>
                                                                    {q.difficulty}
                                                                </span>
                                                                <span className={`font-medium text-lg transition-colors ${isCompleted ? 'text-slate-500 dark:text-slate-500 line-through decoration-slate-400/50' : 'text-slate-700 dark:text-slate-200'}`}>
                                                                    {q.title}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 pl-9 sm:pl-0">
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
                                                                <div className="w-full overflow-hidden">
                                                                    <MarkdownRenderer content={explanations[q.id]} />
                                                                    
                                                                    <div className="mt-6 flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
                                                                        <Button 
                                                                            onClick={() => navigator.clipboard.writeText(explanations[q.id])} 
                                                                            variant="secondary" 
                                                                            className="text-xs"
                                                                        >
                                                                            Copy Full Explanation
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </Card>
                                            )
                                        })
                                    ) : (
                                        <div className="text-center py-12">
                                            <p className="text-slate-500 dark:text-slate-400">No questions found for this difficulty level.</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};