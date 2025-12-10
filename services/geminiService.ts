import axiosInstance from './api';
import * as apiHelpers from './api';
import {
    ChatMessage,
    EssayOutline,
    LessonPlan,
    StudyPlan,
    ConceptMapData,
    CodeAnalysisResult,
    PodcastSegment
} from '../types';

// REMOVED 'performSemanticSearch' from this list to avoid duplicate identifier error
export {
    fetchTopicInfo,
    transcribeAudio,
    generateSummary,
    generateFlashcards,
    generateAnswer,
    generateMCQs,
    generatePersonalizedStudyGuide,
    extractTextFromFile,
    transcribeYoutube,
} from './api';

import { SearchResult } from './api';

export const generateStudyPlan = async (llm: string, text: string, days: number, language: string): Promise<StudyPlan> => {
    try {
        return await apiHelpers.generateStudyPlanFromText(llm, text, days, language);
    } catch (error) {
        console.error("Error in generateStudyPlan:", error);
        throw error;
    }
};

export const generateLessonPlan = async (llm: string, text: string, topic: string, language: string): Promise<LessonPlan> => {
    try {
        return await apiHelpers.generateLessonPlanFromText(llm, text, topic, language);
    } catch (error) {
        console.error("Error in generateLessonPlan:", error);
        throw error;
    }
};

export const generateConceptMapData = async (llm: string, text: string, language: string): Promise<ConceptMapData> => {
    try {
        return await apiHelpers.generateConceptMapFromText(llm, text, language);
    } catch (error) {
        console.error("Error in generateConceptMapData:", error);
        throw error;
    }
};

export const generateConceptMapForTopic = async (llm: string, topic: string, language: string): Promise<ConceptMapData> => {
    try {
        return await apiHelpers.generateConceptMapForTopic(llm, topic, language);
    } catch (error) {
        console.error("Error in generateConceptMapForTopic:", error);
        throw error;
    }
};

export const getTutorResponse = async (llm: string, text: string, history: ChatMessage[], message: string, language: string): Promise<string> => {
    try {
        return await apiHelpers.getTutorResponseFromText(llm, text, history, message, language);
    } catch (error) {
        console.error("Error in getTutorResponse:", error);
        throw error;
    }
};

export const generateEssayOutline = async (llm: string, text: string, topic: string, language: string): Promise<EssayOutline | null> => {
    try {
        return await apiHelpers.generateEssayOutlineFromText(llm, text, topic, language);
    } catch (error) {
        console.error("Error in generateEssayOutline:", error);
        throw error;
    }
};

export const generateEssayArguments = async (llm: string, text: string, topic: string, language: string): Promise<string> => {
    try {
        return await apiHelpers.generateEssayArgumentsFromText(llm, text, topic, language);
    } catch (error) {
        console.error("Error in generateEssayArguments:", error);
        throw error;
    }
};

export const generateCodeAnalysis = async (llm: string, code: string, language: string): Promise<CodeAnalysisResult> => {
    try {
        const { data } = await axiosInstance.post('/gemini/code-analysis/generate', { llm, code, language });
        return data as CodeAnalysisResult;
    } catch (error) {
        console.error("Error in generateCodeAnalysis:", error);
        throw error;
    }
};

export const explainCodeAnalysis = async (llm: string, artifact: string, language: string, explanationType: string): Promise<string> => {
    try {
        const { data } = await axiosInstance.post('/gemini/code-analysis/explain', { llm, artifact, language, explanationType });
        return data;
    } catch (error) {
        console.error("Error in explainCodeAnalysis:", error);
        throw error;
    }
};

export const conductMockInterview = async (llm: string, topic: string, message: string, history: ChatMessage[], language: string, difficulty: string): Promise<string> => {
    try {
        return await apiHelpers.conductMockInterview(llm, topic, message, history, language, difficulty);
    } catch (error) {
        console.error("Error in conductMockInterview:", error);
        throw error;
    }
};

export const generatePodcastScript = async (llm: string, projectId: string, language: string): Promise<PodcastSegment[]> => {
    try {
        return await apiHelpers.generatePodcastScript(llm, projectId, language);
    } catch (error) {
        console.error("Error in generatePodcastScript:", error);
        throw error;
    }
};

export const performSemanticSearch = async (
    llm: string, 
    text: string, 
    query: string, 
    topK: number,
    projectId?: string,
    global: boolean = false
): Promise<SearchResult[]> => {
    try {
        return await apiHelpers.performSemanticSearch(llm, text, query, topK, projectId, global);
    } catch (error) {
        console.error("Error in performSemanticSearch:", error);
        throw error;
    }
};