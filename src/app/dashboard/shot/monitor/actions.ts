'use server'

import { createClient } from "@/lib/supabase/server";

export async function getMonitoredEntities() {
    const supabase = await createClient();

    // In a real scenario, we would have a 'monitored_entities' table linking profiles to entities
    // For now, we'll fetch unique entities from historical tenders that the user might be interested in
    // Or just top entities by volume

    const { data, error } = await supabase
        .from('historical_tenders')
        .select('entity_name, amount')
        .order('published_at', { ascending: false })
        .limit(50);

    if (error) return [];

    // Aggregate by entity
    const entityStats: Record<string, { count: number, totalAmount: number }> = {};

    data.forEach((tender: any) => {
        if (!entityStats[tender.entity_name]) {
            entityStats[tender.entity_name] = { count: 0, totalAmount: 0 };
        }
        entityStats[tender.entity_name].count++;
        entityStats[tender.entity_name].totalAmount += Number(tender.amount) || 0;
    });

    // Convert to array and sort by count
    return Object.entries(entityStats)
        .map(([name, stats]) => ({
            name,
            processCount: stats.count,
            executedBudget: stats.totalAmount, // This is just sum of recent tenders, not total executed
            lastActivity: 'Reciente' // Placeholder
        }))
        .sort((a, b) => b.processCount - a.processCount)
        .slice(0, 6);
}

export async function getCompetitors() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('competitor_analysis')
        .select('*')
        .order('win_rate', { ascending: false })
        .limit(10);

    if (error) return [];

    return data.map((comp: any) => ({
        id: comp.id,
        name: comp.name,
        nit: comp.nit,
        winRate: comp.win_rate,
        totalContracts: comp.total_contracts,
        riskScore: comp.risk_score,
        commonProcesses: 0 // Placeholder, would require join with tender_competitors
    }));
}

export async function getMarketAlerts() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    // Get user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!profile) return [];

    const { data, error } = await supabase
        .from('ai_alerts')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) return [];

    return data.map((alert: any) => ({
        id: alert.id,
        title: alert.title,
        message: alert.message,
        type: alert.alert_type,
        date: alert.created_at,
        priority: alert.priority
    }));
}
