import { createClient } from "@/lib/supabase/server";
import { searchSecopProcesses } from "@/lib/socrata";
import { AIEngine } from "@/lib/ai-engine";

export class DataProcessor {

    /**
     * Import recent tenders from SECOP to historical cache
     */
    async importRecentTenders(limit: number = 50) {
        const supabase = await createClient();
        const aiEngine = AIEngine.getInstance();

        try {
            // 1. Fetch from Socrata
            // We'll fetch 'Adjudicado' or 'Celebrado' processes for historical training
            // And 'Presentación de oferta' for active opportunities
            const tenders = await searchSecopProcesses("", limit); // This uses the default filter in socrata.ts

            console.log(`Fetched ${tenders.length} tenders from SECOP`);

            let processedCount = 0;

            for (const tender of tenders) {
                // 2. Check if exists
                const { data: existing } = await supabase
                    .from('historical_tenders')
                    .select('id')
                    .eq('secop_id', tender.id_del_proceso)
                    .single();

                if (existing) continue;

                // 3. Generate Embedding for semantic search
                // Combine title, description, and category for rich context
                const textToEmbed = `${tender.descripci_n_del_procedimiento} ${tender.entidad} ${tender.tipo_de_contrato}`;
                const embeddingResult = await aiEngine.generateEmbedding(textToEmbed);
                const embedding = embeddingResult.success ? embeddingResult.data : null;

                // 4. Insert into DB
                const { error } = await supabase
                    .from('historical_tenders')
                    .insert({
                        secop_id: tender.id_del_proceso,
                        title: tender.referencia_del_proceso || "Sin título", // Socrata mapping might vary
                        description: tender.descripci_n_del_procedimiento,
                        amount: parseFloat(tender.precio_base) || 0,
                        status: tender.fase,
                        published_at: tender.fecha_de_publicacion_del,
                        // closing_at: tender.fecha_de_recepcion_de_ofertas, // Need to check field name in socrata.ts
                        entity_name: tender.entidad,
                        region: "Colombia", // Default, should extract from data
                        category: tender.tipo_de_contrato,
                        embedding: embedding,
                        processed_for_ai: false
                    });

                if (error) {
                    console.error(`Error inserting tender ${tender.id_del_proceso}:`, error);
                } else {
                    processedCount++;
                }
            }

            return { success: true, processed: processedCount, total: tenders.length };

        } catch (error) {
            console.error("Data Import Error:", error);
            return { success: false, error: error };
        }
    }

    /**
     * Process pending tenders for AI analysis (classification, risk, etc.)
     */
    async processPendingTenders(batchSize: number = 10) {
        const supabase = await createClient();
        const aiEngine = AIEngine.getInstance();

        // 1. Get pending tenders
        const { data: tenders } = await supabase
            .from('historical_tenders')
            .select('*')
            .eq('processed_for_ai', false)
            .limit(batchSize);

        if (!tenders || tenders.length === 0) return { processed: 0 };

        let processedCount = 0;

        for (const tender of tenders) {
            // Example AI processing: Extract UNSPSC codes if missing, or classify risk
            // For now, we just mark as processed to simulate the pipeline

            await supabase
                .from('historical_tenders')
                .update({ processed_for_ai: true })
                .eq('id', tender.id);

            processedCount++;
        }

        return { processed: processedCount };
    }
}
