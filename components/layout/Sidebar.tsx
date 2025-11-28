import React from 'react';
import { TodoList } from '../features/TodoList';
import { useAppContext } from '../../context/AppContext';
import { ProjectHistory } from './ProjectHistory';
import { FocusTimer } from '../features/FocusTimer';


export const Sidebar: React.FC = () => {
    const { isSidebarCollapsed, toggleSidebar, language, setLanguage, llm, setLlm, theme, toggleTheme, currentUser } = useAppContext();

    const currentXP = currentUser?.xp || 0;
    const currentLevel = currentUser?.level || 1;
    const xpForNextLevel = currentLevel * 100; 
    const xpProgress = currentXP % 100;

    return (
        <aside className={`w-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${isSidebarCollapsed ? 'md:w-0 border-transparent' : 'md:w-72 lg:w-80'}`}>
            <div className={`space-y-6 overflow-y-auto flex-1 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'opacity-0 p-0' : 'p-6 opacity-100'}`}>

                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Level {currentLevel}</span>
                        <div className="flex items-center gap-1 text-orange-500" title="Daily Streak">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.298-2.296a1 1 0 00-1.648-1.052c-.865 1.354-1.325 2.863-1.325 4.765 0 5.863 4.825 10.663 10.68 10.663 5.855 0 10.612-4.8 10.612-10.663 0-4.186-2.115-7.792-5.217-9.679a1 1 0 00-1.086.398 1 1 0 00.591 1.45 6.987 6.987 0 013.726 6.258 7.006 7.006 0 11-11.923-3.862c.158.31.334.618.526.917.24.376.518.716.828 1.015a1 1 0 001.477-1.414c-.42-.42-.766-.936-.99-1.518a10.96 10.96 0 01-.576-2.526z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs font-bold">{currentUser?.currentStreak || 0} Day Streak</span>
                        </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-300 dark:bg-slate-700 rounded-full h-2.5 mb-1">
                        <div 
                            className="bg-red-500 h-2.5 rounded-full transition-all duration-500" 
                            style={{ width: `${xpProgress}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-right">{xpProgress} / 100 XP</p>
                </div>

                <FocusTimer />

                <hr className="border-slate-200 dark:border-slate-800" />
                
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
                    <p className="text-xs text-slate-500 mt-1">Select 'Pro' for complex reasoning or 'Flash-Lite' for speed.</p>
                </div>

                <div>
                    <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Language</h3>
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full text-sm text-slate-800 dark:text-slate-200 bg-gray-50 dark:bg-slate-800 p-2 rounded border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-red-500 focus:outline-none transition-colors"
                    >
                        <option value="Afrikaans">Afrikaans</option>
                        <option value="Albanian">Albanian</option>
                        <option value="Amharic">Amharic</option>
                        <option value="Arabic">Arabic</option>
                        <option value="Armenian">Armenian</option>
                        <option value="Assamese">Assamese</option>
                        <option value="Azerbaijani">Azerbaijani</option>
                        <option value="Basque">Basque</option>
                        <option value="Bengali">Bengali</option>
                        <option value="Bosnian">Bosnian</option>
                        <option value="Bulgarian">Bulgarian</option>
                        <option value="Burmese">Burmese</option>
                        <option value="Cantonese">Cantonese</option>
                        <option value="Catalan">Catalan</option>
                        <option value="Chinese (Traditional)">Chinese (Traditional)</option>
                        <option value="Croatian">Croatian</option>
                        <option value="Czech">Czech</option>
                        <option value="Danish">Danish</option>
                        <option value="Dutch">Dutch</option>
                        <option value="English">English</option>
                        <option value="Estonian">Estonian</option>
                        <option value="Filipino">Filipino</option>
                        <option value="Finnish">Finnish</option>
                        <option value="French">French</option>
                        <option value="Galician">Galician</option>
                        <option value="Georgian">Georgian</option>
                        <option value="German">German</option>
                        <option value="Greek">Greek</option>
                        <option value="Gujarati">Gujarati</option>
                        <option value="Haitian Creole">Haitian Creole</option>
                        <option value="Hausa">Hausa</option>
                        <option value="Hebrew">Hebrew</option>
                        <option value="Hindi">Hindi</option>
                        <option value="Hungarian">Hungarian</option>
                        <option value="Icelandic">Icelandic</option>
                        <option value="Igbo">Igbo</option>
                        <option value="Indonesian">Indonesian</option>
                        <option value="Irish">Irish</option>
                        <option value="Italian">Italian</option>
                        <option value="Japanese">Japanese</option>
                        <option value="Javanese">Javanese</option>
                        <option value="Kannada">Kannada</option>
                        <option value="Kazakh">Kazakh</option>
                        <option value="Khmer">Khmer</option>
                        <option value="Korean">Korean</option>
                        <option value="Kurdish">Kurdish</option>
                        <option value="Kyrgyz">Kyrgyz</option>
                        <option value="Lao">Lao</option>
                        <option value="Latvian">Latvian</option>
                        <option value="Lithuanian">Lithuanian</option>
                        <option value="Luxembourgish">Luxembourgish</option>
                        <option value="Macedonian">Macedonian</option>
                        <option value="Malagasy">Malagasy</option>
                        <option value="Malay">Malay</option>
                        <option value="Malayalam">Malayalam</option>
                        <option value="Maltese">Maltese</option>
                        <option value="Mandarin Chinese">Mandarin Chinese</option>
                        <option value="Maori">Maori</option>
                        <option value="Marathi">Marathi</option>
                        <option value="Mongolian">Mongolian</option>
                        <option value="Nepali">Nepali</option>
                        <option value="Norwegian">Norwegian</option>
                        <option value="Odia">Odia</option>
                        <option value="Pashto">Pashto</option>
                        <option value="Persian">Persian</option>
                        <option value="Polish">Polish</option>
                        <option value="Portuguese">Portuguese</option>
                        <option value="Punjabi">Punjabi</option>
                        <option value="Romanian">Romanian</option>
                        <option value="Russian">Russian</option>
                        <option value="Serbian">Serbian</option>
                        <option value="Sinhala">Sinhala</option>
                        <option value="Slovak">Slovak</option>
                        <option value="Slovenian">Slovenian</option>
                        <option value="Somali">Somali</option>
                        <option value="Spanish">Spanish</option>
                        <option value="Sundanese">Sundanese</option>
                        <option value="Swahili">Swahili</option>
                        <option value="Swedish">Swedish</option>
                        <option value="Tajik">Tajik</option>
                        <option value="Tamil">Tamil</option>
                        <option value="Telugu">Telugu</option>
                        <option value="Thai">Thai</option>
                        <option value="Turkish">Turkish</option>
                        <option value="Turkmen">Turkmen</option>
                        <option value="Ukrainian">Ukrainian</option>
                        <option value="Urdu">Urdu</option>
                        <option value="Uzbek">Uzbek</option>
                        <option value="Vietnamese">Vietnamese</option>
                        <option value="Welsh">Welsh</option>
                        <option value="Xhosa">Xhosa</option>
                        <option value="Yoruba">Yoruba</option>
                        <option value="Zulu">Zulu</option>
                    </select>
                </div>

                <hr className="border-slate-200 dark:border-slate-800" />
                <ProjectHistory />

                <hr className="border-slate-200 dark:border-slate-800" />
                <TodoList />

                <hr className="border-slate-200 dark:border-slate-800" />
                
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
    );
};