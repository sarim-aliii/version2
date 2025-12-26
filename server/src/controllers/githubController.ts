import { Request, Response } from 'express';
import axios from 'axios';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// Helper: Detect if a file is "code" based on extension
const isCodeFile = (path: string): boolean => {
    const ignoredExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.pdf', '.lock', '.ttf', '.woff', '.woff2', '.eot', '.mp4', '.mp3', '.wav', '.zip', '.tar', '.gz'];
    const ignoredDirs = ['node_modules', 'dist', 'build', '.git', '.idea', '.vscode', 'coverage', '__tests__'];
    
    if (ignoredDirs.some(dir => path.includes(`/${dir}/`) || path.startsWith(`${dir}/`))) return false;
    if (ignoredExtensions.some(ext => path.endsWith(ext))) return false;
    
    return true;
};

// @desc    Analyze a GitHub Repository
// @route   POST /api/github/scan
// @access  Private
export const analyzeRepo = async (req: Request, res: Response) => {
    const { repoUrl, llm, language } = req.body;

    if (!repoUrl) return res.status(400).json({ message: "GitHub Repository URL is required." });

    try {
        // 1. Parse URL (e.g., https://github.com/owner/repo)
        const regex = /github\.com\/([^\/]+)\/([^\/]+)/;
        const match = repoUrl.match(regex);
        if (!match) return res.status(400).json({ message: "Invalid GitHub URL." });

        const owner = match[1];
        const repo = match[2].replace('.git', '');

        console.log(`[RepoScan] Fetching tree for ${owner}/${repo}...`);

        // 2. Fetch File Tree (Recursive)
        // Note: For private repos, you'd need to pass a GH Token in headers
        const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`;
        let treeResponse;
        
        try {
            treeResponse = await axios.get(treeUrl);
        } catch (e) {
            // Fallback to 'master' if 'main' fails
            try {
                treeResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`);
            } catch (err: any) {
                return res.status(404).json({ message: "Repository not found or branch is not main/master." });
            }
        }

        const tree = treeResponse.data.tree;

        // 3. Filter for Code Files (Limit to top 60 files to prevent timeout/overload)
        const codeFiles = tree
            .filter((item: any) => item.type === 'blob' && isCodeFile(item.path))
            .slice(0, 60); // Hard limit for demo purposes

        console.log(`[RepoScan] Identified ${codeFiles.length} relevant files. Downloading content...`);

        // 4. Download Content (Parallel with concurrency limit)
        // Using 'raw.githubusercontent.com'
        const fileContents: string[] = [];
        const batchSize = 10;
        
        for (let i = 0; i < codeFiles.length; i += batchSize) {
            const batch = codeFiles.slice(i, i + batchSize);
            const promises = batch.map(async (file: any) => {
                try {
                    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${treeResponse.data.sha || 'master'}/${file.path}`;
                    const { data } = await axios.get(rawUrl, { responseType: 'text' });
                    // Add file markers for the AI
                    return `\n\n--- FILE: ${file.path} ---\n${typeof data === 'string' ? data : JSON.stringify(data)}`;
                } catch (e) {
                    console.warn(`Failed to fetch ${file.path}`);
                    return null;
                }
            });
            
            const results = await Promise.all(promises);
            fileContents.push(...results.filter(r => r !== null) as string[]);
        }

        const fullCodebase = fileContents.join('\n');
        console.log(`[RepoScan] Total context size: ${fullCodebase.length} chars.`);

        // 5. Send to Gemini
        const model = genAI.getGenerativeModel({ 
            model: llm || 'gemini-1.5-pro-latest', // Ensure Pro is used for large context
            safetySettings 
        });

        const prompt = `
        You are a Senior Software Architect. I am providing you with the file structure and contents of a GitHub repository.
        
        YOUR TASK:
        1. **Architecture Diagram**: Generate a **Mermaid.js** graph (flowchart TD or classDiagram) showing the high-level architecture, module dependencies, and data flow.
        2. **Explanation**: Explain how the application works, key technologies used, and the logic flow.
        
        OUTPUT FORMAT:
        Return a JSON object with two keys:
        - "diagram": The raw Mermaid code string.
        - "explanation": A Markdown string with the detailed explanation.

        CODEBASE CONTEXT:
        ${fullCodebase.substring(0, 3500000)} 
        `; // 3.5M chars is roughly 800k-1M tokens, safe for 1.5 Pro

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        });

        const textRes = result.response.text();
        const jsonRes = JSON.parse(textRes);

        res.json(jsonRes);

    } catch (error: any) {
        console.error("Repo Scan Error:", error);
        res.status(500).json({ message: `Analysis failed: ${error.message}` });
    }
};