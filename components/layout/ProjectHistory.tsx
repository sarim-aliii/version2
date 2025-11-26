import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';

const Menu: React.FC<{ onRename: () => void, onDelete: () => void, onShare: () => void, isActive: boolean }> = ({ onRename, onDelete, onShare, isActive }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const deleteTimeoutRef = useRef<number | null>(null);

    const closeMenu = (andResetDelete = true) => {
        setIsOpen(false);
        if (andResetDelete) {
            setIsConfirmingDelete(false);
            if (deleteTimeoutRef.current) {
                clearTimeout(deleteTimeoutRef.current);
                deleteTimeoutRef.current = null;
            }
        }
    };

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                closeMenu();
            }
        };
        
        window.addEventListener("mousedown", handleClickOutside);
        return () => {
            window.removeEventListener("mousedown", handleClickOutside);
            if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
        };
    }, [isOpen]);

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isConfirmingDelete) {
            onDelete();
            closeMenu();
        } else {
            setIsConfirmingDelete(true);
            deleteTimeoutRef.current = window.setTimeout(() => {
                setIsConfirmingDelete(false);
            }, 3000); 
        }
    };

    return (
        // Added z-index to this container (Menu) to ensure it sits above everything else in the li
        <div className="relative z-[100]" ref={menuRef}> 
            <button 
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} 
                className={`p-1.5 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200
                    ${isOpen || isActive 
                        ? 'opacity-100 bg-slate-700 text-white' 
                        : 'opacity-0 group-hover:opacity-100 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                    }`}
                aria-label="Options"
            >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
            </button>
            
            {/* Dropdown Menu - Increased width to w-64, explicitly solid bg, high z-index */}
            {isOpen && (
                <div 
                    className="absolute right-0 top-full mt-1 w-64 bg-slate-900 border border-slate-700 rounded-md shadow-xl z-[100] py-1 origin-top-right"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button 
                        onClick={(e) => { e.stopPropagation(); onShare(); closeMenu(); }} 
                        className="flex items-center gap-3 w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-70" viewBox="0 0 20 20" fill="currentColor"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" /></svg>
                        Share
                    </button>
                    
                    <button 
                        onClick={(e) => { e.stopPropagation(); onRename(); closeMenu(); }} 
                        className="flex items-center gap-3 w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-70" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                        Rename
                    </button>
                    
                    <div className="my-1 border-t border-slate-700/50"></div>
                    
                    <button 
                        onClick={handleDeleteClick} 
                        className={`flex items-center gap-3 w-full text-left px-3 py-2 text-sm transition-colors hover:bg-slate-800 ${isConfirmingDelete ? 'text-yellow-400 font-bold bg-yellow-400/10' : 'text-red-400 hover:text-red-300'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-70" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002 2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        {isConfirmingDelete ? 'Confirm?' : 'Delete'}
                    </button>
                </div>
            )}
        </div>
    );
}

export const ProjectHistory: React.FC = () => {
    const { projects, activeProjectId, loadProject, renameProject, deleteProject, startNewStudy, addNotification } = useAppContext();
    
    const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
    const [editingProjectName, setEditingProjectName] = useState('');
    const renameInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editingProjectId && renameInputRef.current) {
            renameInputRef.current.focus();
        }
    }, [editingProjectId]);

    const handleStartRename = (id: string, currentName: string) => {
        setEditingProjectId(id);
        setEditingProjectName(currentName);
    };

    const handleCancelRename = () => {
        setEditingProjectId(null);
        setEditingProjectName('');
    };

    const handleFinishRename = () => {
        if (editingProjectId && editingProjectName.trim()) {
            renameProject(editingProjectId, editingProjectName.trim());
        }
        handleCancelRename();
    };

    const handleDelete = (id: string, name: string) => {
        deleteProject(id);
        addNotification(`"${name}" has been deleted.`, 'info');
    };

    const handleShare = (id: string, name: string) => {
        const shareUrl = `${window.location.origin}/share/project/${id}`;
        navigator.clipboard.writeText(shareUrl);
        addNotification(`Link for "${name}" copied to clipboard!`, 'success');
    };
    
    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-lg font-bold text-slate-100">Study History</h2>
            </div>
            <button
                onClick={startNewStudy}
                className="w-full text-left text-sm px-3 py-2 rounded-md bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors mb-3 flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:shadow-red-900/20"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                New Study
            </button>
            
            <ul className="space-y-1 pr-2 overflow-y-auto custom-scrollbar flex-1 pb-24">
                {projects.map(project => (
                    <li key={project._id} className="group relative">
                        {editingProjectId === project._id ? (
                            <div className="px-2 py-1">
                                <input
                                    ref={renameInputRef}
                                    type="text"
                                    value={editingProjectName}
                                    onChange={(e) => setEditingProjectName(e.target.value)}
                                    onBlur={handleFinishRename}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleFinishRename();
                                        if (e.key === 'Escape') handleCancelRename();
                                    }}
                                    className="w-full text-sm px-3 py-2 rounded-md bg-slate-800 border border-red-500 text-slate-100 focus:outline-none focus:ring-1 focus:ring-red-500"
                                />
                            </div>
                        ) : (
                            <div className="flex items-center">
                                <button
                                    onClick={() => loadProject(project._id)}
                                    disabled={project.status === 'processing'}
                                    // FIXED: Added pr-12 to ensure 3-dot menu and its dropdown has enough space (was pr-6)
                                    // Also added an explicit z-index of z-10 for stacking context of the button content
                                    className={`flex-1 text-left text-sm px-3 py-2 rounded-md transition-all duration-200 truncate flex items-center justify-between ${activeProjectId === project._id ? 'bg-slate-800 text-red-400 font-semibold shadow-sm border-l-2 border-red-500' : 'text-slate-300 hover:bg-slate-800/50 border-l-2 border-transparent'} disabled:cursor-wait disabled:opacity-60`}
                                    title={project.name}
                                >
                                    <span className="truncate pr-12 z-10 relative">{project.name}</span>
                                    {project.status === 'processing' && (
                                        <svg className="animate-spin h-3 w-3 text-slate-400 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    )}
                                </button>
                                
                                <div className="absolute right-1 top-1/2 -translate-y-1/2">
                                    {project.status !== 'processing' && (
                                        <Menu 
                                            onShare={() => handleShare(project._id, project.name)}
                                            onDelete={() => handleDelete(project._id, project.name)} 
                                            onRename={() => handleStartRename(project._id, project.name)} 
                                            isActive={activeProjectId === project._id} 
                                        />
                                    )}
                                </div>
                            </div>
                        )}
                    </li>
                ))}
                {projects.length === 0 && (
                    <div className="py-8 text-center opacity-50">
                        <p className="text-xs text-slate-400">No studies yet.</p>
                        <p className="text-[10px] text-slate-600 mt-1">Start a new one above!</p>
                    </div>
                )}
            </ul>
        </div>
    );
};