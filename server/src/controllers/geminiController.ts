import { Request, Response } from 'express';
import StudyProject from '../models/StudyProject';
import {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
    GenerationConfig,
    Part,
    Content
} from "@google/generative-ai";
import ytdl from '@distube/ytdl-core';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { YoutubeTranscript } from 'youtube-transcript';


if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const defaultModelName = 'gemini-flash-latest';

const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

const generationConfig: GenerationConfig = {
    temperature: 0.7,
    topK: 1,
    topP: 1,
    maxOutputTokens: 8192,
};

const getProjectForUser = async (projectId: string, userId: string) => {
    const project = await StudyProject.findById(projectId);
    if (!project) {
        throw { status: 404, message: 'Project not found' };
    }
    if (project.owner.toString() !== userId.toString()) {
        throw { status: 401, message: 'Not authorized to access this project' };
    }
    return project;
};

// Global instruction for Math consistency
const MATH_INSTRUCTION = " Always format mathematical equations using LaTeX syntax (e.g., $E=mc^2$ for inline, $$E=mc^2$$ for block equations). Do not use plain text for math formulas.";

// Helper to get model dynamic instance
const getModel = (llm: string, responseMimeType?: string, systemInstruction?: string) => {
    let modelName = llm || defaultModelName;

    // FIX: Catch invalid model names from old localStorage and force a valid one
    const validModels = [
        'gemini-flash-latest', 
        'gemini-pro-latest', 
        'gemini-2.0-flash-001', 
        'gemini-2.0-flash-lite-preview-02-05'
    ];

    if (!validModels.includes(modelName)) {
        console.warn(`Invalid model '${modelName}' requested. Falling back to '${defaultModelName}'`);
        modelName = defaultModelName;
    }

    // Append math instruction to any existing system instruction, or create one
    const finalSystemInstruction = systemInstruction 
        ? `${systemInstruction}\n\n${MATH_INSTRUCTION}`
        : `You are a helpful AI assistant. ${MATH_INSTRUCTION}`;

    const modelParams: any = {
        model: modelName,
        safetySettings,
        generationConfig: responseMimeType ? { ...generationConfig, responseMimeType } : generationConfig,
        systemInstruction: finalSystemInstruction // Use the enhanced instruction
    };

    return genAI.getGenerativeModel(modelParams);
}

const downloadAudioBuffer = async (url: string): Promise<{ buffer: Buffer, mimeType: string }> => {
    if (!ytdl.validateURL(url)) {
        throw new Error("Invalid YouTube URL");
    }

    const info = await ytdl.getInfo(url);
    const format = ytdl.chooseFormat(info.formats, { quality: 'lowestaudio', filter: 'audioonly' });
    const mimeType = format.mimeType?.split(';')[0] || 'audio/mp3';

    const stream = ytdl(url, { 
        quality: 'lowestaudio', 
        filter: 'audioonly' 
    });

    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    
    return {
        buffer: Buffer.concat(chunks),
        mimeType: mimeType
    };
};

export const generateSummary = async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const { projectId, language, llm } = req.body;
    try {
        const project = await getProjectForUser(projectId, req.user.id);
        const prompt = `Summarize the following text in ${language}. Provide a concise but comprehensive overview of the key points.\n\nTEXT:\n${project.ingestedText}`;

        const model = getModel(llm);
        const result = await model.generateContent(prompt);
        res.json(result.response.text());
    } catch (error: any) {
        res.status(error.status || 500).json({ message: error.message || 'Failed to generate summary' });
    }
};


export const generateFlashcards = async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const { projectId, language, llm } = req.body;
    try {
        const project = await getProjectForUser(projectId, req.user.id);
        const prompt = `Based on the following text, generate a JSON array of 5-10 flashcards in ${language}. Each flashcard should be an object with a "question" (string) and "answer" (string) property.\n\nTEXT:\n${project.ingestedText}`;

        const model = getModel(llm, "application/json");
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '');
        res.json(JSON.parse(text));
    } catch (error: any) {
        res.status(error.status || 500).json({ message: error.message || 'Failed to generate flashcards' });
    }
};


