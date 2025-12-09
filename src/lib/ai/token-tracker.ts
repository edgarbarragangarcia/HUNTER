/**
 * AI Token Usage Tracker
 * 
 * Utility functions to track and record AI token usage across the application.
 * This helps monitor costs and usage patterns for AI features.
 */

export interface TokenUsageParams {
    total_tokens: number;
    prompt_tokens: number;
    completion_tokens: number;
    model?: string;
    provider?: 'openai' | 'anthropic' | 'google';
    feature?: string;
    request_type?: 'chat' | 'completion' | 'embedding' | 'analysis';
    estimated_cost?: number;
}

/**
 * Records token usage to the database
 * @param usage - Token usage parameters
 * @returns Promise<boolean> - Success status
 */
export async function recordTokenUsage(usage: TokenUsageParams): Promise<boolean> {
    try {
        const response = await fetch('/api/ai/usage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                total_tokens: usage.total_tokens,
                prompt_tokens: usage.prompt_tokens,
                completion_tokens: usage.completion_tokens,
                model: usage.model || 'gpt-4-turbo',
                provider: usage.provider || 'openai',
                feature: usage.feature,
                request_type: usage.request_type || 'completion',
                estimated_cost: usage.estimated_cost || calculateCost(usage)
            }),
        });

        if (!response.ok) {
            console.error('Failed to record token usage:', await response.text());
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error recording token usage:', error);
        return false;
    }
}

/**
 * Calculate estimated cost based on token usage and model
 * Prices as of 2024 (adjust as needed)
 */
export function calculateCost(usage: TokenUsageParams): number {
    const model = usage.model || 'gpt-4-turbo';

    // Pricing per 1M tokens (USD)
    const pricing: Record<string, { input: number; output: number }> = {
        'gpt-4-turbo': { input: 10.00, output: 30.00 },
        'gpt-4': { input: 30.00, output: 60.00 },
        'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
        'claude-3-opus': { input: 15.00, output: 75.00 },
        'claude-3-sonnet': { input: 3.00, output: 15.00 },
        // Gemini Models (Approximated 2.0 Flash pricing based on competitive rates)
        'gemini-pro': { input: 0.50, output: 1.50 },
        'gemini-2.0-flash': { input: 0.10, output: 0.40 }, // Example low cost for Flash
        'gemini-2.5-flash-lite': { input: 0.075, output: 0.30 }, // Even lower
        'text-embedding-004': { input: 0.05, output: 0.0 }
    };

    const modelPricing = pricing[model] || pricing['gpt-4-turbo'];

    const inputCost = (usage.prompt_tokens / 1_000_000) * modelPricing.input;
    const outputCost = (usage.completion_tokens / 1_000_000) * modelPricing.output;

    return Number((inputCost + outputCost).toFixed(6));
}

/**
 * Fetch current user's token usage statistics
 */
export async function getUserTokenUsage() {
    try {
        const response = await fetch('/api/ai/usage');

        if (!response.ok) {
            throw new Error('Failed to fetch token usage');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching token usage:', error);
        return null;
    }
}

/**
 * Format token count for display
 */
export function formatTokenCount(count: number): string {
    if (count >= 1_000_000) {
        return `${(count / 1_000_000).toFixed(2)}M`;
    } else if (count >= 1_000) {
        return `${(count / 1_000).toFixed(1)}K`;
    }
    return count.toString();
}

/**
 * Example usage:
 * 
 * // After making an AI API call
 * const response = await openai.chat.completions.create({...});
 * 
 * await recordTokenUsage({
 *     total_tokens: response.usage.total_tokens,
 *     prompt_tokens: response.usage.prompt_tokens,
 *     completion_tokens: response.usage.completion_tokens,
 *     model: 'gpt-4-turbo',
 *     provider: 'openai',
 *     feature: 'copilot',
 *     request_type: 'chat'
 * });
 */
