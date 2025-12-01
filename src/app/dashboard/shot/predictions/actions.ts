'use server'

import { getCompanyData, getCompanyContracts, calculateCapacity, getExperienceByUNSPSC } from "@/lib/company-data";
import { createClient } from "@/lib/supabase/server";

interface Tender {
    id: string;
    secop_id: string;
    title: string;
    entity_name: string;
    amount: number;
    closing_at: string;
    category?: string;
    required_unspsc?: string[];
}

/**
 * Calculate match score between company profile and tender
 */
function calculateMatchScore(company: any, tender: Tender, companyExperience: Record<string, any>): number {
    let score = 0;

    // Financial fit (40 points)
    const capacity = calculateCapacity(company);
    if (capacity > 0 && tender.amount > 0) {
        const ratio = tender.amount / capacity;
        if (ratio <= 1) {
            // Perfect fit or below capacity
            score += 40;
        } else if (ratio <= 1.5) {
            // Slightly above capacity but manageable
            score += 25;
        } else if (ratio <= 2) {
            // Requires consortium or high effort
            score += 10;
        }
        // else 0 points - out of capacity range
    }

    // Experience match (40 points)
    if (tender.required_unspsc && tender.required_unspsc.length > 0) {
        const companyUNSPSC = Object.keys(companyExperience);
        const matchingCodes = tender.required_unspsc.filter(code =>
            companyUNSPSC.some(companyCode => companyCode.startsWith(code.slice(0, 4)))
        );
        const matchRatio = matchingCodes.length / tender.required_unspsc.length;
        score += Math.round(matchRatio * 40);
    } else {
        // No UNSPSC requirement, give partial points
        score += 20;
    }

    // Size compatibility (20 points)
    const contracts = Object.values(companyExperience);
    if (contracts.length > 0) {
        const avgContractValue = contracts.reduce((sum: number, c: any) => sum + c.totalValue, 0) / contracts.length;
        const sizeRatio = tender.amount / avgContractValue;
        if (sizeRatio >= 0.5 && sizeRatio <= 2) {
            // Similar size to previous contracts
            score += 20;
        } else if (sizeRatio >= 0.3 && sizeRatio <= 3) {
            // Somewhat different but manageable
            score += 10;
        }
    }

    return Math.min(100, Math.round(score));
}

export async function getPredictionStats() {
    const company = await getCompanyData();
    const contracts = await getCompanyContracts();

    if (!company) {
        return {
            opportunities: 0,
            avgSuccessScore: 0,
            risks: 0
        };
    }

    const companyExperience = getExperienceByUNSPSC(contracts);

    // Fetch recent tenders
    const supabase = await createClient();
    const { data: tenders } = await supabase
        .from('tenders')
        .select('*')
        .eq('status', 'OPEN')
        .order('created_at', { ascending: false })
        .limit(50);

    if (!tenders) {
        return {
            opportunities: 0,
            avgSuccessScore: 0,
            risks: 0
        };
    }

    // Calculate scores for all tenders
    const scoredTenders = tenders.map(tender => ({
        ...tender,
        score: calculateMatchScore(company, tender, companyExperience)
    }));

    const opportunities = scoredTenders.filter(t => t.score >= 70).length;
    const avgScore = scoredTenders.length > 0
        ? Math.round(scoredTenders.reduce((sum, t) => sum + t.score, 0) / scoredTenders.length)
        : 0;

    // Identify risks: tenders we're tracking but have low scores
    const risks = scoredTenders.filter(t => t.score >= 30 && t.score < 50).length;

    return {
        opportunities,
        avgSuccessScore: avgScore,
        risks
    };
}

export async function getOpportunities() {
    const company = await getCompanyData();
    const contracts = await getCompanyContracts();

    if (!company) return [];

    const companyExperience = getExperienceByUNSPSC(contracts);

    // Fetch recent tenders
    const supabase = await createClient();
    const { data: tenders } = await supabase
        .from('tenders')
        .select('*')
        .eq('status', 'OPEN')
        .order('created_at', { ascending: false })
        .limit(50);

    if (!tenders) return [];

    // Score and filter high-probability opportunities
    const opportunities = tenders
        .map(tender => {
            const score = calculateMatchScore(company, tender, companyExperience);
            let reason = "";

            if (score >= 90) {
                reason = "Excelente match financiero y de experiencia";
            } else if (score >= 80) {
                reason = "Muy buen ajuste con tu perfil";
            } else if (score >= 70) {
                reason = "Buena oportunidad según tu capacidad";
            }

            return {
                id: tender.id,
                title: tender.title,
                entity: tender.entity_name,
                amount: tender.amount,
                closingDate: tender.closing_at,
                matchScore: score,
                reason
            };
        })
        .filter(opp => opp.matchScore >= 70)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 10);

    return opportunities;
}

export async function getRisks() {
    const company = await getCompanyData();
    const contracts = await getCompanyContracts();

    if (!company) return [];

    const companyExperience = getExperienceByUNSPSC(contracts);
    const capacity = calculateCapacity(company);

    // Fetch recent tenders
    const supabase = await createClient();
    const { data: tenders } = await supabase
        .from('tenders')
        .select('*')
        .eq('status', 'OPEN')
        .order('created_at', { ascending: false })
        .limit(50);

    if (!tenders) return [];

    // Identify risk scenarios
    const risks = tenders
        .map(tender => {
            const score = calculateMatchScore(company, tender, companyExperience);

            // Risk: interesting tender but challenging
            if (score >= 30 && score < 50) {
                let title = "";
                let description = "";
                let severity: 'high' | 'medium' = 'medium';

                if (tender.amount > capacity * 1.5) {
                    title = "Capacidad Financiera Insuficiente";
                    description = `El monto requerido (${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(tender.amount)}) excede significativamente tu capacidad K`;
                    severity = 'high';
                } else {
                    title = "Experiencia Limitada en Sector";
                    description = `Poca experiencia en los códigos UNSPSC requeridos para este proceso`;
                    severity = 'medium';
                }

                return {
                    id: tender.id,
                    tenderId: tender.secop_id,
                    title,
                    description: `${description}. Proceso: ${tender.title}`,
                    severity
                };
            }
            return null;
        })
        .filter((risk): risk is NonNullable<typeof risk> => risk !== null)
        .slice(0, 5);

    return risks;
}
