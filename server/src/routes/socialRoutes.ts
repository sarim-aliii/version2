import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { getLeaderboard } from '../controllers/socialController';

const router = express.Router();

router.get('/leaderboard', protect, getLeaderboard);

export default router;