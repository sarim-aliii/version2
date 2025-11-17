// sarim-aliii/version2/version2-1493846b30acdc91c679cab38a402d8b18ff91c6/context/AppContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { 
    Tab, 
    Notification, 
    NotificationType, 
    User, 
    StudyProject, 
    ChatMessage, 
    Flashcard, 
    EssayOutline, 
    LessonPlan, 
    StudyPlan,
    ConceptMapData,
    LoginCredentials,
    SignupCredentials
} from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import * as api from '../services/api'; // Importantly, this now includes googleLogin and githubLogin
import { v4 as uuidv4 } from 'uuid';
import { auth } from '../firebase';
import { GoogleAuthProvider, GithubAuthProvider, signInWithPopup } from 'firebase/auth'; // Import GithubAuthProvider

interface AppContextType {
    // Auth
    isAuthenticated: boolean;
    currentUser: User | null;
    login: (credentials: LoginCredentials) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    loginWithGithub: () => Promise<void>; // Added this
    signup: (credentials: SignupCredentials) => Promise<void>;
    logout: () => void;
    verifyEmail: (token: string) => Promise<void>;
    resetPassword: (token: string, newPassword: string) => Promise<void>;
    updateUserAvatar: (avatar: string) => Promise<void>;

    // Projects
    projects: StudyProject[];
    activeProjectId: string | null;
    activeProject: StudyProject | null;
    loadProject: (id: string) => void;
    startNewStudy: () => Promise<void>;
    renameProject: (id: string, newName: string) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
    updateActiveProjectData: (data: Partial<StudyProject>) => void;
    updateProjectData: (id: string, data: Partial<StudyProject>) => void;
    ingestText: (name: string, text: string) => Promise<void>;

    // UI State
    activeTab: Tab;
    setActiveTab: (tab: Tab) => void;
    isSidebarCollapsed: boolean;
    toggleSidebar: () => void;
    
    // AI Generation State & Functions
    llm: string;
    setLlm: (model: string) => void;
    language: string;
    setLanguage: (lang: string) => void;

    isGeneratingSummary: boolean;
    generateSummaryForActiveProject: () => Promise<void>;

    isGeneratingFlashcards: boolean;
    generateFlashcardsForActiveProject: () => Promise<void>;
    
    isTutorResponding: boolean;
    sendTutorMessage: (message: string) => Promise<string | undefined>;
    
    isGeneratingConceptMap: boolean;
    generateConceptMapForActiveProject: () => Promise<void>;
    
    isGeneratingLessonPlan: boolean;
    generateLessonPlanForActiveProject: (topic: string) => Promise<void>;

    isGeneratingStudyPlan: boolean;
    generateStudyPlanForActiveProject: (days: number) => Promise<void>;

