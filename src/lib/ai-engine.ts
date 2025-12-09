import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { recordTokenUsage } from "@/lib/ai/token-tracker";

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
    private genAI: GoogleGenerativeAI | null = null;

    private constructor() {
        // Read API key at instance creation time (not module load time)
        const apiKey = process.env.GEMINI_API_KEY;

        if (apiKey) {
            console.log("✅ GEMINI_API_KEY found, initializing AI models...");
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.fastModel = this.genAI.getGenerativeModel({ model: MODEL_FAST });
            this.smartModel = this.genAI.getGenerativeModel({ model: MODEL_SMART });
            this.embeddingModel = this.genAI.getGenerativeModel({ model: MODEL_EMBEDDING });
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
     * Helper to consistently track token usage
     */
    private async trackUsage(response: any, model: string, feature: string) {
        if (response.usageMetadata) {
            const usage = response.usageMetadata;
            await recordTokenUsage({
                total_tokens: usage.totalTokenCount || 0,
                prompt_tokens: usage.promptTokenCount || 0,
                completion_tokens: usage.candidatesTokenCount || 0,
                model: model,
                provider: 'google',
                feature: feature,
                request_type: 'completion'
            });
        }
    }

    /**
     * Generate text content using the fast model
     */
    async generateText(prompt: string, systemInstruction?: string): Promise<AIResponse<string>> {
        if (!this.fastModel) return { success: false, error: "AI not configured" };

        try {
            const model = systemInstruction
                ? this.genAI!.getGenerativeModel({ model: MODEL_FAST, systemInstruction })
                : this.fastModel;

            const result = await model.generateContent(prompt);
            const response = await result.response;

            // Track usage
            await this.trackUsage(response, MODEL_FAST, 'text-generation');

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

            // Track usage
            await this.trackUsage(response, MODEL_SMART, 'json-generation');

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

            // Embeddings don't always return standard usage metadata same way, 
            // but for simplicity we'll check if available or skip if not capable in this version
            // Cost is usually per character for embeddings, but we track if possible.

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

            // Track usage
            await this.trackUsage(response, MODEL_SMART, 'document-analysis');

            return { success: true, data: response.text() };
        } catch (error: any) {
            console.error("Document Analysis Error:", error);
            return { success: false, error: error.message };
        }
    }
}
