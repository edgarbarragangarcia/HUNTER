'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: "No se pudo autenticar al usuario" };
    }

    const fullName = formData.get("full_name") as string;

    if (!fullName || fullName.trim() === "") {
        return { success: false, error: "El nombre completo es requerido" };
    }

    // Update profile in database
    const { error } = await supabase
        .from("profiles")
        .update({
            full_name: fullName.trim(),
            updated_at: new Date().toISOString()
        })
        .eq("user_id", user.id);

    if (error) {
        console.error("Error updating profile:", error);
        return { success: false, error: "Error al actualizar el perfil: " + error.message };
    }

    // Revalidate the profile page to show updated data
    revalidatePath("/dashboard/profile");

    return { success: true };
}
