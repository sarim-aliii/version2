import axiosInstance from './api';
import * as apiHelpers from './api';
import {
    ChatMessage,
    EssayOutline,
    LessonPlan,
    StudyPlan,
    ConceptMapData,
    Flashcard,
    CodeAnalysisResult
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
    return apiHelpers.generateStudyPlanFromText(llm, text, days, language);
};

export const generateLessonPlan = async (llm: string, text: string, topic: string, language: string): Promise<LessonPlan> => {
    return apiHelpers.generateLessonPlanFromText(llm, text, topic, language);
};

export const generateConceptMapData = async (llm: string, text: string, language: string): Promise<ConceptMapData> => {
    return apiHelpers.generateConceptMapFromText(llm, text, language);
};

export const generateConceptMapForTopic = async (llm: string, topic: string, language: string): Promise<ConceptMapData> => {
    return apiHelpers.generateConceptMapForTopic(llm, topic, language);
};

export const getTutorResponse = async (llm: string, text: string, history: ChatMessage[], message: string, language: string): Promise<string> => {
    return apiHelpers.getTutorResponseFromText(llm, text, history, message, language);
};

export const generateEssayOutline = async (llm: string, text: string, topic: string, language: string): Promise<EssayOutline | null> => {
    return apiHelpers.generateEssayOutlineFromText(llm, text, topic, language);
};

export const generateEssayArguments = async (llm: string, text: string, topic: string, language: string): Promise<string> => {
    return apiHelpers.generateEssayArgumentsFromText(llm, text, topic, language);
};

export const generateCodeAnalysis = async (llm: string, code: string, language: string): Promise<CodeAnalysisResult> => {
    const { data } = await axiosInstance.post('/gemini/code-analysis/generate', { llm, code, language });
    return data as CodeAnalysisResult;
};

export const explainCodeAnalysis = async (llm: string, artifact: string, language: string, explanationType: string): Promise<string> => {
    const { data } = await axiosInstance.post('/gemini/code-analysis/explain', { llm, artifact, language, explanationType });
    return data;
};

export const conductMockInterview = async (llm: string, topic: string, message: string, history: ChatMessage[], language: string, difficulty: string): Promise<string> => {
    return apiHelpers.conductMockInterview(llm, topic, message, history, language, difficulty);
};