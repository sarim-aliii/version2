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
  extractTextFromFile,
  transcribeYoutube
} from './api';


export const generateStudyPlan = async (llm: string, text: string, days: number, language: string): Promise<StudyPlan> => {
    return api.generateStudyPlanFromText(llm, text, days, language);
};

export const generateLessonPlan = async (llm: string, text: string, topic: string, language: string): Promise<LessonPlan> => {
    return api.generateLessonPlanFromText(llm, text, topic, language);
};

export const generateConceptMapData = async (llm: string, text: string, language: string): Promise<ConceptMapData> => {
    return api.generateConceptMapFromText(llm, text, language);
};

export const generateConceptMapForTopic = async (llm: string, topic: string, language: string): Promise<ConceptMapData> => {
    return api.generateConceptMapForTopic(llm, topic, language);
};

export const getTutorResponse = async (llm: string, text: string, history: ChatMessage[], message: string, language: string): Promise<string> => {
     return api.getTutorResponseFromText(llm, text, history, message, language);
};

export const generateEssayOutline = async (llm: string, text: string, topic: string, language: string): Promise<EssayOutline | null> => {
    return api.generateEssayOutlineFromText(llm, text, topic, language);
};

export const generateEssayArguments = async (llm: string, text: string, topic: string, language: string): Promise<string> => {
    return api.generateEssayArgumentsFromText(llm, text, topic, language);
};