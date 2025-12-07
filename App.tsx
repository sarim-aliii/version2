import React, { useState } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Ingest } from './components/features/Ingest';
import { Summary } from './components/features/Summary';
import { Flashcards } from './components/features/Flashcards';
import { MCQ } from './components/features/MCQ';
import { SemanticSearch } from './components/features/SemanticSearch';
import { AITutor } from './components/features/AskLLM';
import { ConceptMap } from './components/features/ConceptMap';
import { AudioAnalysis } from './components/features/VoiceQA';
import { LessonPlanner } from './components/features/LessonPlanner';
import { StudyPlanner } from './components/features/StudyPlanner';
import { ProfilePage } from './components/features/ProfilePage';
import { ToastContainer } from './components/ui/Toast';
import { Tab } from './types';
import { AuthManager } from './components/auth/AuthManager';
import CodeAnalysis from './components/features/CodeAnalysis';
import { LandingPage } from './components/layout/LandingPage';
import { InterviewPrep } from './components/features/InterviewPrep';


const MainContent: React.FC = () => {
  const { activeTab, activeProjectId } = useAppContext();

  const renderActiveTab = () => {
    switch (activeTab) {
      case Tab.Ingest: return <Ingest />;
      case Tab.Summary: return <Summary />;
      case Tab.SRSFlashcards: return <Flashcards />;
      case Tab.MCQ: return <MCQ />;
      case Tab.SemanticSearch: return <SemanticSearch />;
      case Tab.AITutor: return <AITutor />;
      case Tab.ConceptMap: return <ConceptMap />;
      case Tab.AudioAnalysis: return <AudioAnalysis />;
      case Tab.LessonPlanner: return <LessonPlanner />;
      case Tab.StudyPlanner: return <StudyPlanner />;
      case Tab.CodeAnalysis: return <CodeAnalysis />;
      case Tab.InterviewPrep: return <InterviewPrep />;
      case Tab.Profile: return <ProfilePage />;
      default: return <Ingest />;
    }
  };

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div key={`${activeProjectId}-${activeTab}`} className="fade-in">
             {renderActiveTab()}
        </div>
      </div>
    </main>
  );
};

const AppLayout: React.FC = () => {
  const { isAuthenticated } = useAppContext();
  const [showAuth, setShowAuth] = useState(false);

  // 1. Authenticated View (Main App)
  if (isAuthenticated) {
    return (
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 overflow-hidden transition-colors duration-300">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <MainContent />
        </div>
        <ToastContainer />
      </div>
    );
  }

  // 2. Login/Signup View
  if (showAuth) {
    return (
        <div className="relative">
             {/* Optional: Back button to return to landing page from login */}
             <button 
                onClick={() => setShowAuth(false)}
                className="absolute top-4 left-4 text-slate-500 hover:text-white z-50 flex items-center gap-2 text-sm font-medium transition-colors"
             >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back
             </button>
             <AuthManager />
             <ToastContainer />
        </div>
    );
  }

  // 3. Default View (Landing Page)
  return <LandingPage onGetStarted={() => setShowAuth(true)} />;
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppLayout />
    </AppProvider>
  );
};

export default App;