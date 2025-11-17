import { Request, Response } from 'express';
import StudyProject from '../models/StudyProject';
import { GoogleGenAI, Type, InlineDataPart, GenerationConfig, HarmCategory, HarmBlockThreshold } from "@google/genai";


if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const model = 'gemini-2.5-flash';

const safetySettings: SafetySetting[] = [
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

// Helper to get project and check ownership
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

// FIX: Use Request and Response from express to get correct type inference.
export const generateSummary = async (req: Request, res: Response) => {
    const { projectId, language } = req.body;
    try {
        const project = await getProjectForUser(projectId, req.user.id);
        const prompt = `Summarize the following text in ${language}. Provide a concise but comprehensive overview of the key points.\n\nTEXT:\n${project.ingestedText}`;
        
        const response = await ai.models.generateContent({
            model,
            contents: [{ parts: [{ text: prompt }] }],
        });

        res.json(response.text);
    } catch (error: any) {
        res.status(error.status || 500).json({ message: error.message || 'Failed to generate summary' });
    }
};

// FIX: Use Request and Response from express to get correct type inference.
export const generateFlashcards = async (req: Request, res: Response) => {
    const { projectId, language } = req.body;
    try {
        const project = await getProjectForUser(projectId, req.user.id);
        const prompt = `Based on the following text, generate a list of 5-10 key-value pairs for flashcards in ${language}. The key should be a question and the value should be the answer.\n\nTEXT:\n${project.ingestedText}`;

        const response = await ai.models.generateContent({
            model,
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            question: { type: Type.STRING },
                            answer: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        
        res.json(JSON.parse(response.text));

    } catch (error: any) {
         res.status(error.status || 500).json({ message: error.message || 'Failed to generate flashcards' });
    }
};

// FIX: Use Request and Response from express to get correct type inference.
export const getTutorResponse = async (req: Request, res: Response) => {
    const { projectId, message, history, language } = req.body;
     try {
        const project = await getProjectForUser(projectId, req.user.id);
        const context = `CONTEXT: ${project.ingestedText.substring(0, 20000)}\n\n`;
        const chatHistory = history.map((h: any) => `${h.role}: ${h.content}`).join('\n');

        const prompt = `${context}Based on the context above and our conversation history, answer my latest question in ${language}.\n\nCONVERSATION HISTORY:\n${chatHistory}\n\nLATEST QUESTION:\n${message}`;

        const response = await ai.models.generateContent({
            model,
            contents: [{ parts: [{ text: prompt }] }],
        });
        
        res.json(response.text);

    } catch (error: any) {
         res.status(error.status || 500).json({ message: error.message || 'Tutor failed to respond' });
    }
};

// FIX: Use Request and Response from express to get correct type inference.
export const generateConceptMap = async (req: Request, res: Response) => {
    const { projectId } = req.body;
    try {
        const project = await getProjectForUser(projectId, req.user.id);
        const prompt = `Analyze the following text and generate a concept map. Identify the main concepts and their relationships. Return a JSON object with 'nodes' and 'links'. Each node should have an 'id' (the concept name) and a 'group' (a number for color-coding related concepts). Each link should have a 'source' (node id), a 'target' (node id), and a 'value' (representing the strength of the connection, from 1 to 10).\n\nTEXT:\n${project.ingestedText}`;

        const response = await ai.models.generateContent({
            model,
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        nodes: { 
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.STRING },
                                    group: { type: Type.INTEGER }
                                }
                            }
                        },
                        links: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    source: { type: Type.STRING },
                                    target: { type: Type.STRING },
                                    value: { type: Type.INTEGER }
                                }
                            }
                        }
                    }
                }
            }
        });
        
        res.json(JSON.parse(response.text));
    } catch (error: any) {
        res.status(error.status || 500).json({ message: error.message || 'Failed to generate concept map' });
    }
};

