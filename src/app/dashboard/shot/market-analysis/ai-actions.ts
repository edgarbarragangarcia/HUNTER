'use server'

import { AIEngine } from "@/lib/ai-engine";

export interface TenderAnalysis {
    deliverables: string[];
    technicalRequirements: string[];
    timeline: string[];
    summary: string;
}

export interface AIProcessClassification {
    id: string;
    isCorporate: boolean;
    isActionable: boolean;
    advice: string;
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

/**
 * Classifies a batch of processes using AI
 */
export async function classifyProcessesAI(processes: { id: string, title: string, description: string }[]): Promise<AIProcessClassification[]> {
    if (processes.length === 0) return [];

    try {
        const engine = AIEngine.getInstance();

        const processesText = processes.map(p => `ID: ${p.id}\nTÍTULO: ${p.title}\nDESCRIPCIÓN: ${p.description.substring(0, 300)}...`).join('\n---\n');

        const prompt = `
        Analiza el siguiente lote de licitaciones públicas en Colombia y clasifícalas para una EMPRESA.
        
        REGLAS DE CLASIFICACIÓN (CRÍTICO):
        1. isCorporate: TRUE si el contrato es para una EMPRESA (Ejemplos: Obra Pública, Interventoría, Suministros, Consultoría Técnica, Compraventa, Mantenimiento de Infraestructura).
           isCorporate: FALSE si el contrato es para PERSONA NATURAL. Identificadores clave: "apoyo a la gestión", "auxiliar", "honorarios", "servicios profesionales de carácter personal", "asistente", "profesional universitario para apoyo".
        2. isActionable: TRUE si el proceso tiene cronograma vigente para presentar ofertas hoy. FALSE si ya está adjudicado, celebrado o liquidado.
        3. advice: Un consejo táctico de experto (máx 15 palabras). Ej: "Consorcio necesario por capacidad K", "Enfocarse en precio", "Requiere experiencia en mantenimiento vial".
        
        LOTE DE PROCESOS:
        ${processesText}
        
        Genera un JSON que sea UN ARRAY de objetos con esta estructura:
        [
            {
                "id": "el ID proporcionado",
                "isCorporate": boolean,
                "isActionable": boolean,
                "advice": "string"
            }
        ]
        
        IMPORTANT: Responde SOLO con el JSON.
        `;

        const response = await engine.generateJSON<AIProcessClassification[]>(prompt, "Array of AIProcessClassification objects");

        if (response.success && response.data) {
            return response.data;
        }

        return [];
    } catch (error) {
        console.error("Error in classifyProcessesAI:", error);
        return [];
    }
}
