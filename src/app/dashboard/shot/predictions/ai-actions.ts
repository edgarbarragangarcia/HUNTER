'use server'

import { AIEngine } from "@/lib/ai-engine";

export interface TenderAnalysis {
    deliverables: string[];
    technicalRequirements: string[];
    timeline: string[];
    summary: string;
}

/**
 * Analyzes a tender description to extract key deliverables and requirements
 */
export async function analyzeTenderDescription(description: string, title: string): Promise<TenderAnalysis | null> {
    try {
        const engine = AIEngine.getInstance();

        const prompt = `
        Analiza la siguiente descripción de una licitación pública en Colombia y extrae la información clave.
        
        TÍTULO: ${title}
        
        DESCRIPCIÓN:
        ${description}
        
        Genera un JSON con la siguiente estructura:
        {
            "deliverables": ["lista de entregables o productos específicos que se deben entregar"],
            "technicalRequirements": ["lista de requisitos técnicos clave, tecnologías o perfiles requeridos"],
            "timeline": ["hitos de tiempo, plazos o duración mencionada"],
            "summary": "Un resumen ejecutivo de 2-3 líneas sobre qué hay que hacer exactamente"
        }
        
        Si no hay información suficiente para algún campo, déjalo como array vacío o string vacío.
        Sé conciso y directo.
        `;

        const response = await engine.generateJSON<TenderAnalysis>(prompt, "TenderAnalysis object with deliverables, technicalRequirements, timeline arrays and summary string");

        if (response.success && response.data) {
            return response.data;
        }

        return null;
    } catch (error) {
        console.error("Error analyzing tender description:", error);
        return null;
    }
}