// FIX: Use Request and Response from express to get correct type inference.
export const generateLessonPlan = async (req: Request, res: Response) => {
    const { projectId, topic } = req.body;
    try {
        const project = await getProjectForUser(projectId, req.user.id);
        const prompt = `Based on the following text content, create a detailed 50-minute lesson plan about "${topic}". The plan should be structured as a JSON object with keys: 'title', 'objective', 'duration' (string), 'materials' (array of strings), 'activities' (array of objects with 'name', 'duration', and 'description'), and 'assessment'.\n\nTEXT:\n${project.ingestedText}`;

        const response = await ai.models.generateContent({
            model,
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        objective: { type: Type.STRING },
                        duration: { type: Type.STRING },
                        materials: { type: Type.ARRAY, items: { type: Type.STRING } },
                        activities: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    duration: { type: Type.STRING },
                                    description: { type: Type.STRING }
                                }
                            }
                        },
                        assessment: { type: Type.STRING }
                    }
                }
            }
        });
        
        res.json(JSON.parse(response.text));
    } catch (error: any) {
        res.status(error.status || 500).json({ message: error.message || 'Failed to generate lesson plan' });
    }
};


// FIX: Use Request and Response from express to get correct type inference.
export const generateStudyPlan = async (req: Request, res: Response) => {
    const { projectId, days } = req.body;
    try {
        const project = await getProjectForUser(projectId, req.user.id);
        const prompt = `Create a ${days}-day study plan based on the provided text. The output should be a JSON object with 'title', 'durationDays', and a 'schedule' array. Each item in the schedule should be an object with 'day' (number), 'topic' (string), and 'tasks' (array of strings).\n\nTEXT:\n${project.ingestedText}`;
        
        const response = await ai.models.generateContent({
            model,
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        durationDays: { type: Type.INTEGER },
                        schedule: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    day: { type: Type.INTEGER },
                                    topic: { type: Type.STRING },
                                    tasks: { type: Type.ARRAY, items: { type: Type.STRING } }
                                }
                            }
                        }
                    }
                }
            }
        });
        
        res.json(JSON.parse(response.text));
    } catch (error: any) {
        res.status(error.status || 500).json({ message: error.message || 'Failed to generate study plan' });
    }
};

export const extractTextFromFile = async (req: Request, res: Response) => {
    const { llm, base64Data, fileType } = req.body;
    try {
        const genAIModel = ai.models.getGenerativeModel({ model: llm || model, safetySettings });
        const parts: (string | InlineDataPart)[] = [
          { inlineData: { mimeType: fileType, data: base64Data } },
          { text: "Extract all text from this file. Respond only with the extracted text." },
        ];
        
        const result = await genAIModel.generateContent({ contents: [{ parts }] });
        res.json(result.response.text());

    } catch (error: any) {
        console.error("Gemini File Extraction Error:", error);
        res.status(500).json({ message: `Failed to extract text: ${error.message}` });
    }
};

