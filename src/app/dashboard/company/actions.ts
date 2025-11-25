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

export async function generateDocumentSummary(fileBase64: string, mimeType: string, category: string) {
    try {
        // 1. Extract text from PDF first (more reliable than vision for docs)
        let textContent = "";
        if (mimeType === "application/pdf") {
            const buffer = Buffer.from(fileBase64, 'base64');
            const data = await pdf(buffer);
            textContent = data.text.slice(0, 2000); // Limit context
        } else {
            // For images, we can't easily extract text server-side without OCR
            // So we'll skip to fallback if it's an image for now, or try vision if available
            return { summary: "Documento de imagen recibido. Análisis visual no disponible en este momento." };
        }

        // 2. Try Gemini Pro (Text only) - Much more stable
        try {
            const apiKey = process.env.GEMINI_API_KEY;
            if (apiKey) {
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: "gemini-pro" });

                let prompt = "";
                switch (category) {
                    case 'legal':
                        prompt = `Resume este documento legal en 30 palabras: ${textContent}`;
                        break;
                    case 'financial':
                        prompt = `Resume este documento financiero en 30 palabras: ${textContent}`;
                        break;
                    case 'technical':
                        prompt = `Resume este documento técnico en 30 palabras: ${textContent}`;
                        break;
                    default:
                        prompt = `Resume este documento en 30 palabras: ${textContent}`;
                }

                const result = await model.generateContent(prompt);
                const response = await result.response;
                const summary = response.text();
                if (summary) return { summary };
            }
        } catch (aiError) {
            console.error("AI Generation failed, falling back to extraction:", aiError);
        }

        // 3. Fallback: Return extracted text preview if AI fails
        const cleanText = textContent.replace(/\s+/g, ' ').trim().slice(0, 150);
        return { summary: `Vista previa: ${cleanText}...` };

    } catch (error) {
        console.error("Error processing document:", error);
        return { error: "No se pudo leer el documento." };
    }
}
