import { SimulationLinkDatum, SimulationNodeDatum } from 'd3';

export interface User {
    _id: string;
    email: string;
    name: string;
    avatar?: string;
    xp?: number;
    level?: number;
    currentStreak?: number;
    todos?: Todo[];
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface SignupCredentials {
    email: string;
    password: string;
}

export interface Flashcard {
  question: string;
  answer: string;
}

export interface SRFlashcard extends Flashcard {
  id: string;
  easeFactor: number;
  interval: number; // in days
  dueDate: string; // ISO string date
}

export interface MCQ {
  question:string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface MCQAttempt {
    date: string; // ISO string
    score: number;
    total: number;
    incorrectQuestions: string[];
}

export interface ConceptNode extends SimulationNodeDatum {
    id: string;
    group: number;
}

export interface ConceptLink extends SimulationLinkDatum<ConceptNode> {
    source: string | ConceptNode;
    target: string | ConceptNode;
    value: number;
}

export interface ConceptMapData {
    nodes: ConceptNode[];
    links: ConceptLink[];
}

export enum Priority {
    High = 'High',
    Medium = 'Medium',
    Low = 'Low',
}

export interface Todo {
  id: number;
  text: string;
  completed: boolean;
  priority: Priority;
  deleting?: boolean;
}

export enum Tab {
    Ingest = 'Ingest',
    Summary = 'Summary',
    SRSFlashcards = 'SRS Flashcards',
    MCQ = 'MCQ',
    CodeAnalysis = 'Code Analysis',
    SemanticSearch = 'Semantic Search',
    AITutor = 'AI Tutor',
    AudioAnalysis = 'Audio Analysis',
    ConceptMap = 'Concept Map',
    LessonPlanner = 'Lesson Planner',
    StudyPlanner = 'Study Planner',
    Profile = 'Profile',
}

export type NotificationType = 'error' | 'success' | 'info';

export interface Notification {
  id: number;
  message: string;
  type: NotificationType;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface EssayOutline {
    title: string;
    introduction: string;
    body: {
        heading: string;
        points: string[];
    }[];
    conclusion: string;
}

export interface LessonPlan {
    title: string;
    objective: string;
    duration: string;
    materials: string[];
    activities: {
        name: string;
        duration: string;
        description: string;
    }[];
    assessment: string;
}

export interface StudyDay {
    day: number;
    topic: string;
    tasks: string[];
}

export interface StudyPlan {
    title: string;
    durationDays: number;
    schedule: StudyDay[];
}

export interface CodeAnalysisResult {
    algorithm: string;
    pseudocode: string;
    flowchart: string;
}

export interface StudyProject {
  _id: string;
  name: string;
  owner: string; // User ID
  createdAt: string; // ISO string
  ingestedText: string;
  status?: 'processing' | 'ready' | 'error';
  summary?: string;
  srsFlashcards?: SRFlashcard[];
  mcqAttempts?: MCQAttempt[];
  currentMcqs?: MCQ[];
  semanticSearchHistory?: string[];
  aiTutorHistory?: ChatMessage[];
  essayTopic?: string;
  essayOutline?: EssayOutline;
  essayArguments?: string;
  conceptMapData?: ConceptMapData;
  lessonPlan?: LessonPlan;
  studyPlan?: StudyPlan;
  codeSnippet?: string; 
  codeAnalysis?: CodeAnalysisResult;
  todos?: Todo[];
  chunks?: string[];
  embeddings?: number[][];
}

export interface AIGenerationOptions {
    llm: string;
    language: string;
}