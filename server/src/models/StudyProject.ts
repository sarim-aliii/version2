import mongoose, { Document, Model, Schema } from 'mongoose';
import { 
    SRFlashcard, 
    MCQAttempt, 
    ChatMessage, 
    EssayOutline, 
    ConceptMapData, 
    LessonPlan, 
    StudyPlan 
} from '../../../types';

// Interface for StudyProject document properties
interface IStudyProject {
  name: string;
  owner: mongoose.Schema.Types.ObjectId;
  ingestedText: string;
  status: 'processing' | 'ready' | 'error';
  summary?: string;
  srsFlashcards?: SRFlashcard[];
  mcqAttempts?: MCQAttempt[];
  semanticSearchHistory?: string[];
  aiTutorHistory?: ChatMessage[];
  essayTopic?: string;
  essayOutline?: EssayOutline;
  essayArguments?: string;
  conceptMapData?: ConceptMapData;
  lessonPlan?: LessonPlan;
  studyPlan?: StudyPlan;
}

// Interface for StudyProject document methods (if any)
interface IStudyProjectMethods {}

// Combine properties and methods into a single document interface
export interface IStudyProjectDocument extends IStudyProject, IStudyProjectMethods, Document {}

// Interface for the StudyProject model (for static methods, if any)
interface IStudyProjectModel extends Model<IStudyProjectDocument> {}

const studyProjectSchema = new Schema<IStudyProjectDocument, IStudyProjectModel>({
  name: { type: String, required: true, trim: true },
  owner: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  ingestedText: { type: String, required: true },
  status: { type: String, enum: ['processing', 'ready', 'error'], default: 'ready' },
  summary: { type: String },
  // FIX: Use [Object] to correctly type arrays of complex objects in the Mongoose schema.
  srsFlashcards: { type: [Object], default: [] },
  // FIX: Use [Object] to correctly type arrays of complex objects in the Mongoose schema.
  mcqAttempts: { type: [Object], default: [] },
  semanticSearchHistory: { type: [String], default: [] },
  // FIX: Use [Object] to correctly type arrays of complex objects in the Mongoose schema.
  aiTutorHistory: { type: [Object], default: [] },
  essayTopic: { type: String },
  essayOutline: { type: Object },
  essayArguments: { type: String },
  conceptMapData: { type: Object },
  lessonPlan: { type: Object },
  studyPlan: { type: Object },
}, {
  timestamps: true,
});

const StudyProject = mongoose.model<IStudyProjectDocument, IStudyProjectModel>('StudyProject', studyProjectSchema);

export default StudyProject;