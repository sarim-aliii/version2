import React from 'react';
import { TodoList } from '../features/TodoList';
import { useAppContext } from '../../context/AppContext';
import { ProjectHistory } from './ProjectHistory';

export const Sidebar: React.FC = () => {
    const { isSidebarCollapsed, language, setLanguage, llm, setLlm } = useAppContext();

    return (
        <aside className={`w-full bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${isSidebarCollapsed ? 'md:w-0 border-transparent' : 'md:w-72 lg:w-80'}`}>
            <div className={`space-y-6 overflow-y-auto flex-1 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'opacity-0 p-0' : 'p-6 opacity-100'}`}>
                <h2 className="text-xl font-bold text-slate-100">Options</h2>
                
                <div>
                    <h3 className="text-sm font-semibold text-slate-400 mb-1">LLM</h3>
                    <select
                        value={llm}
                        onChange={(e) => setLlm(e.target.value)}
                        className="w-full text-sm text-slate-200 bg-slate-800 p-2 rounded border border-slate-700 focus:ring-2 focus:ring-red-500 focus:outline-none"
                    >
                        <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                    </select>
                    <p className="text-xs text-slate-500 mt-1">Using the recommended model for optimal performance and quality.</p>
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
                <ProjectHistory />
                <hr className="border-slate-800" />
                <TodoList />
                <hr className="border-slate-800" />
                <div>
                    <h3 className="text-sm font-semibold text-slate-400 mb-2">Support</h3>
                    <a href="mailto:kaironapp.ai@gmail.com" className="flex items-center gap-2 text-sm text-slate-300 hover:text-red-400 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                        <span>kaironapp.ai@gmail.com</span>
                    </a>
                    <p className="text-xs text-slate-500 mt-1">For questions or feedback.</p>
                </div>
            </div>
        </aside>
    );
};