import React from 'react';
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

const MainContent: React.FC = () => {
  const { activeTab } = useAppContext();

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
      case Tab.Profile: return <ProfilePage />;
      default: return <Ingest />;
    }
  };

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {renderActiveTab()}
      </div>
    </main>
  );
};

const AppLayout: React.FC = () => {
  const { isAuthenticated } = useAppContext();

  if (!isAuthenticated) {
    return <AuthManager />;
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <MainContent />
      </div>
      <ToastContainer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppLayout />
    </AppProvider>
  );
};

export default App;