export const getTutorResponse = async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const { projectId, message, history, language, llm } = req.body;
    try {
        const project = await getProjectForUser(projectId, req.user.id);
        const context = `CONTEXT: ${project.ingestedText.substring(0, 500000)}\n\n`;

        const chatHistory: Content[] = (history || []).map((h: any) => ({
            role: h.role,
            parts: [{ text: h.content }]
        }));

        const prompt = `${context}Based on the context above and our conversation history, answer my latest question in ${language}.\n\nLATEST QUESTION:\n${message}`;
        const model = getModel(llm);
        const chat = model.startChat({ history: chatHistory });
        const result = await chat.sendMessage(prompt);
        res.json(result.response.text());
    } catch (error: any) {
        res.status(error.status || 500).json({ message: error.message || 'Tutor failed to respond' });
    }
};

export const generateConceptMap = async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const { projectId, llm } = req.body;
    try {
        const project = await getProjectForUser(projectId, req.user.id);
        const prompt = `Analyze the following text and generate a concept map. Identify the main concepts and their relationships. Return a JSON object with 'nodes' and 'links'. Each node should have an 'id' (the concept name) and a 'group' (a number for color-coding related concepts). Each link should have a 'source' (node id), a 'target' (node id), and a 'value' (representing the strength of the connection, from 1 to 10).\n\nTEXT:\n${project.ingestedText}`;

        const model = getModel(llm, "application/json");
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '');
        res.json(JSON.parse(text));
    } catch (error: any) {
        res.status(error.status || 500).json({ message: error.message || 'Failed to generate concept map' });
    }
};

export const generateLessonPlan = async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const { projectId, topic, llm } = req.body;
    try {
        const project = await getProjectForUser(projectId, req.user.id);
        const prompt = `Based on the following text content, create a detailed 50-minute lesson plan about "${topic}". The plan should be structured as a JSON object with keys: 'title', 'objective', 'duration' (string), 'materials' (array of strings), 'activities' (array of objects with 'name', 'duration', and 'description'), and 'assessment'.\n\nTEXT:\n${project.ingestedText}`;

        const model = getModel(llm, "application/json");
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '');
        res.json(JSON.parse(text));
    } catch (error: any) {
        res.status(error.status || 500).json({ message: error.message || 'Failed to generate lesson plan' });
    }
};

export const generateStudyPlan = async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const { projectId, days, llm } = req.body;
    try {
        const project = await getProjectForUser(projectId, req.user.id);
        const prompt = `Create a ${days}-day study plan based on the provided text. The output should be a JSON object with 'title', 'durationDays', and a 'schedule' array. Each item in the schedule should be an object with 'day' (number), 'topic' (string), and 'tasks' (array of strings).\n\nTEXT:\n${project.ingestedText}`;

        const model = getModel(llm, "application/json");
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '');
        res.json(JSON.parse(text));
    } catch (error: any) {
        res.status(error.status || 500).json({ message: error.message || 'Failed to generate study plan' });
    }
};

// @desc    Extract text/content from a file (PDF, Text, or Image)
// @route   POST /api/gemini/extract-text
// @access  Private
export const extractTextFromFile = async (req: Request, res: Response) => {
    const { llm, base64Data, fileType } = req.body;
    
    if (!base64Data) return res.status(400).json({ message: "No file data provided." });
    
    try {
        const model = getModel(llm);
        
        let promptText = "Extract all text from this file. Respond only with the extracted text.";
        
        // Specialized prompt for images to handle handwriting and diagrams
        if (fileType.startsWith('image/')) {
            promptText = "Analyze this image. If it contains text or handwritten notes, transcribe them accurately. If it contains diagrams or charts, describe them in detail so the information can be used for study.";
        }

        const parts: Part[] = [
            { inlineData: { mimeType: fileType, data: base64Data } },
            { text: promptText },
        ];
        
        const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
        res.json(result.response.text());
    } catch (error: any) {
        res.status(500).json({ message: `Failed to extract text: ${error.message}` });
    }
};

export const generateMCQs = async (req: Request, res: Response) => {
    const { llm, text, language, difficulty, numQuestions } = req.body;
    try {
        // Default to 5 if not provided, clamp between 1 and 20 for safety
        const count = Math.min(Math.max(numQuestions || 5, 1), 20);
        
        const prompt = `Based on the following text, generate a JSON array of ${count} ${difficulty} multiple-choice questions in ${language}. Each object in the array must have four properties: "question" (string), "options" (array of 4 strings), "correctAnswer" (string, which must be one of the options), and "explanation" (string).\n\nTEXT:\n${text}`;
        
        const model = getModel(llm, "application/json");
        const result = await model.generateContent(prompt);
        const textRes = result.response.text().replace(/```json/g, '').replace(/```/g, '');
        res.json(JSON.parse(textRes));
    } catch (error: any) {
        res.status(500).json({ message: `Failed to generate MCQs: ${error.message}` });
    }
};

