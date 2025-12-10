import React, { useState } from 'react';
import { TodoList } from '../features/TodoList';
import { useAppContext } from '../../context/AppContext';
import { ProjectHistory } from './ProjectHistory';
import { FocusTimer } from '../features/FocusTimer';
import { FeedbackModal } from '../features/FeedbackModal';
import { LANGUAGE_OPTIONS } from '../constants/languages';
import { Tab } from '../../types';


export const Sidebar: React.FC = () => {
    const { 
        isSidebarCollapsed, 
        language, 
        setLanguage, 
        llm, 
        setLlm, 
        theme, 
        toggleTheme, 
        currentUser, 
        setActiveTab, 
        activeTab,
        addNotification
    } = useAppContext();

    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

    const currentXP = currentUser?.xp || 0;
    const currentLevel = currentUser?.level || 1;
    const xpProgress = currentXP % 100;

    return (
        <>
            <aside className={`w-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${isSidebarCollapsed ? 'md:w-0 border-transparent' : 'md:w-72 lg:w-80'}`}>
                <div className={`space-y-6 overflow-y-auto flex-1 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'opacity-0 p-0' : 'p-6 opacity-100'}`}>

                    {/* GAMIFICATION STATS */}
                    {currentUser && (
                        <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Level {currentLevel}</span>
                                <div className="flex items-center gap-1 text-orange-500 dark:text-orange-400" title="Daily Streak">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.298-2.296a1 1 0 00-1.648-1.052c-.865 1.354-1.325 2.863-1.325 4.765 0 5.863 4.825 10.663 10.68 10.663 5.855 0 10.612-4.8 10.612-10.663 0-4.186-2.115-7.792-5.217-9.679a1 1 0 00-1.086.398 1 1 0 00.591 1.45 6.987 6.987 0 013.726 6.258 7.006 7.006 0 11-11.923-3.862c.158.31.334.618.526.917.24.376.518.716.828 1.015a1 1 0 001.477-1.414c-.42-.42-.766-.936-.99-1.518a10.96 10.96 0 01-.576-2.526z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-xs font-bold">{currentUser.currentStreak || 0} Day Streak</span>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-slate-300 dark:bg-slate-700 rounded-full h-2.5 mb-1">
                                <div
                                    className="bg-red-500 h-2.5 rounded-full transition-all duration-500"
                                    style={{ width: `${xpProgress}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <p className="text-xs text-slate-500 dark:text-slate-400">{xpProgress} / 100 XP</p>
                                
                                {/* NEW: Leaderboard Button */}
                                <button 
                                    onClick={() => setActiveTab(Tab.Leaderboard)}
                                    className={`text-xs font-bold px-2 py-1 rounded transition-colors flex items-center gap-1 ${
                                        activeTab === Tab.Leaderboard 
                                        ? 'bg-yellow-500/20 text-yellow-500' 
                                        : 'text-slate-500 hover:text-yellow-500 dark:text-slate-400 dark:hover:text-yellow-400'
                                    }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                                    </svg>
                                    Leaderboard
                                </button>
                            </div>
                        </div>
                    )}

                    {/* FOCUS TIMER */}
                    <FocusTimer />

                    {/* SETTINGS */}
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">LLM Model</h3>
                            <select
                                value={llm}
                                onChange={(e) => setLlm(e.target.value)}
                                className="w-full text-sm text-slate-800 dark:text-slate-200 bg-gray-50 dark:bg-slate-800 p-2 rounded border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-red-500 focus:outline-none transition-colors"
                            >
                                <optgroup label="Recommended">
                                    <option value="gemini-flash-latest">Gemini Flash (Latest Auto)</option>
                                    <option value="gemini-pro-latest">Gemini Pro (Best Quality)</option>
                                </optgroup>
                                <optgroup label="Gemini 2.0 (New)">
                                    <option value="gemini-2.0-flash-001">Gemini 2.0 Flash</option>
                                    <option value="gemini-2.0-flash-lite-preview-02-05">Gemini 2.0 Flash-Lite (Fastest)</option>
                                </optgroup>
                            </select>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Language</h3>
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="w-full text-sm text-slate-800 dark:text-slate-200 bg-gray-50 dark:bg-slate-800 p-2 rounded border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-red-500 focus:outline-none transition-colors"
                            >
                                {LANGUAGE_OPTIONS.map((lang) => (
                                    <option key={lang} value={lang}>
                                        {lang}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <hr className="border-slate-200 dark:border-slate-800" />

                    {/* PROJECT HISTORY & TODO LIST */}
                    <ProjectHistory />

                    <hr className="border-slate-200 dark:border-slate-800" />

                    <TodoList />

                    <hr className="border-slate-200 dark:border-slate-800" />

                    {/* BOTTOM ACTIONS */}
                    <div className="pt-2 flex items-center justify-between">
                        <a
                            href="mailto:kaironapp.ai@gmail.com"
                            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-red-500 transition-colors text-sm font-medium group"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:scale-110 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0c0 .993-.241 1.929-.668 2.754l-1.524-1.525a3.997 3.997 0 00.078-2.183l1.562-1.562C15.802 8.249 16 9.1 16 10zm-5.165 3.913l1.58 1.58A5.98 5.98 0 0110 16a5.976 5.976 0 01-2.516-.552l1.562-1.562a4.006 4.006 0 001.789.027zm-4.677-2.796a4.002 4.002 0 01-.041-2.08l-.08.08-1.53-1.533A5.98 5.98 0 004 10c0 .954.223 1.856.619 2.657l1.54-1.54zm1.088-6.45A5.974 5.974 0 0110 4c.954 0 1.856.223 2.657.619l-1.54 1.54a4.002 4.002 0 00-2.346.033L7.246 4.668zM12 10a2 2 0 11-4 0 2 2 0 014 0z" clipRule="evenodd" />
                            </svg>
                            Customer Support
                        </a>

                        {/* Feedback Button */}
                        <button
                            onClick={() => setIsFeedbackOpen(true)}
                            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                            title="Send Feedback"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                            </svg>
                        </button>

                        {/* Theme Toggle Button */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        >
                            {theme === 'dark' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Feedback Modal Component */}
            <FeedbackModal
                isOpen={isFeedbackOpen}
                onClose={() => setIsFeedbackOpen(false)}
                addNotification={addNotification}
            />
        </>
    );
};