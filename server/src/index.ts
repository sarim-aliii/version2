import dotenv from 'dotenv';
dotenv.config();
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import cors from 'cors';

import express, { Request, Response } from 'express';
import connectDB from './config/db';
import path from 'path';

// Import routes
import authRoutes from './routes/authRoutes';
import projectRoutes from './routes/projectRoutes';
import geminiRoutes from './routes/geminiRoutes';
import feedbackRoutes from './routes/feedbackRoutes'; // <--- Import

// Connect to database
connectDB();

const app = express();

// Body parser middleware
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));
app.use(helmet());

// Global Limiter (General API protection)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api', globalLimiter);

// AI Specific Limiter (Stricter protection for expensive calls)
// Allow 20 AI requests per 15 minutes per IP
const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20, 
    message: { message: 'AI generation limit reached. Please wait a few minutes.' }
});
app.use('/api/gemini', aiLimiter);

app.use(hpp());

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', 
    credentials: true
}));

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/gemini', geminiRoutes);
app.use('/api/feedback', feedbackRoutes); // <--- Mount

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../../build')));

    app.get('*', (req: Request, res: Response) => res.sendFile(path.resolve(__dirname, '../../build', 'index.html')));
}


const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));