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

const router = express.Router();

router.post('/summary', protect, generateSummary);
router.post('/flashcards', protect, generateFlashcards);
router.post('/tutor', protect, getTutorResponse);
router.post('/concept-map', protect, generateConceptMap);
router.post('/lesson-plan', protect, generateLessonPlan);
router.post('/study-plan', protect, generateStudyPlan);
router.post('/topic-info', protect, fetchTopicInfo);
router.post('/transcribe', protect, transcribeAudio);
router.post('/summary-from-text', protect, generateSummaryFromText);
router.post('/flashcards-from-text', protect, generateFlashcardsFromText);
router.post('/answer-from-text', protect, generateAnswerFromText);
router.post('/semantic-search', protect, performSemanticSearch);
router.post('/extract-text', protect, extractTextFromFile);
router.post('/generate-mcqs', protect, generateMCQs);
router.post('/generate-study-guide', protect, generatePersonalizedStudyGuide);

export default router;
