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

export async function generateDocumentSummary(fileBase64: string, mimeType: string, category: string) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("GEMINI_API_KEY is not set");
            return { error: "Configuración de IA no encontrada." };
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        let prompt = "";
        switch (category) {
            case 'legal':
                prompt = "Analiza este documento legal y genera un resumen ejecutivo muy breve (máximo 40 palabras) destacando su validez, propósito y fechas clave. Responde en español y sé directo.";
                break;
            case 'financial':
                prompt = "Analiza este documento financiero y genera un resumen ejecutivo muy breve (máximo 40 palabras) destacando cifras clave y salud financiera. Responde en español y sé directo.";
                break;
            case 'technical':
                prompt = "Analiza este documento técnico y genera un resumen ejecutivo muy breve (máximo 40 palabras) destacando la experiencia o capacidad técnica demostrada. Responde en español y sé directo.";
                break;
            default:
                prompt = "Analiza este documento y genera un resumen muy breve (máximo 40 palabras). Responde en español.";
        }

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: fileBase64,
                    mimeType: mimeType
                }
            }
        ]);

        const response = await result.response;
        const text = response.text();
        return { summary: text };
    } catch (error) {
        console.error("Error generating summary:", error);
        return { error: "No se pudo analizar el documento." };
    }
}