export const generateMCQs = async (req: Request, res: Response) => {
    // We get the data from the request body now
    const { llm, text, language, difficulty } = req.body;

    try {
        const prompt = `Based on the following text, generate a JSON array of 5 ${difficulty} multiple-choice questions in ${language}. Each object in the array must have four properties: "question" (string), "options" (array of 4 strings), "correctAnswer" (string, which must be one of the options), and "explanation" (string).\n\nTEXT:\n${text}`;

        const genAIModel = ai.models.getGenerativeModel({
            model: llm || model,
            safetySettings,
            generationConfig: {
                ...generationConfig,
                responseMimeType: "application/json",
            },
        });

        // Note: The schema-based generation you had in the backend is great,
        // but for a 1:1 move, we'll use the prompt-based JSON method from geminiService.ts
        // You can upgrade this later if you wish.
        const result = await genAIModel.generateContent(prompt);
        const resultText = result.response.text();

        // Try to parse the JSON, handling markdown code fences
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

        const prompt = `A student took a quiz based on the provided text and got the following questions wrong. Create a personalized study guide in ${language} that focuses on these incorrect topics. Explain the concepts clearly and relate them back to the main text.\n\nORIGINAL TEXT:\n${text}\n\nINCORRECT QUESTIONS:\n${incorrectReview}`;

        const genAIModel = ai.models.getGenerativeModel({ model: llm || model, safetySettings, generationConfig });
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

// Simple chunking strategy
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

// FOR Ingest.tsx
export const fetchTopicInfo = async (req: Request, res: Response) => {
    const { llm, topic, language } = req.body;
    try {
        const prompt = `Generate comprehensive, well-structured study notes about "${topic}" in ${language}. The notes should be detailed enough for a university student to use for an exam. Use markdown for formatting.`;
        const genAIModel = ai.models.getGenerativeModel({ model: llm || model, safetySettings, generationConfig });
        const result = await genAIModel.generateContent(prompt);
        res.json(result.response.text());
    } catch (error: any) {
        res.status(500).json({ message: `Failed to fetch topic info: ${error.message}` });
    }
};

// FOR VoiceQA.tsx
export const transcribeAudio = async (req: Request, res: Response) => {
    const { llm, base64Data, fileType } = req.body;
    try {
        const genAIModel = ai.models.getGenerativeModel({ model: llm || model, safetySettings });
        const parts: (string | InlineDataPart)[] = [
          { inlineData: { mimeType: fileType, data: base64Data } },
          { text: "Transcribe the audio from this file. Respond only with the full transcription." },
        ];
        const result = await genAIModel.generateContent({ contents: [{ parts }] });
        res.json(result.response.text());
    } catch (error: any) {
        res.status(500).json({ message: `Failed to transcribe audio: ${error.message}` });
    }
};

// FOR VoiceQA.tsx
export const generateSummaryFromText = async (req: Request, res: Response) => {
    const { llm, text, language } = req.body;
    try {
        const prompt = `Summarize the following text in ${language}. Provide a concise but comprehensive overview of the key points.\n\nTEXT:\n${text}`;
        const genAIModel = ai.models.getGenerativeModel({ model: llm || model, safetySettings, generationConfig });
        const result = await genAIModel.generateContent(prompt);
        res.json(result.response.text());
    } catch (error: any) {
        res.status(500).json({ message: `Failed to generate summary: ${error.message}` });
    }
};

// FOR VoiceQA.tsx
export const generateFlashcardsFromText = async (req: Request, res: Response) => {
    const { llm, text, language } = req.body;
    try {
        const prompt = `Based on the following text, generate a JSON array of 5-10 flashcards in ${language}. Each flashcard should be an object with a "question" (string) and "answer" (string) property.\n\nTEXT:\n${text}`;
        const genAIModel = ai.models.getGenerativeModel({
            model: llm || model,
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

// FOR VoiceQA.tsx
export const generateAnswerFromText = async (req: Request, res: Response) => {
    const { llm, text, question, language } = req.body;
    try {
        const prompt = `Based on the context below, answer the user's question in ${language}.\n\nCONTEXT:\n${text}\n\nQUESTION:\n${question}`;
        const genAIModel = ai.models.getGenerativeModel({ model: llm || model, safetySettings, generationConfig });
        const result = await genAIModel.generateContent(prompt);
        res.json(result.response.text());
    } catch (error: any) {
        res.status(500).json({ message: `Failed to generate answer: ${error.message}` });
    }
};

// FOR SemanticSearch.tsx
export const performSemanticSearch = async (req: Request, res: Response) => {
    const { text, query, topK } = req.body;
    try {
        const embeddingModel = ai.models.getEmbeddingModel({ model: "text-embedding-004" });
        const chunks = chunkText(text);
        if (chunks.length === 0) return res.json([]);

        const textEmbeddings = await embeddingModel.embedContents(chunks.map(chunk => ({
          content: chunk,
          role: "user"
        })));

        const queryEmbedding = await embeddingModel.embedContent(query);

        const similarities = textEmbeddings.embeddings.map((emb, i) => ({
          index: i,
          score: cosineSimilarity(emb.values, queryEmbedding.embedding.values)
        }));

        similarities.sort((a, b) => b.score - a.score);
        const topResults = similarities.slice(0, topK).map(sim => chunks[sim.index]);
        res.json(topResults);

    } catch (error: any) {
        res.status(500).json({ message: `Failed to perform semantic search: ${error.message}` });
    }
};