'use server'

import { createClient } from "@/lib/supabase/server";

interface MigrationResult {
    success: boolean;
    processed: number;
    migrated: number;
    skipped: number;
    errors: string[];
    details: Array<{
        fileName: string;
        category: string;
        status: 'migrated' | 'skipped' | 'error';
        reason?: string;
    }>;
}

/**
 * Migrates orphaned files from Storage to company_documents table
 * This fixes files that were uploaded before the schema fix
 */
export async function migrateDocuments(): Promise<MigrationResult> {
    const supabase = await createClient();

    const result: MigrationResult = {
        success: false,
        processed: 0,
        migrated: 0,
        skipped: 0,
        errors: [],
        details: []
    };

    try {
        // 1. Get user authentication
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            result.errors.push("Usuario no autenticado");
            return result;
        }

        console.log("🔍 Migrating documents for user:", user.id);

        // 2. Get profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (profileError || !profile) {
            result.errors.push("No se encontró el perfil del usuario");
            return result;
        }

        // 3. Get company
        const { data: company, error: companyError } = await supabase
            .from('companies')
            .select('id')
            .eq('profile_id', profile.id)
            .single();

        if (companyError || !company) {
            result.errors.push("No se encontró la empresa. Por favor completa primero la información de tu empresa.");
            return result;
        }

        console.log("🏢 Company ID:", company.id);

        // 4. Get existing documents in DB to avoid duplicates
        const { data: existingDocs } = await supabase
            .from('company_documents')
            .select('file_url')
            .eq('company_id', company.id);

        const existingUrls = new Set(existingDocs?.map(d => d.file_url) || []);

        // 5. Process each category
        const categories = ['legal', 'financial', 'technical'] as const;

        for (const category of categories) {
            console.log(`📂 Processing category: ${category}`);

            // List files in this category's folder
            const { data: files, error: listError } = await supabase
                .storage
                .from('company-documents')
                .list(`${user.id}/${category}`);

            if (listError) {
                console.error(`Error listing ${category} files:`, listError);
                result.errors.push(`Error al listar archivos de ${category}: ${listError.message}`);
                continue;
            }

            if (!files || files.length === 0) {
                console.log(`  No files found in ${category}`);
                continue;
            }

            // Process each file
            for (const file of files) {
                result.processed++;
                const filePath = `${user.id}/${category}/${file.name}`;

                // Get public URL
                const { data: { publicUrl } } = supabase
                    .storage
                    .from('company-documents')
                    .getPublicUrl(filePath);

                // Check if already exists in DB
                if (existingUrls.has(publicUrl)) {
                    result.skipped++;
                    result.details.push({
                        fileName: file.name,
                        category,
                        status: 'skipped',
                        reason: 'Ya existe en la base de datos'
                    });
                    console.log(`  ⏭️  Skipped: ${file.name} (already in DB)`);
                    continue;
                }

                // Determine mime type from file name
                const extension = file.name.split('.').pop()?.toLowerCase();
                const mimeTypeMap: Record<string, string> = {
                    'pdf': 'application/pdf',
                    'doc': 'application/msword',
                    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'xls': 'application/vnd.ms-excel',
                    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'jpg': 'image/jpeg',
                    'jpeg': 'image/jpeg',
                    'png': 'image/png'
                };
                const mimeType = mimeTypeMap[extension || 'pdf'] || 'application/octet-stream';

                // Insert into company_documents
                const { error: insertError } = await supabase
                    .from('company_documents')
                    .insert({
                        company_id: company.id,
                        document_type: category,
                        document_name: file.name,
                        file_url: publicUrl,
                        file_size: file.metadata?.size || 0,
                        mime_type: mimeType,
                        uploaded_by: profile.id,
                        metadata: { migrated: true, original_upload_date: file.created_at }
                    });

                if (insertError) {
                    result.errors.push(`Error al migrar ${file.name}: ${insertError.message}`);
                    result.details.push({
                        fileName: file.name,
                        category,
                        status: 'error',
                        reason: insertError.message
                    });
                    console.error(`  ❌ Error: ${file.name}`, insertError);
                } else {
                    result.migrated++;
                    result.details.push({
                        fileName: file.name,
                        category,
                        status: 'migrated'
                    });
                    console.log(`  ✅ Migrated: ${file.name}`);
                }
            }
        }

        result.success = result.migrated > 0 || (result.processed > 0 && result.errors.length === 0);
        console.log("📊 Migration complete:", {
            processed: result.processed,
            migrated: result.migrated,
            skipped: result.skipped,
            errors: result.errors.length
        });

    } catch (error) {
        console.error("❌ Migration failed:", error);
        result.errors.push(error instanceof Error ? error.message : "Error desconocido");
    }

    return result;
}
