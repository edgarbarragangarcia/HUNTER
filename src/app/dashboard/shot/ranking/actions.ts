'use server'

import { createClient } from "@/lib/supabase/server";

export async function getUserRanking() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Get user's company
    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!profile) return null;

    const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('profile_id', profile.id)
        .single();

    if (!company) return null;

    // Calculate basic stats
    // In a real app, this would be complex aggregations
    // For now, we mock the calculation based on real data if available

    return {
        globalRank: 42, // Placeholder until we have enough data to rank
        percentile: "Top 5%",
        competitivenessScore: 8.5,
        growth: 15,
        sector: company.economic_sector || "General"
    };
}

export async function getSectorRanking(sector: string) {
    const supabase = await createClient();

    // Fetch top competitors in the same sector
    // Using competitor_analysis table
    const { data, error } = await supabase
        .from('competitor_analysis')
        .select('*')
        // .contains('top_sectors', [sector]) // Assuming top_sectors is jsonb array
        .order('total_amount', { ascending: false })
        .limit(5);

    if (error || !data || data.length === 0) {
        // Return dummy data if no real data yet, to show the UI structure
        // Or return empty array
        return [];
    }

    return data.map((comp: any) => ({
        id: comp.id,
        name: comp.name,
        amount: comp.total_amount,
        isLeader: false
    }));
}
