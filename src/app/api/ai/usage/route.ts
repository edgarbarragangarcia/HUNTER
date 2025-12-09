import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const supabase = await createClient();

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get user token statistics from materialized view
        const { data: stats, error: statsError } = await supabase
            .from('user_token_stats')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (statsError && statsError.code !== 'PGRST116') { // PGRST116 = no rows
            console.error("Error fetching token stats:", statsError);
            // Return default values if no data exists yet
            return NextResponse.json({
                total_tokens: 0,
                prompt_tokens: 0,
                completion_tokens: 0,
                model: 'gpt-4-turbo',
                total_requests: 0,
                total_cost: 0,
                last_usage: new Date().toISOString()
            });
        }

        // If no stats found, return defaults
        if (!stats) {
            return NextResponse.json({
                total_tokens: 0,
                prompt_tokens: 0,
                completion_tokens: 0,
                model: 'gpt-4-turbo',
                total_requests: 0,
                total_cost: 0,
                last_usage: new Date().toISOString()
            });
        }

        // Return the statistics
        return NextResponse.json({
            total_tokens: stats.total_tokens || 0,
            prompt_tokens: stats.prompt_tokens || 0,
            completion_tokens: stats.completion_tokens || 0,
            model: stats.primary_model || 'gpt-4-turbo',
            total_requests: stats.total_requests || 0,
            total_cost: stats.total_cost || 0,
            last_usage: stats.last_usage || new Date().toISOString()
        });

    } catch (error) {
        console.error("Error in token usage API:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST endpoint to record token usage
export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const {
            total_tokens,
            prompt_tokens,
            completion_tokens,
            model = 'gpt-4-turbo',
            provider = 'openai',
            feature,
            request_type,
            estimated_cost
        } = body;

        // Validate required fields
        if (!total_tokens || !prompt_tokens || !completion_tokens) {
            return NextResponse.json(
                { error: "Missing required token metrics" },
                { status: 400 }
            );
        }

        // Insert token usage record
        const { data, error } = await supabase
            .from('ai_token_usage')
            .insert({
                user_id: user.id,
                total_tokens,
                prompt_tokens,
                completion_tokens,
                model,
                provider,
                feature,
                request_type,
                estimated_cost
            })
            .select()
            .single();

        if (error) {
            console.error("Error inserting token usage:", error);
            return NextResponse.json(
                { error: "Failed to record token usage" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data });

    } catch (error) {
        console.error("Error in token usage POST API:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
