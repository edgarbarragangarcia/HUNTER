'use server'

import { createClient } from "@/lib/supabase/server";

/**
 * Debug function to check company_documents table for a specific user
 */
export async function checkCompanyDocuments() {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    console.log("🔍 Current user:", user?.id);

    if (!user) {
        return { error: "No authenticated user" };
    }

    // Get profile
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

    console.log("👤 Profile:", profile, profileError);

    if (!profile) {
        return { error: "No profile found", profileError };
    }

    // Get company
    const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('profile_id', profile.id)
        .single();

    console.log("🏢 Company:", company, companyError);

    if (!company) {
        return { error: "No company found", companyError };
    }

    // Check company_documents table
    const { data: documents, error: docsError } = await supabase
        .from('company_documents')
        .select('*')
        .eq('company_id', company.id);

    console.log("📄 Documents in DB:", documents, docsError);

    // List files in Storage
    const { data: storageFiles, error: storageError } = await supabase
        .storage
        .from('company-documents')
        .list(`${user.id}/legal`);

    console.log("💾 Files in Storage (legal):", storageFiles, storageError);

    return {
        user: user.id,
        profile: profile.id,
        company: company.id,
        documentsInDB: documents?.length || 0,
        filesInStorage: storageFiles?.length || 0,
        documents,
        storageFiles
    };
}
