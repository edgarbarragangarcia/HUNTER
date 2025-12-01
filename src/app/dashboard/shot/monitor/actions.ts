'use server'

import { getCompanyData, getCompanyContracts, getExperienceByUNSPSC } from "@/lib/company-data";
import { createClient } from "@/lib/supabase/server";
import { getOpportunities } from "../predictions/actions";

export async function getMonitoredTenders() {
    // Reuse prediction logic but show all matches
    const opportunities = await getOpportunities();

    return opportunities.map(opp => ({
        ...opp,
        status: 'MONITORED',
        lastUpdate: new Date().toISOString()
    }));
}

export async function getRecentActivity() {
    const company = await getCompanyData();

    if (!company) return [];

    const companyUNSPSC = company.unspsc_codes || [];

    // Fetch recent tenders matching company's UNSPSC codes
    const supabase = await createClient();
    const { data: tenders } = await supabase
        .from('tenders')
        .select('*')
        .eq('status', 'OPEN')
        .order('created_at', { ascending: false })
        .limit(20);

    if (!tenders) return [];

    // Filter and format
    const activity = tenders
        .filter(tender => {
            if (!tender.required_unspsc) return false;
            return tender.required_unspsc.some((code: string) =>
                companyUNSPSC.some(companyCode => companyCode.startsWith(code.slice(0, 4)))
            );
        })
        .map(tender => ({
            id: tender.id,
            title: tender.title,
            entity: tender.entity_name,
            amount: tender.amount,
            type: 'NEW_TENDER',
            date: tender.created_at
        }))
        .slice(0, 10);

    return activity;
}

export async function getMonitorStats() {
    const company = await getCompanyData();
    const contracts = await getCompanyContracts();

    if (!company) {
        return {
            activeTenders: 0,
            matchingOpportunities: 0,
            trackedSectors: 0
        };
    }

    const companyExp = getExperienceByUNSPSC(contracts);

    // Get total active tenders
    const supabase = await createClient();
    const { count: activeTenders } = await supabase
        .from('tenders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'OPEN');

    // Get matching opportunities
    const opportunities = await getOpportunities();

    return {
        activeTenders: activeTenders || 0,
        matchingOpportunities: opportunities.length,
        trackedSectors: Object.keys(companyExp).length
    };
}

// Aliases for backward compatibility
export const getMonitoredEntities = getMonitoredTenders;
export const getCompetitors = getMonitorStats; // Placeholder
export const getMarketAlerts = getRecentActivity;
