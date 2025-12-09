'use server'

import { CompanyData, calculateCapacity, getExperienceByUNSPSC, getCompanyContracts, Contract } from "@/lib/company-data";
import { SecopProcess } from "@/lib/socrata";
import { extractUNSPSCFromProcess } from "./match-helpers";

/**
 * Analysis result for a tender process
 */
export interface TenderMatchAnalysis {
    isMatch: boolean;
    matchScore: number; // 0-100
    reasons: string[];
    warnings: string[];
}

/**
 * Analyzes if a SECOP process matches the company's profile
 * @param process The SECOP process to analyze
 * @param company The company data
 * @returns Analysis result with match score and reasons
 */
export async function analyzeTenderMatch(
    process: SecopProcess,
    company: CompanyData,
    existingContracts?: Contract[]
): Promise<TenderMatchAnalysis> {
    const reasons: string[] = [];
    const warnings: string[] = [];
    let matchScore = 0;

    // 1. UNSPSC Code Match (40 points)
    const unspscMatch = analyzeUNSPSCMatch(process, company);
    if (unspscMatch.hasMatch) {
        matchScore += 40;
        reasons.push(`Código UNSPSC compatible: ${unspscMatch.matchedCodes.join(', ')}`);
    } else {
        warnings.push('No hay coincidencia en códigos UNSPSC');
    }

    // 2. Financial Capacity (30 points)
    const capacityMatch = analyzeFinancialCapacity(process, company);
    if (capacityMatch.hasCapacity) {
        matchScore += 30;
        reasons.push(`Capacidad financiera suficiente (${capacityMatch.percentage}%)`);
    } else {
        if (company.financial_indicators) {
            warnings.push(`Requiere ${capacityMatch.requiredCapacity} pero tienes ${capacityMatch.availableCapacity}`);
        } else {
            warnings.push('Configura tus indicadores financieros para validar capacidad');
        }
    }

    // 3. Experience Match (20 points)
    const experienceMatch = await analyzeExperience(process, company, existingContracts);
    if (experienceMatch.hasExperience) {
        matchScore += 20;
        reasons.push(`Experiencia previa: ${experienceMatch.contractCount} contratos similares`);
    } else {
        warnings.push('Sin experiencia previa en este sector');
    }

    // 4. Location/Region Match (10 points) - Optional
    const locationMatch = analyzeLocation(process, company);
    if (locationMatch.hasMatch) {
        matchScore += 10;
        reasons.push(`Ubicación favorable: ${locationMatch.region}`);
    }

    // Consider it a match if score >= 50
    const isMatch = matchScore >= 50;

    return {
        isMatch,
        matchScore,
        reasons,
        warnings
    };
}

/**
 * Analyzes UNSPSC code compatibility
 */
function analyzeUNSPSCMatch(process: SecopProcess, company: CompanyData): {
    hasMatch: boolean;
    matchedCodes: string[];
} {
    const companyUNSPSC = company.unspsc_codes || [];

    if (companyUNSPSC.length === 0) {
        return { hasMatch: false, matchedCodes: [] };
    }

    // Extract UNSPSC from process description or codigo_principal_de_categoria
    const processUNSPSC = extractUNSPSCFromProcess(process);

    const matchedCodes: string[] = [];

    // Check for matches (first 4 digits = category match)
    for (const companyCode of companyUNSPSC) {
        const companyCategory = companyCode.slice(0, 4);

        for (const processCode of processUNSPSC) {
            const processCategory = processCode.slice(0, 4);

            if (companyCategory === processCategory) {
                matchedCodes.push(companyCode);
                break;
            }
        }
    }

    return {
        hasMatch: matchedCodes.length > 0,
        matchedCodes
    };
}

// extractUNSPSCFromProcess is now imported from match-helpers.ts

/**
 * Analyzes financial capacity to handle the tender
 */
function analyzeFinancialCapacity(process: SecopProcess, company: CompanyData): {
    hasCapacity: boolean;
    percentage: number;
    requiredCapacity: string;
    availableCapacity: string;
} {
    const tenderAmount = parseFloat(process.precio_base || '0');

    if (!company.financial_indicators || tenderAmount === 0) {
        return {
            hasCapacity: false,
            percentage: 0,
            requiredCapacity: formatCurrency(tenderAmount),
            availableCapacity: '$0'
        };
    }

    const capacity = calculateCapacity(company);

    // Check if company has at least 100% of the tender amount in capacity
    const percentage = Math.round((capacity / tenderAmount) * 100);
    const hasCapacity = capacity >= tenderAmount;

    return {
        hasCapacity,
        percentage,
        requiredCapacity: formatCurrency(tenderAmount),
        availableCapacity: formatCurrency(capacity)
    };
}

/**
 * Analyzes if the company has previous experience in similar projects
 */
async function analyzeExperience(process: SecopProcess, company: CompanyData, existingContracts?: Contract[]): Promise<{
    hasExperience: boolean;
    contractCount: number;
}> {
    const processUNSPSC = extractUNSPSCFromProcess(process);

    if (processUNSPSC.length === 0) {
        return { hasExperience: false, contractCount: 0 };
    }

    // Get company contracts (use cache if provided)
    const contracts = existingContracts || await getCompanyContracts();
    const experienceByUNSPSC = getExperienceByUNSPSC(contracts);

    // Count contracts in matching UNSPSC categories
    let contractCount = 0;

    for (const processCode of processUNSPSC) {
        const processCategory = processCode.slice(0, 4);

        for (const [companyCode, data] of Object.entries(experienceByUNSPSC)) {
            const companyCategory = companyCode.slice(0, 4);

            if (companyCategory === processCategory) {
                contractCount += data.count;
            }
        }
    }

    return {
        hasExperience: contractCount > 0,
        contractCount
    };
}

/**
 * Analyzes location/region compatibility (basic implementation)
 */
function analyzeLocation(process: SecopProcess, company: CompanyData): {
    hasMatch: boolean;
    region: string;
} {
    // This is a simplified version
    // In a real implementation, you'd compare process location with company's operational regions

    // For now, we'll just mark it as matched if process has a location
    const region = process.departamento_entidad || process.ciudad_entidad || '';

    return {
        hasMatch: Boolean(region),
        region
    };
}

/**
 * Format currency helper
 */
function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
    }).format(amount);
}
