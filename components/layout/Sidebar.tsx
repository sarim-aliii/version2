import React from 'react';
import { TodoList } from '../features/TodoList';
import { useAppContext } from '../../context/AppContext';
import { ProjectHistory } from './ProjectHistory';

export const Sidebar: React.FC = () => {
    const { isSidebarCollapsed, language, setLanguage, llm, setLlm } = useAppContext();

    return (
        <aside className={`w-full bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${isSidebarCollapsed ? 'md:w-0 border-transparent' : 'md:w-72 lg:w-80'}`}>
            <div className={`space-y-6 overflow-y-auto flex-1 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'opacity-0 p-0' : 'p-6 opacity-100'}`}>
                <div>
                    <h3 className="text-sm font-semibold text-slate-400 mb-1">LLM Model</h3>
                    <select
                        value={llm}
                        onChange={(e) => setLlm(e.target.value)}
                        className="w-full text-sm text-slate-200 bg-slate-800 p-2 rounded border border-slate-700 focus:ring-2 focus:ring-red-500 focus:outline-none"
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
                    <h3 className="text-sm font-semibold text-slate-400 mb-1">Language</h3>
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full text-sm text-slate-200 bg-slate-800 p-2 rounded border border-slate-700 focus:ring-2 focus:ring-red-500 focus:outline-none"
                    >
                        <option value="English">English</option>
                        <option value="Arabic">Arabic</option>
                        <option value="Assamese">Assamese</option>
                        <option value="Bengali">Bengali</option>
                        <option value="Bulgarian">Bulgarian</option>
                        <option value="Catalan">Catalan</option>
                        <option value="Croatian">Croatian</option>
                        <option value="Czech">Czech</option>
                        <option value="Danish">Danish</option>
                        <option value="Dutch">Dutch</option>
                        <option value="Filipino">Filipino</option>
                        <option value="Finnish">Finnish</option>
                        <option value="French">French</option>
                        <option value="German">German</option>
                        <option value="Greek">Greek</option>
                        <option value="Gujarati">Gujarati</option>
                        <option value="Hebrew">Hebrew</option>
                        <option value="Hindi">Hindi</option>
                        <option value="Hungarian">Hungarian</option>
                        <option value="Indonesian">Indonesian</option>
                        <option value="Italian">Italian</option>
                        <option value="Japanese">Japanese</option>
                        <option value="Kannada">Kannada</option>
                        <option value="Korean">Korean</option>
                        <option value="Malay">Malay</option>
                        <option value="Malayalam">Malayalam</option>
                        <option value="Mandarin Chinese">Mandarin Chinese</option>
                        <option value="Marathi">Marathi</option>
                        <option value="Nepali">Nepali</option>
                        <option value="Norwegian">Norwegian</option>
                        <option value="Odia">Odia</option>
                        <option value="Polish">Polish</option>
                        <option value="Portuguese">Portuguese</option>
                        <option value="Punjabi">Punjabi</option>
                        <option value="Romanian">Romanian</option>
                        <option value="Russian">Russian</option>
                        <option value="Slovak">Slovak</option>
                        <option value="Spanish">Spanish</option>
                        <option value="Swahili">Swahili</option>
                        <option value="Swedish">Swedish</option>
                        <option value="Tamil">Tamil</option>
                        <option value="Telugu">Telugu</option>
                        <option value="Thai">Thai</option>
                        <option value="Turkish">Turkish</option>
                        <option value="Ukrainian">Ukrainian</option>
                        <option value="Urdu">Urdu</option>
                        <option value="Vietnamese">Vietnamese</option>
                    </select>
                </div>

                <hr className="border-slate-800" />
                <TodoList />

                <hr className="border-slate-800" />
                <ProjectHistory />

                <hr className="border-slate-800" />
                <div className="pt-2">
                    <a
                        href="mailto:kaironapp.ai@gmail.com"
                        className="flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors text-sm font-medium group"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:scale-110 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0c0 .993-.241 1.929-.668 2.754l-1.524-1.525a3.997 3.997 0 00.078-2.183l1.562-1.562C15.802 8.249 16 9.1 16 10zm-5.165 3.913l1.58 1.58A5.98 5.98 0 0110 16a5.976 5.976 0 01-2.516-.552l1.562-1.562a4.006 4.006 0 001.789.027zm-4.677-2.796a4.002 4.002 0 01-.041-2.08l-.08.08-1.53-1.533A5.98 5.98 0 004 10c0 .954.223 1.856.619 2.657l1.54-1.54zm1.088-6.45A5.974 5.974 0 0110 4c.954 0 1.856.223 2.657.619l-1.54 1.54a4.002 4.002 0 00-2.346.033L7.246 4.668zM12 10a2 2 0 11-4 0 2 2 0 014 0z" clipRule="evenodd" />
                        </svg>
                        Customer Support
                    </a>
                </div>
            </div>
        </aside>
    );
};