export const generatePersonalizedStudyGuide = async (req: Request, res: Response) => {
    const { llm, text, incorrectMCQs, language } = req.body;
    try {
        const incorrectReview = incorrectMCQs.map((mcq: any) =>
            `Question: ${mcq.question}\nCorrect Answer: ${mcq.correctAnswer}\nExplanation: ${mcq.explanation}`
        ).join('\n\n');
        const prompt = `A student took a quiz based on the provided text and got the following questions wrong. Create a personalized study guide in ${language} that focuses on these incorrect topics. Explain the concepts clearly and relate them back to the main text.\n\NORIGINAL TEXT:\n${text}\n\NINCORRECT QUESTIONS:\n${incorrectReview}`;
        const model = getModel(llm);
        const result = await model.generateContent(prompt);
        res.json(result.response.text());
    } catch (error: any) {
        res.status(500).json({ message: `Failed to generate study guide: ${error.message}` });
    }
};

function cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export const fetchTopicInfo = async (req: Request, res: Response) => {
    const { llm, topic, language } = req.body;
    try {
        const prompt = `Generate comprehensive, well-structured study notes about "${topic}" in ${language}. The notes should be detailed enough for a university student to use for an exam. Use markdown for formatting.`;
        const model = getModel(llm);
        const result = await model.generateContent(prompt);
        res.json(result.response.text());
    } catch (error: any) {
        res.status(500).json({ message: `Failed to fetch topic info: ${error.message}` });
    }
};

export const transcribeAudio = async (req: Request, res: Response) => {
    const { llm } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ message: "No file uploaded" });

    const base64Data = file.buffer.toString('base64'); 
    const fileType = file.mimetype;

    try {
        const model = getModel(llm);
        const parts: Part[] = [
            { inlineData: { mimeType: fileType, data: base64Data } },
            { text: "Transcribe the audio from this file. Respond only with the full transcription." },
        ];
        const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
        res.json(result.response.text());
    }
    catch (error: any) {
        res.status(500).json({ message: `Failed to transcribe audio: ${error.message}` });
    }
};

export const generateSummaryFromText = async (req: Request, res: Response) => {
    const { llm, text, language } = req.body;
    try {
        const prompt = `Summarize the following text in ${language}. Provide a concise but comprehensive overview of the key points.\n\nTEXT:\n${text}`;
        const model = getModel(llm);
        const result = await model.generateContent(prompt);
        res.json(result.response.text());
    } catch (error: any) {
        res.status(500).json({ message: `Failed to generate summary: ${error.message}` });
    }
};

export const generateFlashcardsFromText = async (req: Request, res: Response) => {
    const { llm, text, language } = req.body;
    try {
        const prompt = `Based on the following text, generate a JSON array of 5-10 flashcards in ${language}. Each flashcard should be an object with a "question" (string) and "answer" (string) property.\n\nTEXT:\n${text}`;
        const model = getModel(llm, "application/json");
        const result = await model.generateContent(prompt);
        const textRes = result.response.text().replace(/```json/g, '').replace(/```/g, '');
        res.json(JSON.parse(textRes));
    } catch (error: any) {
        res.status(500).json({ message: `Failed to generate flashcards: ${error.message}` });
    }
};

export const generateAnswerFromText = async (req: Request, res: Response) => {
    const { llm, text, question, language } = req.body;
    try {
        const prompt = `Based on the context below, answer the user's question in ${language}.\n\nCONTEXT:\n${text}\n\nQUESTION:\n${question}`;
        const model = getModel(llm);
        const result = await model.generateContent(prompt);
        res.json(result.response.text());
    } catch (error: any) {
        res.status(500).json({ message: `Failed to generate answer: ${error.message}` });
    }
};

