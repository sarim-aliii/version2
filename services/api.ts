import axios from 'axios';
import { LoginCredentials, SignupCredentials, StudyProject, Flashcard, MCQ as MCQType } from '../types';

const API_URL = '/api'; // Using proxy to point to the backend server

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to set the auth token for all subsequent requests
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Interceptor to handle API errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'An unknown error occurred';
    // Optionally log the error to a service
    // logError(error);
    return Promise.reject(new Error(message));
  }
);


// --- Auth ---
export const login = async (credentials: LoginCredentials) => {
  const { data } = await api.post('/auth/login', credentials);
  return data;
};

export const signup = async (credentials: SignupCredentials) => {
  const { data } = await api.post('/auth/register', credentials);
  return data;
};

export const getProfile = async () => {
  const { data } = await api.get('/auth/profile');
  return data;
};

// --- Projects ---
export const getProjects = async (): Promise<StudyProject[]> => {
    const { data } = await api.get('/projects');
    return data;
};

export const createProject = async (projectData: { name: string, ingestedText: string }): Promise<StudyProject> => {
    const { data } = await api.post('/projects', projectData);
    return data;
};

export const updateProject = async (id: string, projectData: Partial<StudyProject>): Promise<StudyProject> => {
    const { data } = await api.put(`/projects/${id}`, projectData);
    return data;
};

export const deleteProject = async (id: string) => {
    await api.delete(`/projects/${id}`);
};

// --- Gemini AI ---
// A generic function to handle all content generation requests
export const generateContent = async (
    projectId: string, 
    feature: 'summary' | 'flashcards' | 'tutor' | 'concept-map' | 'lesson-plan' | 'study-plan', 
    options: any
) => {
    const { data } = await api.post(`/gemini/${feature}`, { projectId, ...options });
    return data;
};

export const extractTextFromFile = async (llm: string, base64Data: string, fileType: string): Promise<string> => {
    const { data } = await api.post('/gemini/extract-text', { llm, base64Data, fileType });
    return data;
};

export const generateMCQs = async (llm: string, text: string, language: string, difficulty: string): Promise<any[]> => {
    const { data } = await api.post('/gemini/generate-mcqs', { llm, text, language, difficulty });
    return data;
};

export const generatePersonalizedStudyGuide = async (llm: string, text: string, incorrectMCQs: any[], language: string): Promise<string> => {
    const { data } = await api.post('/gemini/generate-study-guide', { llm, text, incorrectMCQs, language });
    return data;
};

// ... (existing functions: login, signup, getProfile, projects, generateContent, extractTextFromFile) ...

// --- Functions for Ingest.tsx ---
export const fetchTopicInfo = async (llm: string, topic: string, language: string): Promise<string> => {
  const { data } = await api.post('/gemini/topic-info', { llm, topic, language });
  return data;
};

// --- Functions for VoiceQA.tsx ---
export const transcribeAudio = async (llm: string, base64Data: string, fileType: string): Promise<string> => {
    const { data } = await api.post('/gemini/transcribe', { llm, base64Data, fileType });
    return data;
};

export const generateSummary = async (llm: string, text: string, language: string): Promise<string> => {
    const { data } = await api.post('/gemini/summary-from-text', { llm, text, language });
    return data;
};

export const generateFlashcards = async (llm: string, text: string, language: string): Promise<Flashcard[]> => {
    const { data } = await api.post('/gemini/flashcards-from-text', { llm, text, language });
    return data as Flashcard[];
};

export const generateAnswer = async (llm: string, text: string, question: string, language: string): Promise<string> => {
    const { data } = await api.post('/gemini/answer-from-text', { llm, text, question, language });
    return data;
};

// --- Functions for SemanticSearch.tsx ---
export const performSemanticSearch = async (llm: string, text: string, query: string, topK: number): Promise<string[]> => {
    const { data } = await api.post('/gemini/semantic-search', { text, query, topK });
    return data as string[];
};

// Export the configured instance if direct use is needed elsewhere
export default api;