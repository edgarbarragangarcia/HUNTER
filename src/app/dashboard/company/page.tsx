import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CompanyForm from "./company-form";

export default async function CompanyProfilePage() {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Get user's profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

    // Get company data if exists
    const { data: company } = await supabase
        .from("companies")
        .select("*")
        .eq("profile_id", profile?.id)
        .single();

    return <CompanyForm company={company} />;
}