function chunkText(text: string, chunkSize: number = 1000): string[] {
    if (!text) return [];
    const chunks = [];
    let currentChunk = "";
    const sentences = text.split(/(?<=[.?!])\s+/);

    for (const sentence of sentences) {
        if ((currentChunk + sentence).length > chunkSize) {
            chunks.push(currentChunk);
            currentChunk = sentence;
        } else {
            currentChunk += (currentChunk ? " " : "") + sentence;
        }
    }
    if (currentChunk) chunks.push(currentChunk);
    return chunks;
}

export const performSemanticSearch = async (req: Request, res: Response) => {
    // 1. Accept 'global' and 'projectId' from body
    const { text, query, topK, global, projectId } = req.body;

    if (!query) {
        return res.status(400).json({ message: "Query is required." });
    }

    try {
        const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

        // 2. Embed the Query ONE time
        const queryResult = await embeddingModel.embedContent(query);
        const queryVector = queryResult.embedding.values;

        // Structure to hold all chunks to search against
        let candidates: { content: string; vector: number[]; projectId?: string; projectName?: string }[] = [];

        if (global) {
            // GLOBAL SEARCH: Fetch ALL projects for this user
            if (!req.user) return res.status(401).json({ message: "Unauthorized" });
            const projects = await StudyProject.find({ owner: req.user._id });

            // Collect all chunks from all projects
            for (const p of projects) {
                if (p.chunks && p.embeddings && p.chunks.length === p.embeddings.length) {
                    p.chunks.forEach((chunk, i) => {
                        candidates.push({
                            content: chunk,
                            vector: p.embeddings![i],
                            projectId: p._id.toString(),
                            projectName: p.name
                        });
                    });
                }
            }
        } else if (projectId) {
            // SPECIFIC PROJECT SEARCH (DB-Based): Efficient, uses stored embeddings
            const project = await StudyProject.findById(projectId);
            if (project && project.chunks && project.embeddings) {
                project.chunks.forEach((chunk, i) => {
                    candidates.push({ 
                        content: chunk, 
                        vector: project.embeddings![i],
                        projectId: project._id.toString(),
                        projectName: project.name
                    });
                });
            }
        } else if (text) {
             // LEGACY/FALLBACK: Embed on the fly (Slow, but keeps compatibility)
             const chunks = chunkText(text);
             // We have to embed these now because they aren't in DB
             for (const chunk of chunks) {
                // Throttle slightly
                await new Promise(resolve => setTimeout(resolve, 20));
                const chunkResult = await embeddingModel.embedContent(chunk);
                candidates.push({ content: chunk, vector: chunkResult.embedding.values });
             }
        }

        if (candidates.length === 0) {
            return res.json([]);
        }

        // 3. Perform Vector Search (Cosine Similarity)
        const scoredResults = candidates.map(item => ({
            ...item,
            score: cosineSimilarity(queryVector, item.vector)
        }));

        // 4. Sort and Return Top K
        scoredResults.sort((a, b) => b.score - a.score);
        
        // Return structured objects so frontend knows which project it came from
        const results = scoredResults.slice(0, topK || 5).map(item => ({
            text: item.content,
            score: item.score,
            projectName: item.projectName,
            projectId: item.projectId
        }));

        res.json(results);

    } catch (error: any) {
        console.error("Semantic Search Error:", error);
        res.status(500).json({ message: `Search failed: ${error.message}` });
    }
};


export const generateConceptMapFromText = async (req: Request, res: Response) => {
    const { llm, text, language } = req.body;
    try {
        const prompt = `Analyze the following text and generate a concept map. Identify the main concepts and their relationships. Return a JSON object with 'nodes' and 'links'. Each node should have an 'id' (the concept name) and a 'group' (a number for color-coding related concepts). Each link should have a 'source' (node id), a 'target' (node id), and a 'value' (representing the strength of the connection, from 1 to 10).\n\nTEXT:\n${text}`;

        const model = getModel(llm, "application/json");
        const result = await model.generateContent(prompt);
        const textRes = result.response.text().replace(/```json/g, '').replace(/```/g, '');
        res.json(JSON.parse(textRes));
    } catch (error: any) {
        res.status(500).json({ message: `Failed to generate concept map: ${error.message}` });
    }
};

