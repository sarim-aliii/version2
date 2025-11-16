import { GoogleGenAI, Type } from "@google/genai";
import { Request, Response } from 'express';
import StudyProject from '../models/StudyProject';

if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const model = 'gemini-2.5-flash';

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