    // Notifications
    notifications: Notification[];
    addNotification: (message: string, type?: NotificationType) => void;
    removeNotification: (id: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{children: ReactNode}> = ({ children }) => {
    const [userToken, setUserToken] = useLocalStorage<string | null>('authToken', null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useLocalStorage<Tab>('activeTab', Tab.Ingest);
    
    const [projects, setProjects] = useState<StudyProject[]>([]);
    const [activeProjectId, setActiveProjectId] = useLocalStorage<string | null>('activeProjectId', null);
    
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    
    const [llm, setLlm] = useLocalStorage('llm', 'gemini-2.5-flash');
    const [language, setLanguage] = useLocalStorage('language', 'English');
    
    // Loading states
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
    const [isTutorResponding, setIsTutorResponding] = useState(false);
    const [isGeneratingConceptMap, setIsGeneratingConceptMap] = useState(false);
    const [isGeneratingLessonPlan, setIsGeneratingLessonPlan] = useState(false);
    const [isGeneratingStudyPlan, setIsGeneratingStudyPlan] = useState(false);
    
    const isAuthenticated = !!userToken && !!currentUser;
    const activeProject = projects.find(p => p._id === activeProjectId) || null;

    // Notifications
    const addNotification = useCallback((message: string, type: NotificationType = 'error') => {
        const newNotification = { id: Date.now(), message, type };
        setNotifications(prev => [...prev, newNotification]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
        }, 5000);
    }, []);

    const removeNotification = useCallback((id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    // Auth
    const login = async (credentials: LoginCredentials) => {
        try {
            const data = await api.login(credentials);
            setUserToken(data.token);
            setCurrentUser({ _id: data._id, email: data.email, avatar: data.avatar });
            api.setAuthToken(data.token);
            await fetchProjects();
        } catch (error: any) {
            addNotification(error.message || 'Login failed.');
            throw error;
        }
    };

    const signup = async (credentials: SignupCredentials) => {
        try {
            const data = await api.signup(credentials);
            setUserToken(data.token);
            setCurrentUser({ _id: data._id, email: data.email, avatar: data.avatar });
            api.setAuthToken(data.token);
            setProjects([]);
            setActiveProjectId(null);
        } catch (error: any) {
            addNotification(error.message || 'Sign up failed.');
            throw error;
        }
    };
    
    const logout = () => {
        setUserToken(null);
        setCurrentUser(null);
        setProjects([]);
        setActiveProjectId(null);
        api.setAuthToken(null);
        setActiveTab(Tab.Ingest);
    };

    // Generic handler for successful social login
    const handleSocialLoginSuccess = (data: any, providerName: string) => {
        setUserToken(data.token);
        setCurrentUser({ _id: data._id, email: data.email, avatar: data.avatar });
        api.setAuthToken(data.token);
        fetchProjects(); // Don't await, let it load in background
        addNotification(`Logged in with ${providerName}!`, 'success');
    };
    
    const loginWithGoogle = async () => {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const idToken = await result.user.getIdToken();

            // Send the Firebase token to your backend
            const data = await api.googleLogin(idToken); // Use named api function

            // Log in to your custom app using your backend's response
            handleSocialLoginSuccess(data, 'Google');

        } catch (error: any) {
            addNotification(error.message || 'Google login failed.');
            throw error;
        }
    };

    // CORRECTED: loginWithGithub
    const loginWithGithub = async () => {
        try {
            const provider = new GithubAuthProvider(); // Use GithubAuthProvider
            const result = await signInWithPopup(auth, provider);
            const idToken = await result.user.getIdToken();

            // Send the Firebase token to your backend
            const data = await api.githubLogin(idToken); // Use named api function

            // Log in to your custom app using your backend's response
            handleSocialLoginSuccess(data, 'GitHub');

        } catch (error: any) {
            addNotification(error.message || 'GitHub login failed.');
            throw error;
        }
    };
    
    const verifyEmail = async (token: string) => { /* Implement API call */ };
    const resetPassword = async (token: string, newPassword: string) => { /* Implement API call */ };

    const updateUserAvatar = async (avatar: string) => {
        if (!currentUser) return;
        // In a real app, this would be an API call
        // await api.updateProfile({ avatar }); 
        setCurrentUser({ ...currentUser, avatar });
        addNotification("Avatar updated!", "success");
    };

    // Projects
    const fetchProjects = useCallback(async () => {
        if (userToken) {
            try {
                const fetchedProjects = await api.getProjects();
                setProjects(fetchedProjects);
                if (fetchedProjects.length > 0 && !fetchedProjects.find(p => p._id === activeProjectId)) {
                    setActiveProjectId(fetchedProjects[0]._id);
                } else if (fetchedProjects.length === 0) {
                    setActiveProjectId(null);
                }
            } catch (error: any) {
                addNotification(error.message || "Could not fetch projects.");
                if (error.response?.status === 401) logout();
            }
        }
    }, [userToken, activeProjectId, addNotification]); // addNotification was missing dependency

    useEffect(() => {
        if (userToken) {
            api.setAuthToken(userToken);
            api.getProfile().then(user => {
                setCurrentUser(user);
                fetchProjects();
            }).catch(() => logout());
        }
    }, [userToken, fetchProjects]); // fetchProjects was missing dependency

    const loadProject = (id: string) => setActiveProjectId(id);

    const startNewStudy = async () => {
        setActiveTab(Tab.Ingest);
    };

    const ingestText = async (name: string, text: string) => {
        try {
            const newProject = await api.createProject({ name, ingestedText: text });
            setProjects(prev => [newProject, ...prev]);
            setActiveProjectId(newProject._id);
            addNotification(`Study "${name}" created!`, 'success');
            setActiveTab(Tab.Summary);
        } catch (error: any) {
            addNotification(error.message || "Failed to create study.");
        }
    };

    const renameProject = async (id: string, newName: string) => {
        try {
            const updatedProject = await api.updateProject(id, { name: newName });
            setProjects(projects.map(p => p._id === id ? updatedProject : p));
        } catch (error: any) {
             addNotification(error.message || "Failed to rename study.");
        }
    };

    const deleteProject = async (id: string) => {
        try {
            await api.deleteProject(id);
            const remainingProjects = projects.filter(p => p._id !== id);
            setProjects(remainingProjects);
            if (activeProjectId === id) {
                setActiveProjectId(remainingProjects.length > 0 ? remainingProjects[0]._id : null);
            }
        } catch (error: any) {
            addNotification(error.message || "Failed to delete study.");
        }
    };

    const updateProjectData = (id: string, data: Partial<StudyProject>) => {
        setProjects(prev => prev.map(p => p._id === id ? { ...p, ...data } : p));
    };
    
    const updateActiveProjectData = (data: Partial<StudyProject>) => {
        if (activeProjectId) {
            updateProjectData(activeProjectId, data);
        }
    };
    
    // ... (AI Generation functions remain the same) ...
    // AI Generation
    const generateSummaryForActiveProject = async () => {
        if (!activeProject) return;
        setIsGeneratingSummary(true);
        try {
            const summary = await api.generateContent(activeProject._id, 'summary', { llm, language });
            updateActiveProjectData({ summary });
        } catch (e: any) { addNotification(e.message); } 
        finally { setIsGeneratingSummary(false); }
    };
    
    const generateFlashcardsForActiveProject = async () => {
        if (!activeProject) return;
        setIsGeneratingFlashcards(true);
        try {
             const flashcards: Flashcard[] = await api.generateContent(activeProject._id, 'flashcards', { llm, language });
            const srsFlashcards = flashcards.map(fc => ({
                ...fc,
                id: uuidv4(),
                easeFactor: 2.5,
                interval: 0,
                dueDate: new Date().toISOString(),
            }));
            updateActiveProjectData({ srsFlashcards });
        } catch (e: any) { addNotification(e.message); } 
        finally { setIsGeneratingFlashcards(false); }
    };

    const sendTutorMessage = async (message: string) => {
        if (!activeProject) return;
        
        const newHistory: ChatMessage[] = [...(activeProject.aiTutorHistory || []), { role: 'user', content: message }];
        updateActiveProjectData({ aiTutorHistory: newHistory });
        setIsTutorResponding(true);

        try {
            const responseText = await api.generateContent(activeProject._id, 'tutor', { message, history: newHistory, llm, language });
            const updatedHistory: ChatMessage[] = [...newHistory, { role: 'model', content: responseText }];
            updateActiveProjectData({ aiTutorHistory: updatedHistory });
            return responseText;
        } catch (e: any) { 
            addNotification(e.message); 
            const errorHistory: ChatMessage[] = [...newHistory, { role: 'model', content: "Sorry, I encountered an error." }];
            updateActiveProjectData({ aiTutorHistory: errorHistory });
        } 
        finally { setIsTutorResponding(false); }
    };

    const generateConceptMapForActiveProject = async () => {
        if (!activeProject) return;
        setIsGeneratingConceptMap(true);
        try {
            const conceptMapData: ConceptMapData = await api.generateContent(activeProject._id, 'concept-map', { llm, language });
            updateActiveProjectData({ conceptMapData });
        } catch (e: any) { addNotification(e.message); } 
        finally { setIsGeneratingConceptMap(false); }
    };
    
    const generateLessonPlanForActiveProject = async (topic: string) => {
        if (!activeProject) return;
        setIsGeneratingLessonPlan(true);
        try {
            const lessonPlan: LessonPlan = await api.generateContent(activeProject._id, 'lesson-plan', { topic, llm, language });
            updateActiveProjectData({ lessonPlan });
        } catch (e: any) { addNotification(e.message); }
        finally { setIsGeneratingLessonPlan(false); }
    };

    const generateStudyPlanForActiveProject = async (days: number) => {
        if (!activeProject) return;
        setIsGeneratingStudyPlan(true);
        try {
            const studyPlan: StudyPlan = await api.generateContent(activeProject._id, 'study-plan', { days, llm, language });
            updateActiveProjectData({ studyPlan });
        } catch (e: any) { addNotification(e.message); }
        finally { setIsGeneratingStudyPlan(false); }
    };


    const value = {
        isAuthenticated,
        currentUser,
        login,
        loginWithGoogle,
        loginWithGithub,
        signup,
        logout,
        verifyEmail,
        resetPassword,
        updateUserAvatar,
        projects,
        activeProjectId,
        activeProject,
        loadProject,
        startNewStudy,
        ingestText,
        renameProject,
        deleteProject,
        updateActiveProjectData,
        updateProjectData,
        activeTab,
        setActiveTab,
        isSidebarCollapsed,
        toggleSidebar: () => setIsSidebarCollapsed(prev => !prev),
        llm,
        setLlm,
        language,
        setLanguage,
        notifications,
        addNotification,
        removeNotification,
        isGeneratingSummary,
        generateSummaryForActiveProject,
        isGeneratingFlashcards,
        generateFlashcardsForActiveProject,
        isTutorResponding,
        sendTutorMessage,
        isGeneratingConceptMap,
        generateConceptMapForActiveProject,
        isGeneratingLessonPlan,
        generateLessonPlanForActiveProject,
        isGeneratingStudyPlan,
        generateStudyPlanForActiveProject,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};