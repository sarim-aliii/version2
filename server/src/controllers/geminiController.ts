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

// Helper to get model dynamic instance
const getModel = (llm: string, responseMimeType?: string) => {
    let modelName = llm;

    if (!modelName || modelName.includes('flash')) {
        modelName = 'gemini-flash-latest';
    }
    else if (modelName.includes('pro')) {
        modelName = 'gemini-pro-latest';
    }
    else {
        modelName = defaultModelName;
    }

    return genAI.getGenerativeModel({
        model: modelName,
        safetySettings,
        generationConfig: responseMimeType ? { ...generationConfig, responseMimeType } : generationConfig
    });
}

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

// ... (Include the rest of your existing export functions exactly as they were, they are fine)
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

export const extractTextFromFile = async (req: Request, res: Response) => {
    const { llm, base64Data, fileType } = req.body;
    if (!base64Data) return res.status(400).json({ message: "No file data provided." });
    try {
        const model = getModel(llm);
        const parts: Part[] = [
            { inlineData: { mimeType: fileType, data: base64Data } },
            { text: "Extract all text from this file. Respond only with the extracted text." },
        ];
        const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
        res.json(result.response.text());
    } catch (error: any) {
        res.status(500).json({ message: `Failed to extract text: ${error.message}` });
    }
};

export const generateMCQs = async (req: Request, res: Response) => {
    const { llm, text, language, difficulty } = req.body;
    try {
        const prompt = `Based on the following text, generate a JSON array of 5 ${difficulty} multiple-choice questions in ${language}. Each object in the array must have four properties: "question" (string), "options" (array of 4 strings), "correctAnswer" (string, which must be one of the options), and "explanation" (string).\n\nTEXT:\n${text}`;
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

// Semantic Search Helper functions
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
    const { text, query, topK } = req.body;

    if (!text || !query) {
        return res.status(400).json({ message: "Text and query are required." });
    }

    try {
        const chunks = chunkText(text);

        if (chunks.length === 0) {
            return res.json([]);
        }

        const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

        const queryResult = await embeddingModel.embedContent(query);
        const queryVector = queryResult.embedding.values;

        const chunksToProcess = chunks.slice(0, 50);
        const scoredChunks = [];

        for (const chunk of chunksToProcess) {
            await new Promise(resolve => setTimeout(resolve, 100));

            try {
                const chunkResult = await embeddingModel.embedContent(chunk);
                const chunkVector = chunkResult.embedding.values;
                const score = cosineSimilarity(queryVector, chunkVector);
                scoredChunks.push({ chunk, score });
            }
            catch (err) {
                console.warn("Failed to embed chunk:", err);
            }
        }

        scoredChunks.sort((a, b) => b.score - a.score);
        const topResults = scoredChunks.slice(0, topK || 4).map(item => item.chunk);

        res.json(topResults);

    }
    catch (error: any) {
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
    const { url } = req.body;
    
    if (!url || !url.includes('youtube.com') && !url.includes('youtu.be')) {
        return res.status(400).json({ message: "Invalid YouTube URL." });
    }

    try {
        // Fetch transcript
        const transcriptItems = await YoutubeTranscript.fetchTranscript(url);
        
        if (!transcriptItems || transcriptItems.length === 0) {
            return res.status(404).json({ message: "No captions found for this video." });
        }

        // Combine all lines into one string
        const fullText = transcriptItems.map(item => item.text).join(' ');
        
        res.json(fullText);
    } catch (error: any) {
        console.error("YouTube Transcript Error:", error);
        res.status(500).json({ message: "Failed to fetch transcript. The video might not have captions enabled." });
    }
};