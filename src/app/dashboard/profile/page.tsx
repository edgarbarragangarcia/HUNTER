import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileForm from "./profile-form";

export default async function ProfilePage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Get user's profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .limit(1)
        .single();

    return (
        <ProfileForm
            user={{
                id: user.id,
                email: user.email,
                created_at: user.created_at
            }}
            profile={profile}
        />
    );
}