export const generateLessonPlanFromText = async (req: Request, res: Response) => {
    const { llm, text, topic, language } = req.body;
    try {
        const prompt = `Based on the following text content, create a detailed 50-minute lesson plan about "${topic}". The plan should be structured as a JSON object with keys: 'title', 'objective', 'duration' (string), 'materials' (array of strings), 'activities' (array of objects with 'name', 'duration', and 'description'), and 'assessment'.\n\nTEXT:\n${text}`;

        const model = getModel(llm, "application/json");
        const result = await model.generateContent(prompt);
        const textRes = result.response.text().replace(/```json/g, '').replace(/```/g, '');
        res.json(JSON.parse(textRes));
    } catch (error: any) {
        res.status(500).json({ message: `Failed to generate lesson plan: ${error.message}` });
    }
};

export const generateStudyPlanFromText = async (req: Request, res: Response) => {
    const { llm, text, days, language } = req.body;
    try {
        const prompt = `Create a ${days}-day study plan based on the provided text. The output should be a JSON object with 'title', 'durationDays', and a 'schedule' array. Each item in the schedule should be an object with 'day' (number), 'topic' (string), and 'tasks' (array of strings).\n\nTEXT:\n${text}`;

        const model = getModel(llm, "application/json");
        const result = await model.generateContent(prompt);
        const textRes = result.response.text().replace(/```json/g, '').replace(/```/g, '');
        res.json(JSON.parse(textRes));
    } catch (error: any) {
        res.status(500).json({ message: `Failed to generate study plan: ${error.message}` });
    }
};

export const getTutorResponseFromText = async (req: Request, res: Response) => {
    const { llm, text, message, history, language } = req.body;
    try {
        const context = `CONTEXT: ${text.substring(0, 500000)}\n\n`;

        const chatHistory: Content[] = (history || []).map((h: any) => ({
            role: h.role,
            parts: [{ text: h.content }]
        }));

        const prompt = `${context}Based on the context above and our conversation history, answer my latest question in ${language}.\n\nLATEST QUESTION:\n${message}`;
        const model = getModel(llm);
        const chat = model.startChat({ history: chatHistory });
        const result = await chat.sendMessage(prompt);
        res.json(result.response.text());
    } catch (error: any) {
        res.status(500).json({ message: `Tutor failed to respond: ${error.message}` });
    }
};

export const generateEssayOutlineFromText = async (req: Request, res: Response) => {
    const { llm, text, topic, language } = req.body;
    try {
        const prompt = `Create a detailed essay outline about "${topic}" based on the following text. Return a JSON object with 'title', 'introduction', 'body' (array of objects with 'heading' and 'points'), and 'conclusion'.\n\nTEXT:\n${text}`;
        const model = getModel(llm, "application/json");
        const result = await model.generateContent(prompt);
        const textRes = result.response.text().replace(/```json/g, '').replace(/```/g, '');
        res.json(JSON.parse(textRes));
    } catch (error: any) {
        res.status(500).json({ message: `Failed to generate essay outline: ${error.message}` });
    }
};

export const generateEssayArgumentsFromText = async (req: Request, res: Response) => {
    const { llm, text, topic, language } = req.body;
    try {
        const prompt = `Based on the text provided, generate a list of strong arguments and potential counter-arguments for an essay on the topic: "${topic}". Format the output in clear Markdown.\n\nTEXT:\n${text}`;
        const model = getModel(llm);
        const result = await model.generateContent(prompt);
        res.json(result.response.text());
    } catch (error: any) {
        res.status(500).json({ message: `Failed to generate arguments: ${error.message}` });
    }
};

export const generateConceptMapForTopic = async (req: Request, res: Response) => {
    const { llm, topic, language } = req.body;
    try {
        const prompt = `Generate a concept map for the topic "${topic}". Return a JSON object with 'nodes' and 'links'. Nodes should have 'id' and 'group'. Links should have 'source', 'target', and 'value'.\n`;
        const model = getModel(llm, "application/json");
        const result = await model.generateContent(prompt);
        const textRes = result.response.text().replace(/```json/g, '').replace(/```/g, '');
        res.json(JSON.parse(textRes));
    } catch (error: any) {
        res.status(500).json({ message: `Failed to generate concept map from topic: ${error.message}` });
    }
};

