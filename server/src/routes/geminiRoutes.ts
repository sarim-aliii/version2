import express from 'express';
import { 
    generateSummary,
    generateFlashcards,
    getTutorResponse,
    generateConceptMap,
    generateLessonPlan,
    generateStudyPlan
} from '../controllers/geminiController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/summary', protect, generateSummary);
router.post('/flashcards', protect, generateFlashcards);
router.post('/tutor', protect, getTutorResponse);
router.post('/concept-map', protect, generateConceptMap);
router.post('/lesson-plan', protect, generateLessonPlan);
router.post('/study-plan', protect, generateStudyPlan);

export default router;
