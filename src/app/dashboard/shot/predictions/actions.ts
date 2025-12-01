'use server'

import { createClient } from "@/lib/supabase/server";

export async function getPredictionStats() {
    const supabase = await createClient();

    // Get opportunities count (high probability)
    const { count: opportunitiesCount } = await supabase
        .from('ai_predictions')
        .select('*', { count: 'exact', head: true })
        .eq('prediction_type', 'opportunity')
        .gte('score', 70); // High probability threshold

    // Get average success score
    const { data: successScores } = await supabase
        .from('ai_predictions')
        .select('score')
        .eq('prediction_type', 'success_probability');

    const avgScore = successScores?.length
        ? Math.round(successScores.reduce((a, b) => a + b.score, 0) / successScores.length)
        : 0;

    // Get risks count
    const { count: risksCount } = await supabase
        .from('ai_predictions')
        .select('*', { count: 'exact', head: true })
        .eq('prediction_type', 'risk')
        .gte('score', 50); // Medium-High risk

    return {
        opportunities: opportunitiesCount || 0,
        avgSuccessScore: avgScore,
        risks: risksCount || 0
    };
}

export async function getOpportunities() {
    const supabase = await createClient();

    // Fetch predictions joined with tender data
    // Note: Supabase join syntax depends on foreign key relationships
    const { data, error } = await supabase
        .from('ai_predictions')
        .select(`
            id,
            score,
            confidence,
            explanation,
            tender:tender_id (
                id,
                title,
                entity_name,
                amount,
                closing_at,
                category
            )
        `)
        .eq('prediction_type', 'opportunity')
        .order('score', { ascending: false })
        .limit(10);

    if (error) {
        console.error("Error fetching opportunities:", error);
        return [];
    }

    return data.map((item: any) => ({
        id: item.id,
        title: item.tender?.title || "Oportunidad Detectada",
        entity: item.tender?.entity_name || "Entidad Desconocida",
        amount: item.tender?.amount,
        closingDate: item.tender?.closing_at,
        matchScore: item.score,
        reason: item.explanation
    }));
}

export async function getRisks() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('ai_predictions')
        .select(`
            id,
            score,
            explanation,
            details,
            tender:tender_id (
                id,
                title,
                secop_id
            )
        `)
        .eq('prediction_type', 'risk')
        .order('score', { ascending: false }) // Higher score = Higher risk
        .limit(5);

    if (error) {
        console.error("Error fetching risks:", error);
        return [];
    }

    return data.map((item: any) => ({
        id: item.id,
        tenderId: item.tender?.secop_id,
        title: item.details?.risk_title || "Riesgo Detectado",
        description: item.explanation,
        severity: item.score > 80 ? 'high' : 'medium'
    }));
}
