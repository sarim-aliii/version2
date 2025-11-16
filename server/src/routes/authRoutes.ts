// FIX: This file contained placeholder text. Setting up Express routes for authentication, connecting controller functions to API endpoints.
import express from 'express';
import { registerUser, loginUser, getUserProfile } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile); // Example protected route

export default router;
