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



if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const modelName = 'gemini-1.5-flash';

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

export const generateSummary = async (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, no user' });
    }
    const { projectId, language } = req.body;
    try {
        const project = await getProjectForUser(projectId, req.user.id);
        const prompt = `Summarize the following text in ${language}. Provide a concise but comprehensive overview of the key points.\n\nTEXT:\n${project.ingestedText}`;
        
        // CHANGED: Use genAI instance
        const model = genAI.getGenerativeModel({ model: modelName, safetySettings, generationConfig });
        const result = await model.generateContent(prompt);
        const response = result.response;
        
        res.json(response.text());
    } catch (error: any) {
        res.status(error.status || 500).json({ message: error.message || 'Failed to generate summary' });
    }
};

export const generateFlashcards = async (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, no user' });
    }
    const { projectId, language } = req.body;
    try {
        const project = await getProjectForUser(projectId, req.user.id);
        const prompt = `Based on the following text, generate a JSON array of 5-10 flashcards in ${language}. Each flashcard should be an object with a "question" (string) and "answer" (string) property.\n\nTEXT:\n${project.ingestedText}`;

        const model = genAI.getGenerativeModel({ 
            model: modelName, 
            safetySettings,
            generationConfig: { ...generationConfig, responseMimeType: "application/json" }
        });

        const result = await model.generateContent(prompt);
        const response = result.response;
        
        const text = response.text().replace(/```json/g, '').replace(/```/g, '');
        res.json(JSON.parse(text));

    } catch (error: any) {
         res.status(error.status || 500).json({ message: error.message || 'Failed to generate flashcards' });
    }
};

export const getTutorResponse = async (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, no user' });
    }
    const { projectId, message, history, language } = req.body;
     try {
        const project = await getProjectForUser(projectId, req.user.id);
        const context = `CONTEXT: ${project.ingestedText.substring(0, 20000)}\n\n`;
        
        const chatHistory: Content[] = (history || []).map((h: any) => ({
            role: h.role,
            parts: [{ text: h.content }]
        }));

        const prompt = `${context}Based on the context above and our conversation history, answer my latest question in ${language}.\n\nLATEST QUESTION:\n${message}`;

        const model = genAI.getGenerativeModel({ model: modelName, safetySettings, generationConfig });
        
        const chat = model.startChat({ history: chatHistory });
        const result = await chat.sendMessage(prompt);
        const response = result.response;
        
        res.json(response.text());

    } catch (error: any) {
         res.status(error.status || 500).json({ message: error.message || 'Tutor failed to respond' });
    }
};

export const generateConceptMap = async (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, no user' });
    }
    const { projectId } = req.body;
    try {
        const project = await getProjectForUser(projectId, req.user.id);
        const prompt = `Analyze the following text and generate a concept map. Identify the main concepts and their relationships. Return a JSON object with 'nodes' and 'links'. Each node should have an 'id' (the concept name) and a 'group' (a number for color-coding related concepts). Each link should have a 'source' (node id), a 'target' (node id), and a 'value' (representing the strength of the connection, from 1 to 10).\n\nTEXT:\n${project.ingestedText}`;

        const model = genAI.getGenerativeModel({ 
            model: modelName, 
            safetySettings,
            generationConfig: { ...generationConfig, responseMimeType: "application/json" }
        });
        const result = await model.generateContent(prompt);
        const response = result.response;
        
        const text = response.text().replace(/```json/g, '').replace(/```/g, '');
        res.json(JSON.parse(text));
    } catch (error: any) {
        res.status(error.status || 500).json({ message: error.message || 'Failed to generate concept map' });
    }
};

