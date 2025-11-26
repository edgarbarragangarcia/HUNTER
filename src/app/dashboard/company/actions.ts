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
    const companyData = {
        profile_id: profile.id,
        company_name: formData.get("company_name") as string,
        nit: formData.get("nit") as string,
        legal_representative: formData.get("legal_representative") as string,
        economic_sector: formData.get("economic_sector") as string,
        phone: formData.get("phone") as string || null,
        address: formData.get("address") as string || null,
        city: formData.get("city") as string || null,
        department: formData.get("department") as string || null,
        country: formData.get("country") as string || "Colombia",
        updated_at: new Date().toISOString(),
    };

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

import { GoogleGenerativeAI } from "@google/generative-ai";

// Polyfill DOMMatrix for pdf-parse dependency
if (typeof DOMMatrix === 'undefined') {
    (global as any).DOMMatrix = class DOMMatrix { };
}
const pdf = require('pdf-parse');

export async function generateDocumentSummary(fileBase64: string | null, mimeType: string, category: string, storagePath?: string, dbId?: string) {
    try {
        let processingBase64 = fileBase64;

        // If we have a storage path, download the file from Supabase first
        // This avoids sending large base64 strings from client to server
        if (storagePath && !processingBase64) {
            const supabase = await createClient();
            const { data, error } = await supabase.storage
                .from('company-documents')
                .download(storagePath);

            if (error || !data) {
                console.error("Error downloading from storage:", error);
                return { summary: "Error al recuperar el documento del almacenamiento.", summaryType: 'excerpt' };
            }

            // Convert Blob/File to Buffer then Base64
            const arrayBuffer = await data.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            processingBase64 = buffer.toString('base64');
        }

        if (!processingBase64) {
            return { summary: "No se pudo procesar el contenido del documento.", summaryType: 'excerpt' };
        }

        const apiKey = process.env.GEMINI_API_KEY;
        console.log("DEBUG: API Key present?", !!apiKey);

        // 1. Try Gemini 2.5 Flash Lite (Native PDF/Image Support) - Best option
        if (apiKey) {
            try {
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

                let prompt = "";
                switch (category) {
                    case 'legal':
                        prompt = "Analiza este documento legal y genera un resumen ejecutivo en español de máximo 40 palabras. Identifica el tipo de documento y su validez.";
                        break;
                    case 'financial':
                        prompt = "Analiza este documento financiero y genera un resumen ejecutivo en español de máximo 40 palabras. Extrae las cifras más relevantes si existen.";
                        break;
                    case 'technical':
                        prompt = "Analiza este documento técnico y genera un resumen ejecutivo en español de máximo 40 palabras. Destaca la experiencia o capacidad técnica descrita.";
                        break;
                    default:
                        prompt = "Resume este documento en español en máximo 40 palabras, destacando la información más relevante.";
                }

                const result = await model.generateContent([
                    prompt,
                    {
                        inlineData: {
                            data: processingBase64,
                            mimeType: mimeType
                        }
                    }
                ]);

                const response = await result.response;
                const summary = response.text();

                if (summary && summary.trim().length > 0) {
                    console.log("✅ AI Summary generated successfully with Gemini 2.5 Flash Lite");

                    // Save summary to database metadata if dbId is provided
                    if (dbId) {
                        const supabase = await createClient();
                        await supabase
                            .from('company_documents')
                            .update({ metadata: { summary: summary.trim() } })
                            .eq('id', dbId);
                    }

                    return { summary: summary.trim(), summaryType: 'ai' };
                }
            } catch (aiError) {
                console.error("⚠️ AI Generation failed:", aiError);
            }
        } else {
            console.warn("⚠️ GEMINI_API_KEY not configured");
        }

        // 2. Fallback: Local Text Extraction (if AI fails or no key)
        if (mimeType === "application/pdf" && processingBase64) {
            try {
                const buffer = Buffer.from(processingBase64, 'base64');
                const data = await pdf(buffer);
                const textContent = data.text || "";

                if (textContent.trim().length > 10) {
                    const lines = textContent.split('\n')
                        .map((line: string) => line.trim())
                        .filter((line: string) => line.length > 10);

                    const meaningfulText = lines.slice(0, 5).join(' ');
                    const cleanText = meaningfulText.replace(/\s+/g, ' ').trim();

                    const preview = cleanText.length > 150
                        ? cleanText.slice(0, 150) + '...'
                        : cleanText;

                    // Save fallback summary to database metadata
                    if (dbId) {
                        const supabase = await createClient();
                        await supabase
                            .from('company_documents')
                            .update({ metadata: { summary: preview } })
                            .eq('id', dbId);
                    }

                    return {
                        summary: preview,
                        summaryType: 'excerpt'
                    };
                }
            } catch (pdfError) {
                console.error("Error extracting PDF text locally:", pdfError);
            }
        }

        // 3. Final Fallback
        const fallbackSummary = "Documento recibido. El contenido será analizado por nuestro equipo.";

        if (dbId) {
            const supabase = await createClient();
            await supabase
                .from('company_documents')
                .update({ metadata: { summary: fallbackSummary } })
                .eq('id', dbId);
        }

        return {
            summary: fallbackSummary,
            summaryType: 'excerpt'
        };

    } catch (error) {
        console.error("❌ Critical error processing document:", error);
        return {
            summary: "Documento recibido correctamente.",
            summaryType: 'excerpt'
        };
    }
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

