import * as api from './api';
import { 
  ChatMessage, 
  EssayOutline, 
  LessonPlan, 
  StudyPlan, 
  ConceptMapData, 
  Flashcard 
} from '../types';

export { 
  fetchTopicInfo, 
  transcribeAudio, 
  generateSummary, 
  generateFlashcards, 
  generateAnswer, 
  performSemanticSearch,
  generateMCQs,
  generatePersonalizedStudyGuide,
  extractTextFromFile
} from './api';

// --- Implement missing wrappers ---

export const generateStudyPlan = async (llm: string, text: string, days: number, language: string): Promise<StudyPlan> => {
    throw new Error("Please create/save a study project first to generate a Study Plan.");
};

export const generateLessonPlan = async (llm: string, text: string, topic: string, language: string): Promise<LessonPlan> => {
    throw new Error("Please create/save a study project first to generate a Lesson Plan.");
};

export const generateConceptMapData = async (llm: string, text: string, language: string): Promise<ConceptMapData> => {
    throw new Error("Please create/save a study project first to generate a Concept Map.");
};

export const generateConceptMapForTopic = async (llm: string, topic: string, language: string): Promise<ConceptMapData> => {
    throw new Error("Feature not implemented in backend yet.");
};

export const getTutorResponse = async (llm: string, text: string, history: ChatMessage[], message: string, language: string): Promise<string> => {
     throw new Error("Please create/save a study project first to use the AI Tutor.");
};

export const generateEssayOutline = async (llm: string, text: string, topic: string, language: string): Promise<EssayOutline | null> => {
    throw new Error("Please create/save a study project first to generate an Essay Outline.");
};

export const generateEssayArguments = async (llm: string, text: string, topic: string, language: string): Promise<string> => {
    throw new Error("Please create/save a study project first to generate Arguments.");
};