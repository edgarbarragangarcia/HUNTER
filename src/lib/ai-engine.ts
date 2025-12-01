import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Models
const MODEL_FAST = "gemini-2.5-flash-lite"; // For high volume, simple tasks
const MODEL_SMART = "gemini-2.0-flash"; // For complex reasoning
const MODEL_EMBEDDING = "text-embedding-004"; // For semantic search

export interface AIResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    usage?: any;
}

export class AIEngine {
    private static instance: AIEngine;
    private fastModel: GenerativeModel | null = null;
    private smartModel: GenerativeModel | null = null;
    private embeddingModel: GenerativeModel | null = null;

    private constructor() {
        if (genAI) {
            this.fastModel = genAI.getGenerativeModel({ model: MODEL_FAST });
            this.smartModel = genAI.getGenerativeModel({ model: MODEL_SMART });
            this.embeddingModel = genAI.getGenerativeModel({ model: MODEL_EMBEDDING });
        } else {
            console.warn("⚠️ GEMINI_API_KEY not configured. AI features will be disabled.");
        }
    }

    public static getInstance(): AIEngine {
        if (!AIEngine.instance) {
            AIEngine.instance = new AIEngine();
        }
        return AIEngine.instance;
    }

    /**
     * Generate text content using the fast model
     */
    async generateText(prompt: string, systemInstruction?: string): Promise<AIResponse<string>> {
        if (!this.fastModel) return { success: false, error: "AI not configured" };

        try {
            const model = systemInstruction
                ? genAI!.getGenerativeModel({ model: MODEL_FAST, systemInstruction })
                : this.fastModel;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return { success: true, data: response.text() };
        } catch (error: any) {
            console.error("AI Generation Error:", error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Generate structured JSON data
     */
    async generateJSON<T>(prompt: string, schemaDescription: string): Promise<AIResponse<T>> {
        if (!this.smartModel) return { success: false, error: "AI not configured" };

        try {
            const fullPrompt = `${prompt}\n\nIMPORTANT: Respond ONLY with valid JSON matching this structure: ${schemaDescription}. Do not include markdown formatting like \`\`\`json.`;

            const result = await this.smartModel.generateContent(fullPrompt);
            const response = await result.response;
            const text = response.text();

            // Clean up potential markdown formatting
            const cleanJson = text.replace(/```json\n|\n```/g, '').replace(/```/g, '').trim();

            try {
                const data = JSON.parse(cleanJson) as T;
                return { success: true, data };
            } catch (parseError) {
                console.error("JSON Parse Error:", parseError, "Raw text:", text);
                return { success: false, error: "Failed to parse AI response as JSON" };
            }
        } catch (error: any) {
            console.error("AI JSON Generation Error:", error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Generate embeddings for semantic search
     */
    async generateEmbedding(text: string): Promise<AIResponse<number[]>> {
        if (!this.embeddingModel) return { success: false, error: "AI not configured" };

        try {
            const result = await this.embeddingModel.embedContent(text);
            return { success: true, data: result.embedding.values };
        } catch (error: any) {
            console.error("Embedding Generation Error:", error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Analyze a document (text content)
     */
    async analyzeDocument(documentText: string, prompt: string): Promise<AIResponse<string>> {
        if (!this.smartModel) return { success: false, error: "AI not configured" };

        try {
            // Truncate if too long (Gemini has large context but good to be safe)
            const truncatedText = documentText.substring(0, 100000);

            const fullPrompt = `DOCUMENT CONTENT:\n${truncatedText}\n\nTASK:\n${prompt}`;

            const result = await this.smartModel.generateContent(fullPrompt);
            const response = await result.response;
            return { success: true, data: response.text() };
        } catch (error: any) {
            console.error("Document Analysis Error:", error);
            return { success: false, error: error.message };
        }
    }
}
