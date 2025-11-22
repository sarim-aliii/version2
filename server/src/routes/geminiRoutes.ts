import express from 'express';
import { 
    generateSummary,
    generateFlashcards,
    getTutorResponse,
    generateConceptMap,
    generateLessonPlan,
    generateStudyPlan,
    extractTextFromFile,
    generateMCQs,
    generatePersonalizedStudyGuide,
    fetchTopicInfo,                  
    transcribeAudio,                 
    generateSummaryFromText,        
    generateFlashcardsFromText,       
    generateAnswerFromText,          
    performSemanticSearch           
} from '../controllers/geminiController';
import { protect } from '../middleware/authMiddleware';
import multer from 'multer';


const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });


router.post('/summary', protect, generateSummary);
router.post('/flashcards', protect, generateFlashcards);
router.post('/tutor', protect, getTutorResponse);
router.post('/concept-map', protect, generateConceptMap);
router.post('/lesson-plan', protect, generateLessonPlan);
router.post('/study-plan', protect, generateStudyPlan);
router.post('/topic-info', protect, fetchTopicInfo);
router.post('/summary-from-text', protect, generateSummaryFromText);
router.post('/flashcards-from-text', protect, generateFlashcardsFromText);
router.post('/answer-from-text', protect, generateAnswerFromText);
router.post('/semantic-search', protect, performSemanticSearch);
router.post('/generate-mcqs', protect, generateMCQs);
router.post('/generate-study-guide', protect, generatePersonalizedStudyGuide);
router.post('/extract-text', protect, extractTextFromFile);
router.post('/transcribe', protect, upload.single('file'), transcribeAudio);


export default router;