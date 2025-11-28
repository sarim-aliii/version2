import mongoose, { Document, Model, Schema } from 'mongoose';
import { 
    SRFlashcard, 
    MCQAttempt, 
    ChatMessage, 
    EssayOutline, 
    ConceptMapData, 
    LessonPlan, 
    StudyPlan,
    MCQ,
    CodeAnalysisResult,
    Todo
} from '../../../types';

interface IStudyProject {
  name: string;
  owner: mongoose.Schema.Types.ObjectId;
  ingestedText: string;
  status: 'processing' | 'ready' | 'error';
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


interface IStudyProjectMethods {}

export interface IStudyProjectDocument extends IStudyProject, IStudyProjectMethods, Document {}

const FlashcardSchema = new Schema({
    id: String,
    question: String,
    answer: String,
    easeFactor: Number,
    interval: Number,
    dueDate: Date
});

interface IStudyProjectModel extends Model<IStudyProjectDocument> {}

const studyProjectSchema = new Schema<IStudyProjectDocument, IStudyProjectModel>({
  name: { type: String, required: true, trim: true },
  owner: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  ingestedText: { type: String, required: true },
  status: { type: String, enum: ['processing', 'ready', 'error'], default: 'ready' },
  summary: { type: String },
  srsFlashcards: [FlashcardSchema],
  mcqAttempts: { type: [Object], default: [] },
  currentMcqs: { type: [Object], default: [] },
  semanticSearchHistory: { type: [String], default: [] },
  aiTutorHistory: { type: [Object], default: [] },
  essayTopic: { type: String },
  essayOutline: { type: Object },
  essayArguments: { type: String },
  conceptMapData: { type: Object },
  lessonPlan: { type: Object },
  studyPlan: { type: Object },
  codeSnippet: { type: String },
  codeAnalysis: { type: Object },
  todos: { type: [Object], default: [] },
  chunks: { type: [String], default: [] }, 
  embeddings: { type: [[Number]], default: [] },
}, {
  timestamps: true,
});

const StudyProject = mongoose.model<IStudyProjectDocument, IStudyProjectModel>('StudyProject', studyProjectSchema);

export default StudyProject;