export const transcribeYoutubeVideo = async (req: Request, res: Response) => {
    const { url, llm } = req.body;
    
    if (!url || (!url.includes('youtube.com') && !url.includes('youtu.be'))) {
        return res.status(400).json({ message: "Invalid YouTube URL." });
    }

    console.log(`[YouTube] Processing: ${url}`);

    try {
        // --- STRATEGY 1: DIRECT TRANSCRIPT FETCH (FAST & RELIABLE) ---
        // This bypasses the need to download audio and prevents 403 errors on most videos.
        try {
            console.log("[YouTube] Attempting to fetch existing transcript...");
            const transcriptItems = await YoutubeTranscript.fetchTranscript(url);
            
            if (transcriptItems && transcriptItems.length > 0) {
                // Combine all transcript parts into a single string
                const fullText = transcriptItems.map(item => item.text).join(' ');
                console.log("[YouTube] Transcript fetched successfully!");
                return res.json(fullText);
            }
        } catch (transcriptError) {
            console.warn("[YouTube] Direct transcript fetch failed (video might not have captions). Falling back to audio download.");
        }

        // --- STRATEGY 2: AUDIO DOWNLOAD + GEMINI (FALLBACK) ---
        // Only runs if Strategy 1 fails. 
        console.log("[YouTube] Downloading audio stream...");
        const { buffer, mimeType } = await downloadAudioBuffer(url);
        
        const base64Data = buffer.toString('base64');
        const model = getModel(llm || 'gemini-1.5-flash');
        
        const parts: Part[] = [
            { inlineData: { mimeType: mimeType, data: base64Data } },
            { text: "Transcribe the audio from this file. Respond only with the full transcription." },
        ];

        console.log("[YouTube] Sending audio to Gemini for transcription...");
        const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
        
        res.json(result.response.text());

    } 
    catch (error: any) {
        console.error("YouTube Transcription Critical Failure:", error.message);
        
        // Detailed error for common YouTube blocks
        if (error.message.includes('403') || error.message.includes('Sign in') || error.message.includes('bot')) {
             return res.status(503).json({ 
                message: "YouTube blocked the automated request (403 Forbidden). This video likely requires a login or your server IP is flagged. Please try a different video or use the 'Upload Audio' tab." 
            });
        }

        res.status(500).json({ message: `Failed to transcribe video: ${error.message}` });
    }
};


interface CodeAnalysisResult {
    algorithm: string;
    pseudocode: string;
    flowchart: string;
}

// @desc    Generate algorithm, pseudocode, and flowchart from code
// @route   POST /api/gemini/code-analysis/generate
// @access  Private
export const generateCodeAnalysis = async (req: Request, res: Response) => {
    const { llm, code, language } = req.body;

    if (!code || code.length < 10 || !/[{}();=]/.test(code)) {
        return res.status(400).json({
            message: "Input seems to be descriptive text, not code. Please provide a source code snippet."
        });
    }
    
    try {
        const prompt = `Analyze the following code and generate three artifacts: 1. A detailed Algorithm (step-by-step instructions). 2. Pseudocode (language-agnostic steps). 3. A text-based representation of a Flowchart (e.g., using Markdown or Mermaid syntax). Return a JSON object with three properties: "algorithm" (string), "pseudocode" (string), and "flowchart" (string). Ensure all outputs are in ${language}.\n\nCODE:\n${code}`;
        
        const model = getModel(llm, "application/json");
        const result = await model.generateContent(prompt);
        const textRes = result.response.text().replace(/```json/g, '').replace(/```/g, '');
        const jsonResult: CodeAnalysisResult = JSON.parse(textRes);
        
        res.json(jsonResult);
    } catch (error: any) {
        console.error("Code Analysis Generation Error:", error);
        res.status(500).json({ message: `Failed to generate code analysis: ${error.message}` });
    }
};

// @desc    Explain code/algorithm/pseudocode/flowchart
// @route   POST /api/gemini/code-analysis/explain
// @access  Private
export const explainCodeAnalysis = async (req: Request, res: Response) => {
    const { llm, artifact, language, explanationType } = req.body;
    try {
        const prompt = `Explain the following ${explanationType} in ${language} in a comprehensive and easy-to-understand manner. Focus on its purpose, how it works, and key concepts.\n\nCONTENT:\n${artifact}`;
        
        const model = getModel(llm);
        const result = await model.generateContent(prompt);
        
        res.json(result.response.text());
    } catch (error: any) {
        console.error("Code Analysis Explanation Error:", error);
        res.status(500).json({ message: `Failed to explain content: ${error.message}` });
    }
};

