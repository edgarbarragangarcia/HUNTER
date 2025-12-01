'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function saveCompanyInfo(formData: FormData) {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("No authenticated user");
    }

    // Get user's profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

    if (!profile) {
        throw new Error("Profile not found");
    }

    // Prepare company data
    const companyData: any = {
        profile_id: profile.id,
        updated_at: new Date().toISOString(),
    };

    // Only add fields if they are present in formData to allow partial updates
    const fields = [
        "company_name", "nit", "legal_representative", "economic_sector",
        "phone", "address", "city", "department", "country"
    ];

    fields.forEach(field => {
        const value = formData.get(field);
        if (value !== null) {
            companyData[field] = value;
        }
    });

    // Handle JSON fields
    if (formData.get("unspsc_codes")) {
        companyData.unspsc_codes = JSON.parse(formData.get("unspsc_codes") as string);
    }
    if (formData.get("financial_indicators")) {
        companyData.financial_indicators = JSON.parse(formData.get("financial_indicators") as string);
    }
    if (formData.get("experience_summary")) {
        companyData.experience_summary = JSON.parse(formData.get("experience_summary") as string);
    }

    // Check if company already exists for this profile
    const { data: existingCompany } = await supabase
        .from("companies")
        .select("id")
        .eq("profile_id", profile.id)
        .single();

    let error;

    if (existingCompany) {
        // Update existing company
        const result = await supabase
            .from("companies")
            .update(companyData)
            .eq("id", existingCompany.id);
        error = result.error;
    } else {
        // Create new company
        const result = await supabase
            .from("companies")
            .insert(companyData);
        error = result.error;
    }

    if (error) {
        console.error("Error saving company:", error);
        throw new Error(error.message);
    }

    revalidatePath("/dashboard/company");
}

export async function saveFinancials(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("No authenticated user");

    const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

    if (!profile) throw new Error("Profile not found");

    const financialData: any = {
        updated_at: new Date().toISOString(),
    };

    if (formData.get("financial_indicators")) {
        financialData.financial_indicators = JSON.parse(formData.get("financial_indicators") as string);
    }

    // Also allow saving UNSPSC codes here if needed
    if (formData.get("unspsc_codes")) {
        financialData.unspsc_codes = JSON.parse(formData.get("unspsc_codes") as string);
    }

    // NOTE: experience_summary is now auto-calculated by database triggers
    // based on company_contracts table, so we no longer accept manual input


    const { data: existingCompany } = await supabase
        .from("companies")
        .select("id")
        .eq("profile_id", profile.id)
        .single();

    if (existingCompany) {
        const { error } = await supabase
            .from("companies")
            .update(financialData)
            .eq("id", existingCompany.id);

        if (error) throw new Error(error.message);
    } else {
        // Company profile must exist with basic info before saving financial data
        throw new Error("Debes completar primero la información básica de tu empresa (Nombre, NIT, Representante Legal) antes de guardar los indicadores financieros.");
    }

    revalidatePath("/dashboard/company");
}

// ==================== CONTRACT MANAGEMENT ====================

