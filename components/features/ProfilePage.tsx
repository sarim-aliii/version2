import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { AVATARS, AVATAR_KEYS } from '../ui/avatars';

export const ProfilePage: React.FC = () => {
    const { currentUser, logout, updateUserAvatar } = useAppContext();

    if (!currentUser) {
        return null;
    }

    const currentAvatarKey = currentUser.avatar || 'avatar-1';
    const CurrentAvatarComponent = AVATARS[currentAvatarKey];

    return (
        <Card title="Profile" className="max-w-3xl mx-auto fade-in">
            <div className="space-y-8 p-4">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative flex-shrink-0">
                        <div className="w-24 h-24 rounded-full bg-slate-700/50 p-2">
                             {CurrentAvatarComponent && <CurrentAvatarComponent className="w-full h-full text-red-400" />}
                        </div>
                    </div>

                    <div className="text-center sm:text-left">
                        <h2 className="text-2xl font-semibold text-slate-100 break-all">{currentUser.email}</h2>
                        <p className="text-sm text-slate-400">Kairon AI User</p>
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