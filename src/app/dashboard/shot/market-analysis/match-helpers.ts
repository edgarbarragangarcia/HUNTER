import { SecopProcess } from "@/lib/socrata";

/**
 * Extracts UNSPSC codes from process data
 */
export function extractUNSPSCFromProcess(process: SecopProcess): string[] {
    const codes: string[] = [];

    // Try to extract from codigo_principal_de_categoria
    if (process.codigo_principal_de_categoria) {
        let code = process.codigo_principal_de_categoria.toString();

        // Remove "V1." prefix if present (e.g. V1.80111600 -> 80111600)
        if (code.startsWith('V1.')) {
            code = code.substring(3);
        }

        if (code && code.length >= 4) {
            codes.push(code);
        }
    }

    return codes;
}
