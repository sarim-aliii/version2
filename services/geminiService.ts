import * as google from "@google/genai";
import { Flashcard, MCQ as MCQType } from '../types';

const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  GenerationConfig,
  SafetySetting,
  GenerateContentRequest,
  InlineDataPart,
} = google;

// --- Initialization ---

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("Missing GEMINI_API_KEY environment variable.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

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

// Helper function to handle errors
async function safeGenerateContent(modelName: string, prompt: string, isJson: boolean = false): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: modelName,
      safetySettings,
      generationConfig: {
        ...generationConfig,
        responseMimeType: isJson ? "application/json" : "text/plain",
      },
    });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(`Failed to generate content: ${error.message}`);
  }
}

// --- Functions for Ingest.tsx ---

export const fetchTopicInfo = async (llm: string, topic: string, language: string): Promise<string> => {
  const prompt = `Generate comprehensive, well-structured study notes about "${topic}" in ${language}. The notes should be detailed enough for a university student to use for an exam. Use markdown for formatting.`;
  return safeGenerateContent(llm, prompt);
};

export const extractTextFromFile = async (llm: string, base64Data: string, fileType: string): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: llm, safetySettings });
    const parts: (string | InlineDataPart)[] = [
      { inlineData: { mimeType: fileType, data: base64Data } },
      { text: "Extract all text from this file. Respond only with the extracted text." },
    ];
    const result = await model.generateContent({ contents: [{ parts }] });
    return result.response.text();
  } catch (error: any) {
    console.error("Gemini File Extraction Error:", error);
    throw new Error(`Failed to extract text: ${error.message}`);
  }
};

// --- Functions for VoiceQA.tsx ---

export const transcribeAudio = async (llm: string, base64Data: string, fileType: string): Promise<string> => {
   try {
    const model = genAI.getGenerativeModel({ model: llm, safetySettings });
    const parts: (string | InlineDataPart)[] = [
      { inlineData: { mimeType: fileType, data: base64Data } },
      { text: "Transcribe the audio from this file. Respond only with the full transcription." },
    ];
    const result = await model.generateContent({ contents: [{ parts }] });
    return result.response.text();
  } catch (error: any) {
    console.error("Gemini Transcription Error:", error);
    throw new Error(`Failed to transcribe audio: ${error.message}`);
  }
};

export const generateSummary = async (llm: string, text: string, language: string): Promise<string> => {
  const prompt = `Summarize the following text in ${language}. Provide a concise but comprehensive overview of the key points.\n\nTEXT:\n${text}`;
  return safeGenerateContent(llm, prompt);
};

export const generateFlashcards = async (llm: string, text: string, language: string): Promise<Flashcard[]> => {
  const prompt = `Based on the following text, generate a JSON array of 5-10 flashcards in ${language}. Each flashcard should be an object with a "question" (string) and "answer" (string) property.\n\nTEXT:\n${text}`;
  const resultText = await safeGenerateContent(llm, prompt, true);
  try {
    // The API might return markdown with JSON inside
    const jsonMatch = resultText.match(/```json([\s\S]*)```/);
    const parsableText = jsonMatch ? jsonMatch[1] : resultText;
    return JSON.parse(parsableText) as Flashcard[];
  } catch (e) {
    console.error("Failed to parse flashcards JSON:", e, "Raw text:", resultText);
    throw new Error("AI returned invalid flashcard format.");
  }
};

export const generateAnswer = async (llm: string, text: string, question: string, language: string): Promise<string> => {
  const prompt = `Based on the context below, answer the user's question in ${language}.\n\nCONTEXT:\n${text}\n\nQUESTION:\n${question}`;
  return safeGenerateContent(llm, prompt);
};

// --- Functions for MCQ.tsx ---

export const generateMCQs = async (llm: string, text: string, language: string, difficulty: string): Promise<MCQType[]> => {
  const prompt = `Based on the following text, generate a JSON array of 5 ${difficulty} multiple-choice questions in ${language}. Each object in the array must have four properties: "question" (string), "options" (array of 4 strings), "correctAnswer" (string, which must be one of the options), and "explanation" (string).\n\nTEXT:\n${text}`;
  const resultText = await safeGenerateContent(llm, prompt, true);
   try {
    const jsonMatch = resultText.match(/```json([\s\S]*)```/);
    const parsableText = jsonMatch ? jsonMatch[1] : resultText;
    return JSON.parse(parsableText) as MCQType[];
  } catch (e) {
    console.error("Failed to parse MCQs JSON:", e, "Raw text:", resultText);
    throw new Error("AI returned invalid MCQ format.");
  }
};

export const generatePersonalizedStudyGuide = async (llm: string, text: string, incorrectMCQs: MCQType[], language: string): Promise<string> => {
  const incorrectReview = incorrectMCQs.map(mcq => `Question: ${mcq.question}\nCorrect Answer: ${mcq.correctAnswer}\nExplanation: ${mcq.explanation}`).join('\n\n');
  const prompt = `A student took a quiz based on the provided text and got the following questions wrong. Create a personalized study guide in ${language} that focuses on these incorrect topics. Explain the concepts clearly and relate them back to the main text.\n\nORIGINAL TEXT:\n${text}\n\nINCORRECT QUESTIONS:\n${incorrectReview}`;
  return safeGenerateContent(llm, prompt);
};

// --- Functions for SemanticSearch.tsx ---

// Helper for cosine similarity
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

export const performSemanticSearch = async (llm: string, text: string, query: string, topK: number): Promise<string[]> => {
  try {
    // Note: `llm` param is unused here as we use a dedicated embedding model
    const embeddingModel = genAI.getEmbeddingModel({ model: "text-embedding-004" });
    
    // 1. Chunk the ingested text
    const chunks = chunkText(text);
    if (chunks.length === 0) return [];

    // 2. Embed all text chunks
    const textEmbeddings = await embeddingModel.embedContents(chunks.map(chunk => ({
      content: chunk,
      role: "user"
    })));

    // 3. Embed the search query
    const queryEmbedding = await embeddingModel.embedContent(query);

    // 4. Find similarity
    const similarities = textEmbeddings.embeddings.map((emb, i) => ({
      index: i,
      score: cosineSimilarity(emb.values, queryEmbedding.embedding.values)
    }));

    // 5. Sort by score
    similarities.sort((a, b) => b.score - a.score);

    // 6. Return top K chunk texts
    return similarities.slice(0, topK).map(sim => chunks[sim.index]);

  } catch (error: any) {
    console.error("Semantic Search Error:", error);
    throw new Error(`Failed to perform semantic search: ${error.message}`);
  }
};