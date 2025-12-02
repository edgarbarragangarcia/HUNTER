'use server'

import { SecopProcess } from "@/lib/socrata";

const SOCRATA_API_URL = "https://www.datos.gov.co/resource/p6dx-8zbt.json";
const APP_TOKEN = process.env.SOCRATA_APP_TOKEN;

export interface CompetitorInfo {
    name: string;
    awardValue: number;
    contractDate: string;
    entity: string;
    description: string;
}

export async function getHistoricalContracts(unspscCodes: string[]): Promise<CompetitorInfo[]> {
    try {
        if (!unspscCodes || unspscCodes.length === 0) {
            console.log('No UNSPSC codes provided for historical search');
            return [];
        }

        // Clean codes (remove V1. prefix if present)
        const cleanCodes = unspscCodes.map(code => code.replace(/^V1\./, ''));

        console.log('Searching historical contracts for UNSPSC codes:', cleanCodes);

        // Try exact match first, then fall back to category (first 4 digits)
        const exactConditions = cleanCodes.map(code => `codigo_principal_de_categoria LIKE '%${code}%'`);
        const exactWhere = `(${exactConditions.join(' OR ')})`;

        const whereClause = `fase IN ('Adjudicado', 'Celebrado', 'Liquidado') AND ${exactWhere}`;

        const url = new URL(SOCRATA_API_URL);
        url.searchParams.append("$limit", "50"); // Increased from 20 to 50
        url.searchParams.append("$where", whereClause);
        url.searchParams.append("$order", "fecha_de_publicacion_del DESC");

        // Select specific fields to optimize
        url.searchParams.append("$select", "nombre_del_proveedor, valor_total_adjudicacion, fecha_de_publicacion_del, entidad, descripci_n_del_procedimiento, codigo_principal_de_categoria");

        const headers: HeadersInit = {
            "Accept": "application/json",
        };

        if (APP_TOKEN) {
            headers["X-App-Token"] = APP_TOKEN;
        }

        console.log('Querying SECOP API:', url.toString().substring(0, 150) + '...');

        const response = await fetch(url.toString(), { headers, next: { revalidate: 1800 } }); // Cache por 30 min

        if (!response.ok) {
            console.error(`SECOP API error for history: ${response.status} ${response.statusText}`);
            return [];
        }

        const data = await response.json();

        console.log(`Found ${data.length} historical contracts from SECOP`);

        // Map to simplified structure and filter out invalid entries
        const results = data
            .map((item: any) => ({
                name: item.nombre_del_proveedor || 'No disponible',
                awardValue: parseFloat(item.valor_total_adjudicacion || '0'),
                contractDate: item.fecha_de_publicacion_del,
                entity: item.entidad,
                description: item.descripci_n_del_procedimiento,
                unspscCode: item.codigo_principal_de_categoria
            }))
            .filter((item: CompetitorInfo & { unspscCode?: string }) =>
                item.name &&
                item.name !== 'No disponible' &&
                item.name !== 'No Adjudicado' &&
                item.name.trim().length > 0
            );

        console.log(`Returning ${results.length} valid competitors after filtering`);

        return results;

    } catch (error) {
        console.error("Error fetching historical contracts from SECOP:", error);
        return [];
    }
}
