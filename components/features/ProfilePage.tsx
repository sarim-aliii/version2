import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { AVATARS, AVATAR_KEYS } from '../ui/avatars';
import { Loader } from '../ui/Loader';


export const ProfilePage: React.FC = () => {
    const { currentUser, logout, updateUserAvatar, updateUserName } = useAppContext();
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (currentUser) {
            setNewName(currentUser.name || '');
        }
    }, [currentUser]);

    if (!currentUser) {
        return null;
    }

    const currentAvatarKey = currentUser.avatar || 'avatar-1';
    const CurrentAvatarComponent = AVATARS[currentAvatarKey];

    const handleSaveName = async () => {
        if (newName.trim() !== '') {
            setIsSaving(true);
            try {
                await updateUserName(newName);
                setIsEditing(false);
            } 
            catch (error: any) {
                const errMsg = error.message || '';
                if (errMsg.includes('401') || errMsg.includes('404') || errMsg.includes('Not authorized')) {
                    logout();
                }
            } 
            finally {
                setIsSaving(false);
            }
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setNewName(currentUser.name || '');
    };

    return (
        <Card title="Profile" className="max-w-3xl mx-auto fade-in">
            <div className="space-y-8 p-4">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative flex-shrink-0">
                        <div className="w-24 h-24 rounded-full bg-slate-700/50 p-2">
                             {CurrentAvatarComponent && <CurrentAvatarComponent className="w-full h-full text-red-400" />}
                        </div>
                    </div>

                    <div className="text-center sm:text-left flex-1">
                        <div className="flex flex-col sm:items-start items-center gap-2">
                            {isEditing ? (
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="text" 
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="bg-slate-900 border border-slate-700 rounded px-3 py-1 text-slate-100 focus:ring-2 focus:ring-red-500 outline-none"
                                        disabled={isSaving}
                                    />
                                    <button 
                                        onClick={handleSaveName} 
                                        disabled={isSaving}
                                        className="text-green-400 hover:text-green-300 text-sm disabled:opacity-50 flex items-center gap-1"
                                    >
                                        {/* FIXED: Actually using the Loader component now */}
                                        {isSaving ? <Loader spinnerClassName="w-4 h-4" /> : 'Save'}
                                    </button>
                                    <button 
                                        onClick={handleCancel} 
                                        disabled={isSaving}
                                        className="text-slate-500 hover:text-slate-400 text-sm disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <h2 className="text-2xl font-semibold text-slate-100">
                                        {currentUser.name || 'User'}
                                    </h2>
                                    <button 
                                        onClick={() => { setIsEditing(true); }}
                                        className="text-slate-500 hover:text-red-400 transition-colors"
                                        title="Edit Name"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                            <p className="text-sm text-slate-400 break-all">{currentUser.email}</p>
                        </div>
                    </div>
                    
                     <div className="w-full sm:w-auto sm:ml-auto">
                         <Button onClick={logout} variant="secondary" className="w-full">
                            Logout
                        </Button>
                    </div>
                </div>

                <div className="w-full pt-6 border-t border-slate-700">
                    <h3 className="text-xl font-semibold text-slate-200 mb-4">Change Avatar</h3>
                     <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                        {AVATAR_KEYS.map((key) => {
                            const AvatarComponent = AVATARS[key];
                            const isSelected = key === currentAvatarKey;
                            return (
                                <button
                                    key={key}
                                    onClick={() => updateUserAvatar(key)}
                                    className={`p-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-red-500 ${isSelected ? 'bg-red-500/30 ring-2 ring-red-500' : 'bg-slate-700/50 hover:bg-slate-700'}`}
                                    aria-label={`Select avatar ${key.replace('avatar-','')}`}
                                >
                                    <AvatarComponent className={`w-full h-full ${isSelected ? 'text-white' : 'text-slate-300'}`} />
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </Card>
    );
};