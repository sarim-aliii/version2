import axios from 'axios';
import { LoginCredentials, SignupCredentials, StudyProject } from '../types';

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

// Export the configured instance if direct use is needed elsewhere
export default api;