// @desc    Conduct Mock Interview
// @route   POST /api/gemini/mock-interview
// @access  Private
export const conductMockInterview = async (req: Request, res: Response) => {
    const { llm, topic, message, history, language, difficulty } = req.body;
    
    try {
        const systemInstruction = `You are a senior technical interviewer conducting a ${difficulty || 'Medium'} level interview on the topic: "${topic}". 
        
        Your Goal: Assess the candidate's knowledge, problem-solving skills, and depth of understanding.

        Guidelines:
        1.  **Persona**: Professional, encouraging but rigorous. Do not act as a tutor who gives answers immediately.
        2.  **Interaction**: Ask ONE question at a time. Wait for the candidate's response.
        3.  **Evaluation**: After the candidate responds, briefly acknowledge if they are correct or partially correct. If they are wrong or stuck, provide a small hint, NOT the full answer.
        4.  **Flow**: 
            - Start by introducing yourself and asking the first question related to ${topic}.
            - If the candidate answers correctly, ask a follow-up question or move to a slightly harder concept.
            - If the candidate struggles, guide them with the Socratic method.
        5.  **Termination**: If the user says "End Interview" or "Stop", provide a comprehensive feedback summary of their performance, highlighting strengths and areas for improvement.

        ${MATH_INSTRUCTION}

        Respond in ${language}.`;

        const chatHistory: Content[] = (history || []).map((h: any) => ({
            role: h.role,
            parts: [{ text: h.content }]
        }));

        const model = getModel(llm, undefined, systemInstruction);

        const chat = model.startChat({ history: chatHistory });
        const prompt = message || "Hello, I am ready for the interview.";
        
        const result = await chat.sendMessage(prompt);
        res.json(result.response.text());

    } catch (error: any) {
        console.error("Mock Interview Error Details:", JSON.stringify(error, null, 2));
        res.status(500).json({ message: `Mock Interview failed: ${error.message || 'Unknown error'}` });
    }
};

export const generatePodcastScript = async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const { projectId, llm, language } = req.body;

    try {
        const project = await getProjectForUser(projectId, req.user.id);
        
        const systemInstruction = `You are an expert podcast producer. Your goal is to convert educational text into an engaging, 2-person podcast script.
        - **Host (Alex)**: The expert. Explains concepts clearly, uses analogies, and drives the conversation.
        - **Guest (Jamie)**: The curious learner. Asks clarifying questions, reacts with surprise/interest, and summarizes points to ensure understanding.
        - **Format**: Return ONLY a valid JSON array of objects. Each object must have "speaker" (either "Host" or "Guest") and "text" (the spoken line).
        - **Tone**: Conversational, lively, and educational. avoid "robot" speak.
        - **Language**: ${language || 'English'}.
        `;

        const prompt = `Convert the following study material into a podcast script:\n\n${project.ingestedText}`;

        // Force JSON response
        const model = getModel(llm, "application/json", systemInstruction);
        const result = await model.generateContent(prompt);
        
        // Clean markdown code blocks if present
        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '');
        
        res.json(JSON.parse(text));
    } catch (error: any) {
        console.error("Podcast Generation Error:", error);
        res.status(500).json({ message: error.message || 'Failed to generate podcast script' });
    }
};

export const generateSlideContent = async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const { projectId, topic, llm, language } = req.body;

    try {
        const project = await getProjectForUser(projectId, req.user.id);
        
        // Detailed instruction for JSON output
        const systemInstruction = `You are an expert presentation designer. Convert educational content into a structured slide deck.
        Return ONLY a valid raw JSON array. Do not use markdown formatting (no \`\`\`json blocks).
        
        Structure: Array<{ title: string, bullets: string[], speakerNotes: string }>
        
        Requirements:
        - Create 5-8 slides.
        - 'title': concise slide header.
        - 'bullets': 3-5 key points per slide (short sentences).
        - 'speakerNotes': A script for the presenter to say (2-3 sentences).
        - Language: ${language || 'English'}.
        ${MATH_INSTRUCTION}`;

        const prompt = `Create a slide deck based on this lesson plan topic: "${topic}".
        
        SOURCE CONTENT:
        ${project.ingestedText.substring(0, 15000)}`; 

        const model = getModel(llm, "application/json", systemInstruction);
        const result = await model.generateContent(prompt);
        
        let text = result.response.text();
        // Clean up markdown if Gemini adds it despite instructions
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        res.json(JSON.parse(text));

    } catch (error: any) {
        console.error("Slide Gen Error:", error);
        res.status(500).json({ message: error.message || 'Failed to generate slides' });
    }
};


