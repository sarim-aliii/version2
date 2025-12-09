import axios from 'axios';
import { 
  LoginCredentials, 
  SignupCredentials, 
  StudyProject, 
  Flashcard, 
  CodeAnalysisResult 
} from '../types';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'An unknown error occurred';
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

export const googleLogin = async (idToken: string) => {
  const { data } = await api.post('/auth/google', { idToken });
  return data;
};

export const githubLogin = async (idToken: string) => {
  const { data } = await api.post('/auth/github', { idToken });
  return data;
};

export const getProfile = async () => {
  const { data } = await api.get('/auth/profile');
  return data;
};

export const updateProfile = async (userData: { name?: string; avatar?: string }) => {
  const { data } = await api.put('/auth/profile', userData);
  return data;
};

export const verifyEmail = async (token: string) => {
  const { data } = await api.post('/auth/verify-email', { token });
  return data;
};

export const forgotPassword = async (email: string) => {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data;
};

export const resetPassword = async (data: { email: string; otp: string; password: string }) => {
  const response = await api.post('/auth/reset-password', data);
  return response.data;
};

export const updateUserProgress = async (xpGained: number, category?: string) => {
  const { data } = await api.put('/auth/progress', { xpGained, category });
  return data;
};

// --- Feedback ---
export const sendFeedback = async (type: string, message: string) => {
    const { data } = await api.post('/feedback', { type, message });
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

export const fetchTopicInfo = async (llm: string, topic: string, language: string): Promise<string> => {
  const { data } = await api.post('/gemini/topic-info', { llm, topic, language });
  return data;
};

export const transcribeAudio = async (llm: string, file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('llm', llm);
  formData.append('fileType', file.type);

  const { data } = await api.post('/gemini/transcribe', formData);
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

export const performSemanticSearch = async (llm: string, text: string, query: string, topK: number): Promise<string[]> => {
  const { data } = await api.post('/gemini/semantic-search', { text, query, topK });
  return data as string[];
};

export const generateConceptMapFromText = async (llm: string, text: string, language: string) => {
  const { data } = await api.post('/gemini/concept-map-from-text', { llm, text, language });
  return data;
};

export const generateLessonPlanFromText = async (llm: string, text: string, topic: string, language: string) => {
  const { data } = await api.post('/gemini/lesson-plan-from-text', { llm, text, topic, language });
  return data;
};

export const generateStudyPlanFromText = async (llm: string, text: string, days: number, language: string) => {
  const { data } = await api.post('/gemini/study-plan-from-text', { llm, text, days, language });
  return data;
};

export const getTutorResponseFromText = async (llm: string, text: string, history: any[], message: string, language: string) => {
  const { data } = await api.post('/gemini/tutor-from-text', { llm, text, history, message, language });
  return data;
};

export const generateEssayOutlineFromText = async (llm: string, text: string, topic: string, language: string) => {
  const { data } = await api.post('/gemini/essay-outline-from-text', { llm, text, topic, language });
  return data;
};

export const generateEssayArgumentsFromText = async (llm: string, text: string, topic: string, language: string) => {
  const { data } = await api.post('/gemini/essay-arguments-from-text', { llm, text, topic, language });
  return data;
};

export const generateConceptMapForTopic = async (llm: string, topic: string, language: string) => {
  const { data } = await api.post('/gemini/concept-map-from-topic', { llm, topic, language });
  return data;
};

export const transcribeYoutube = async (llm: string, url: string): Promise<string> => {
  const { data } = await api.post('/gemini/transcribe-youtube', { llm, url });
  return data;
};

export const generateCodeAnalysis = async (llm: string, code: string, language: string): Promise<CodeAnalysisResult> => {
  const { data } = await api.post('/gemini/code-analysis/generate', { llm, code, language });
  return data as CodeAnalysisResult;
};

export const explainCodeAnalysis = async (llm: string, artifact: string, language: string, explanationType: string): Promise<string> => {
  const { data } = await api.post('/gemini/code-analysis/explain', { llm, artifact, language, explanationType });
  return data;
};

export const conductMockInterview = async (llm: string, topic: string, message: string, history: any[], language: string, difficulty: string) => {
  const { data } = await api.post('/gemini/mock-interview', { llm, topic, message, history, language, difficulty });
  return data;
};

export const updateTodos = async (todos: any[]) => {
  const { data } = await api.put('/auth/todos', { todos });
  return data;
};

export default api;