export async function saveContract(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("No authenticated user");

    // Get user's profile and company
    const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

    if (!profile) throw new Error("Profile not found");

    const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("profile_id", profile.id)
        .single();

    if (!company) {
        throw new Error("Empresa no encontrada. Por favor completa primero la información de tu empresa.");
    }

    const contractId = formData.get("contract_id") as string | null;
    const contractData: any = {
        company_id: company.id,
        contract_number: formData.get("contract_number"),
        client_name: formData.get("client_name"),
        contract_value: parseFloat(formData.get("contract_value") as string),
        contract_value_smmlv: parseFloat(formData.get("contract_value_smmlv") as string) || null,
        execution_date: formData.get("execution_date") || null,
        description: formData.get("description") || null,
        updated_at: new Date().toISOString(),
    };

    // Parse UNSPSC codes if provided
    const unspscCodesStr = formData.get("unspsc_codes") as string;
    if (unspscCodesStr) {
        contractData.unspsc_codes = unspscCodesStr
            .split(',')
            .map(code => code.trim())
            .filter(code => code);
    }

    // Handle document upload if file is present
    const file = formData.get("document") as File | null;
    if (file && file.size > 0) {
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `${user.id}/contracts/${Date.now()}_${sanitizedName}`;

        const { error: uploadError } = await supabase
            .storage
            .from('company-documents')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            throw new Error(`Error al subir documento: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase
            .storage
            .from('company-documents')
            .getPublicUrl(filePath);

        contractData.document_url = publicUrl;
        contractData.document_name = file.name;
    }

    // Update or insert contract
    if (contractId) {
        // Update existing contract
        const { error } = await supabase
            .from("company_contracts")
            .update(contractData)
            .eq("id", contractId);

        if (error) throw new Error(error.message);
    } else {
        // Insert new contract
        const { error } = await supabase
            .from("company_contracts")
            .insert(contractData);

        if (error) throw new Error(error.message);
    }

    revalidatePath("/dashboard/company");
    return { success: true };
}

export async function listCompanyContracts() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    // Get user's profile and company
    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!profile) return [];

    const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

    if (!company) return [];

    // Fetch all contracts for this company
    const { data: contracts, error } = await supabase
        .from('company_contracts')
        .select('*')
        .eq('company_id', company.id)
        .order('execution_date', { ascending: false });

    if (error) {
        console.error("Error fetching contracts:", error);
        return [];
    }

    return contracts || [];
}

export async function deleteContract(contractId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Usuario no autenticado");

    // Get contract info to find document URL
    const { data: contract, error: fetchError } = await supabase
        .from('company_contracts')
        .select('*')
        .eq('id', contractId)
        .single();

    if (fetchError || !contract) {
        throw new Error("Contrato no encontrado");
    }

    // Delete document from storage if it exists
    if (contract.document_url) {
        const urlParts = contract.document_url.split('/company-documents/');
        if (urlParts.length === 2) {
            const storagePath = urlParts[1];
            await supabase
                .storage
                .from('company-documents')
                .remove([storagePath]);
        }
    }

    // Delete contract from database
    const { error: deleteError } = await supabase
        .from('company_contracts')
        .delete()
        .eq('id', contractId);

    if (deleteError) {
        throw new Error(`Error al eliminar contrato: ${deleteError.message}`);
    }

    revalidatePath("/dashboard/company");
    return { success: true };
}

// ==================== END CONTRACT MANAGEMENT ====================


import { generateDocumentSummary as generateSummaryService, generateCompanyAnalysisReport, extractTextFromDocument } from "@/lib/ai-processor";

export async function generateDocumentSummary(fileBase64: string | null, mimeType: string, category: string, storagePath?: string, dbId?: string) {
    return await generateSummaryService(fileBase64, mimeType, category, storagePath, dbId);
}

export async function uploadCompanyDocument(formData: FormData) {
    const supabase = await createClient();

    // 1. Authenticate user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error("Usuario no autenticado");
    }

    const file = formData.get('file') as File;
    const category = formData.get('category') as string;

    if (!file || !category) {
        throw new Error("Faltan datos requeridos (archivo o categoría)");
    }

    // 2. Get user's profile and company
    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!profile) {
        throw new Error("Perfil no encontrado");
    }

    const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

    if (!company) {
        throw new Error("Empresa no encontrada. Por favor completa primero la información de tu empresa.");
    }

    // 3. Define path: user_id/category/filename
    // Sanitize filename to avoid issues
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${user.id}/${category}/${Date.now()}_${sanitizedName}`;

    // 4. Upload to Supabase Storage
    const { data, error } = await supabase
        .storage
        .from('company-documents')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) {
        console.error("Error uploading to storage:", error);
        throw new Error(`Error al subir archivo: ${error.message}`);
    }

    // 5. Get Public URL
    const { data: { publicUrl } } = supabase
        .storage
        .from('company-documents')
        .getPublicUrl(filePath);

    // 6. Save metadata to database using correct schema
    const { data: dbRecord, error: dbError } = await supabase
        .from('company_documents')
        .insert({
            company_id: company.id,
            document_type: category, // 'legal', 'financial', 'technical'
            document_name: file.name,
            file_url: publicUrl,
            file_size: file.size,
            mime_type: file.type,
            uploaded_by: profile.id,
            metadata: {} // Will be updated with summary after AI generation
        })
        .select()
        .single();

    if (dbError) {
        console.error("Error saving to database:", dbError);
        throw new Error(`Error al guardar en base de datos: ${dbError.message}`);
    }

    return {
        success: true,
        url: publicUrl,
        path: filePath,
        name: file.name,
        size: file.size,
        dbId: dbRecord?.id // Return DB ID for later summary update
    };
}

export async function listCompanyDocuments() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { legal: [], financial: [], technical: [] };

    // Get user's profile and company
    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!profile) {
        console.warn("No profile found for user");
        return { legal: [], financial: [], technical: [] };
    }

    const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

    if (!company) {
        console.warn("No company found for profile");
        return { legal: [], financial: [], technical: [] };
    }

    // Query database for company's documents using correct schema
    const { data: documents, error } = await supabase
        .from('company_documents')
        .select('*')
        .eq('company_id', company.id)
        .order('uploaded_at', { ascending: false });

    if (error) {
        console.error("Error fetching documents:", error);
        return { legal: [], financial: [], technical: [] };
    }

    // Group by category
    const results: Record<string, any[]> = { legal: [], financial: [], technical: [] };

    if (documents) {
        documents.forEach(doc => {
            // Use file_url directly from the database (it's already the public URL)
            results[doc.document_type]?.push({
                id: doc.id,
                name: doc.document_name,
                size: doc.file_size,
                uploadDate: new Date(doc.uploaded_at),
                status: 'completed',
                progress: 100,
                url: doc.file_url,
                summary: doc.metadata?.summary || "Procesando..."
            });
        });
    }

    return results;
}

