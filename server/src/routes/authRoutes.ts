import express from 'express';
import { registerUser, loginUser, getUserProfile, googleLogin, githubLogin } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLogin);
router.post('/github', githubLogin);
router.get('/profile', protect, getUserProfile);

export default router;