export const generateLessonPlan = async (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, no user' });
    }
    const { projectId, topic } = req.body;
    try {
        const project = await getProjectForUser(projectId, req.user.id);
        const prompt = `Based on the following text content, create a detailed 50-minute lesson plan about "${topic}". The plan should be structured as a JSON object with keys: 'title', 'objective', 'duration' (string), 'materials' (array of strings), 'activities' (array of objects with 'name', 'duration', and 'description'), and 'assessment'.\n\nTEXT:\n${project.ingestedText}`;

        const model = genAI.getGenerativeModel({ 
            model: modelName, 
            safetySettings,
            generationConfig: { ...generationConfig, responseMimeType: "application/json" }
        });
        const result = await model.generateContent(prompt);
        const response = result.response;
        
        const text = response.text().replace(/```json/g, '').replace(/```/g, '');
        res.json(JSON.parse(text));
    } catch (error: any) {
        res.status(error.status || 500).json({ message: error.message || 'Failed to generate lesson plan' });
    }
};

export const generateStudyPlan = async (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, no user' });
    }
    const { projectId, days } = req.body;
    try {
        const project = await getProjectForUser(projectId, req.user.id);
        const prompt = `Create a ${days}-day study plan based on the provided text. The output should be a JSON object with 'title', 'durationDays', and a 'schedule' array. Each item in the schedule should be an object with 'day' (number), 'topic' (string), and 'tasks' (array of strings).\n\nTEXT:\n${project.ingestedText}`;
        
        const model = genAI.getGenerativeModel({ 
            model: modelName, 
            safetySettings,
            generationConfig: { ...generationConfig, responseMimeType: "application/json" }
        });
        const result = await model.generateContent(prompt);
        const response = result.response;
        
        const text = response.text().replace(/```json/g, '').replace(/```/g, '');
        res.json(JSON.parse(text));
    } catch (error: any) {
        res.status(error.status || 500).json({ message: error.message || 'Failed to generate study plan' });
    }
};

export const extractTextFromFile = async (req: Request, res: Response) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const { llm, base64Data, fileType } = req.body;
    
    try {
        const genAIModel = genAI.getGenerativeModel({ model: llm || modelName, safetySettings });
        
        const parts: Part[] = [
          { inlineData: { mimeType: fileType, data: base64Data } },
          { text: "Extract all text from this file. Respond only with the extracted text." },
        ];
        
        const result = await genAIModel.generateContent({ contents: [{ role: 'user', parts }] });
        res.json(result.response.text());

    } catch (error: any) {
        console.error("Gemini File Extraction Error:", error);
        res.status(500).json({ message: `Failed to extract text: ${error.message}` });
    }
};

export const generateMCQs = async (req: Request, res: Response) => {
    const { llm, text, language, difficulty } = req.body;

    try {
        const prompt = `Based on the following text, generate a JSON array of 5 ${difficulty} multiple-choice questions in ${language}. Each object in the array must have four properties: "question" (string), "options" (array of 4 strings), "correctAnswer" (string, which must be one of the options), and "explanation" (string).\n\nTEXT:\n${text}`;

        const genAIModel = genAI.getGenerativeModel({
            model: llm || modelName,
            safetySettings,
            generationConfig: {
                ...generationConfig,
                responseMimeType: "application/json",
            },
        });

        const result = await genAIModel.generateContent(prompt);
        const resultText = result.response.text();

        try {
            const jsonMatch = resultText.match(/```json([\s\S]*)```/);
            const parsableText = jsonMatch ? jsonMatch[1] : resultText;
            res.json(JSON.parse(parsableText));
        } catch (e) {
            console.error("Failed to parse MCQs JSON:", e, "Raw text:", resultText);
            throw new Error("AI returned invalid MCQ format.");
        }

    } catch (error: any) {
        console.error("Gemini MCQ Error:", error);
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

        const genAIModel = genAI.getGenerativeModel({ model: llm || modelName, safetySettings, generationConfig });
        const result = await genAIModel.generateContent(prompt);
        res.json(result.response.text());

    } catch (error: any) {
        console.error("Gemini Study Guide Error:", error);
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

function chunkText(text: string, chunkSize: number = 500, overlap: number = 100): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let i = 0;
  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    chunks.push(chunk);
    i += chunkSize - overlap;
  }
  return chunks;
}

