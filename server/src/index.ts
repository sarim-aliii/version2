import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import connectDB from './config/db';
import path from 'path';

// Import routes
import authRoutes from './routes/authRoutes';
import projectRoutes from './routes/projectRoutes';
import geminiRoutes from './routes/geminiRoutes';

// Connect to database
connectDB();

const app = express();

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/gemini', geminiRoutes);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../../build')));

    app.get('*', (req: Request, res: Response) => res.sendFile(path.resolve(__dirname, '../../build', 'index.html')));
}


const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));