export async function deleteCompanyDocument(documentId: string) {
    const supabase = await createClient();

    // 1. Authenticate user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error("Usuario no autenticado");
    }

    // 2. Get document info to find storage path
    const { data: document, error: fetchError } = await supabase
        .from('company_documents')
        .select('*')
        .eq('id', documentId)
        .single();

    if (fetchError || !document) {
        throw new Error("Documento no encontrado");
    }

    // 3. Delete from Storage
    // Extract path from URL or use stored path if we had it. 
    // Since we store publicUrl, we need to extract the path relative to bucket
    // URL format: .../storage/v1/object/public/company-documents/user_id/category/filename
    const urlParts = document.file_url.split('/company-documents/');
    if (urlParts.length === 2) {
        const storagePath = urlParts[1];
        const { error: storageError } = await supabase
            .storage
            .from('company-documents')
            .remove([storagePath]);

        if (storageError) {
            console.error("Error deleting from storage:", storageError);
            // Continue to delete from DB even if storage delete fails
        }
    }

    // 4. Delete from Database
    const { error: deleteError } = await supabase
        .from('company_documents')
        .delete()
        .eq('id', documentId);

    if (deleteError) {
        throw new Error(`Error al eliminar de base de datos: ${deleteError.message}`);
    }

    return { success: true };
}

// ==================== AI COMPANY ANALYSIS ====================

export async function generateCompanyAnalysis() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Usuario no autenticado");

    // 1. Fetch Company Data
    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!profile) throw new Error("Perfil no encontrado");

    const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('profile_id', profile.id)
        .single();

    if (!company) throw new Error("Empresa no encontrada");

    // 2. Fetch Contracts
    const { data: contracts } = await supabase
        .from('company_contracts')
        .select('*')
        .eq('company_id', company.id);

    // 3. Fetch Documents
    const { data: documents } = await supabase
        .from('company_documents')
        .select('*')
        .eq('company_id', company.id);

    // 4. Process Documents (Extract Text)
    let documentsText = "";
    if (documents && documents.length > 0) {
        console.log(`Processing ${documents.length} documents for analysis...`);

        for (const doc of documents) {
            try {
                const urlParts = doc.file_url.split('/company-documents/');
                if (urlParts.length !== 2) continue;

                const storagePath = urlParts[1];
                const textContent = await extractTextFromDocument('company-documents', storagePath, doc.mime_type);

                // Truncate if too long
                documentsText += `\n--- DOCUMENTO: ${doc.document_name} (${doc.document_type}) ---\n${textContent.substring(0, 50000)}\n`;

            } catch (err) {
                console.error(`Error processing document ${doc.document_name}:`, err);
            }
        }
    }

    // 5. Generate Report using AI Service
    return await generateCompanyAnalysisReport(company, contracts || [], documentsText);
}