export const fetchTopicInfo = async (req: Request, res: Response) => {
    const { llm, topic, language } = req.body;
    try {
        const prompt = `Generate comprehensive, well-structured study notes about "${topic}" in ${language}. The notes should be detailed enough for a university student to use for an exam. Use markdown for formatting.`;
        const genAIModel = genAI.getGenerativeModel({ model: llm || modelName, safetySettings, generationConfig });
        const result = await genAIModel.generateContent(prompt);
        res.json(result.response.text());
    } catch (error: any) {
        res.status(500).json({ message: `Failed to fetch topic info: ${error.message}` });
    }
};

export const transcribeAudio = async (req: Request, res: Response) => {
    const { llm, base64Data, fileType } = req.body;
    try {
        const genAIModel = genAI.getGenerativeModel({ model: llm || modelName, safetySettings });
        const parts: Part[] = [
          { inlineData: { mimeType: fileType, data: base64Data } },
          { text: "Transcribe the audio from this file. Respond only with the full transcription." },
        ];
        const result = await genAIModel.generateContent({ contents: [{ role: 'user', parts }] });
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
        const genAIModel = genAI.getGenerativeModel({ model: llm || modelName, safetySettings, generationConfig });
        const result = await genAIModel.generateContent(prompt);
        res.json(result.response.text());
    } catch (error: any) {
        res.status(500).json({ message: `Failed to generate summary: ${error.message}` });
    }
};

export const generateFlashcardsFromText = async (req: Request, res: Response) => {
    const { llm, text, language } = req.body;
    try {
        const prompt = `Based on the following text, generate a JSON array of 5-10 flashcards in ${language}. Each flashcard should be an object with a "question" (string) and "answer" (string) property.\n\nTEXT:\n${text}`;
        const genAIModel = genAI.getGenerativeModel({
            model: llm || modelName,
            safetySettings,
            generationConfig: { ...generationConfig, responseMimeType: "application/json" },
        });
        const result = await genAIModel.generateContent(prompt);
        const resultText = result.response.text();
        try {
            const jsonMatch = resultText.match(/```json([\s\S]*)```/);
            const parsableText = jsonMatch ? jsonMatch[1] : resultText;
            res.json(JSON.parse(parsableText));
        } catch (e) {
            console.error("Failed to parse flashcards JSON:", e, "Raw text:", resultText);
            throw new Error("AI returned invalid flashcard format.");
        }
    } catch (error: any) {
        res.status(500).json({ message: `Failed to generate flashcards: ${error.message}` });
    }
};

export const generateAnswerFromText = async (req: Request, res: Response) => {
    const { llm, text, question, language } = req.body;
    try {
        const prompt = `Based on the context below, answer the user's question in ${language}.\n\nCONTEXT:\n${text}\n\nQUESTION:\n${question}`;
        const genAIModel = genAI.getGenerativeModel({ model: llm || modelName, safetySettings, generationConfig });
        const result = await genAIModel.generateContent(prompt);
        res.json(result.response.text());
    } catch (error: any) {
        res.status(500).json({ message: `Failed to generate answer: ${error.message}` });
    }
};

export const performSemanticSearch = async (req: Request, res: Response) => {
    // We now expect projectId, not raw text
    const { projectId, query, topK } = req.body; 
    try {
        const project = await StudyProject.findById(projectId);
        if (!project || !project.embeddings || project.embeddings.length === 0) {
            return res.status(400).json({ message: "Project index not ready." });
        }

        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const queryResult = await model.embedContent(query);
        const queryVector = queryResult.embedding.values;

        const similarities = project.embeddings.map((emb, i) => ({
            index: i,
            score: cosineSimilarity(emb, queryVector)
        }));

        similarities.sort((a, b) => b.score - a.score);
        const topResults = similarities.slice(0, topK).map(s => project.chunks[s.index]);

        res.json(topResults);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const processAndEmbedText = async (text: string) => {
    const chunks = chunkText(text);
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

    const embeddings = [];
    for (const chunk of chunks) {
        const result = await model.embedContent(chunk);
        embeddings.push(result.embedding.values);
    }
    return { chunks, embeddings };
};