// @desc    Scrape text content from a URL
// @route   POST /api/gemini/scrape-url
// @access  Private
export const scrapeWebPage = async (req: Request, res: Response) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ message: "URL is required" });
    }

    try {
        // Fetch HTML
        const { data } = await axios.get(url, {
            headers: {
                // Fake User-Agent to avoid immediate blocking by some sites
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const $ = cheerio.load(data);

        // Remove junk elements
        $('script, style, noscript, iframe, img, svg, nav, footer, header, aside, .ads, .sidebar').remove();

        // Try to find the main content container using common selectors
        let content = '';
        const selectors = ['article', 'main', '.post-content', '.entry-content', '#content', '.content', '.article-body'];
        
        for (const selector of selectors) {
            const element = $(selector);
            if (element.length > 0) {
                content = element.text();
                break;
            }
        }

        // Fallback to body if no specific content container found
        if (!content) {
            content = $('body').text();
        }

        // Clean up whitespace (newlines, tabs, multiple spaces)
        content = content.replace(/\s+/g, ' ').trim();

        if (!content || content.length < 50) {
             return res.status(400).json({ message: "Content too short or could not be extracted." });
        }

        const title = $('title').text().trim() || 'Scraped Article';

        res.json({ title, content });

    } catch (error: any) {
        console.error("Scraping Error:", error.message);
        res.status(500).json({ message: `Failed to scrape URL: ${error.message}` });
    }
};


// @desc    Transform text based on instruction (Notion-style AI edit)
// @route   POST /api/gemini/transform
// @access  Private
export const transformText = async (req: Request, res: Response) => {
    const { llm, text, selection, instruction, language } = req.body;

    try {
        const model = getModel(llm);
        
        let prompt = `Act as an expert editor and study assistant.
        
        CONTEXT (Full Text):
        "${text.substring(0, 3000)}..."
        
        TARGET TEXT (Selection to modify, or cursor context):
        "${selection || 'Current cursor position (continue writing)'}"
        
        INSTRUCTION:
        ${instruction}
        
        OUTPUT REQUIREMENT:
        Return ONLY the new/modified text. Do not include conversational filler like "Here is the text". 
        If the instruction is to "continue", simply generate the next logical sentences.
        Respond in ${language || 'English'}.
        `;

        const result = await model.generateContent(prompt);
        res.json(result.response.text());

    } catch (error: any) {
        console.error("Transform Text Error:", error);
        res.status(500).json({ message: `Transformation failed: ${error.message}` });
    }
};

interface CodeTranslationResult {
    translatedCode: string;
    explanation: string;
}

// @desc    Translate code from one language to another
// @route   POST /api/gemini/code-analysis/translate
// @access  Private
export const translateCode = async (req: Request, res: Response) => {
    const { llm, code, targetLanguage } = req.body;

    if (!code || !targetLanguage) {
        return res.status(400).json({
            message: "Code and Target Language are required."
        });
    }

    try {
        const prompt = `Act as an expert software engineer. Translate the following code to ${targetLanguage}. 
        
        Requirements:
        1. Maintain the logic and functionality of the original code.
        2. Use idiomatic syntax for ${targetLanguage}.
        3. Explain 3 key syntax or structural differences between the original code and the translated version.

        Output Format:
        Return ONLY a JSON object with two properties:
        - "translatedCode" (string): The full converted code.
        - "explanation" (string): A concise explanation of the differences (Markdown supported).
        
        CODE TO TRANSLATE:
        ${code}`;

        const model = getModel(llm, "application/json");
        const result = await model.generateContent(prompt);
        
        // Clean markdown formatting if present
        const textRes = result.response.text().replace(/```json/g, '').replace(/```/g, '');
        const jsonResult: CodeTranslationResult = JSON.parse(textRes);

        res.json(jsonResult);
    } catch (error: any) {
        console.error("Code Translation Error:", error);
        res.status(500).json({ message: `Failed to translate code: ${error.message}` });
    }
};