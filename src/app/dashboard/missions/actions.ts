'use server'

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getProjects() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

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

    const { data, error } = await supabase
        .from('projects')
        .select(`
            *,
            tender:tender_id (
                title,
                amount,
                entity_name
            )
        `)
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching projects:", error);
        return [];
    }

    return data.map((project: any) => ({
        id: project.id,
        name: project.name,
        description: project.description,
        methodology: project.methodology,
        status: project.status,
        progress: project.progress,
        tenderTitle: project.tender?.title,
        entity: project.tender?.entity_name,
        amount: project.tender?.amount,
        deadline: project.deadline_date
    }));
}

export async function createProject(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

    const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('profile_id', profile!.id)
        .single();

    const name = formData.get('name') as string;
    const methodology = formData.get('methodology') as string;
    const tenderId = formData.get('tenderId') as string;

    // Validate UUID format (simple check)
    const isValidUUID = (str: string) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(str);
    };

    const validTenderId = tenderId && isValidUUID(tenderId) ? tenderId : null;

    const { data, error } = await supabase
        .from('projects')
        .insert({
            company_id: company!.id,
            name,
            methodology,
            tender_id: validTenderId,
            status: 'ACTIVE',
            progress: 0
        })
        .select()
        .single();

    if (error) throw new Error(error.message);

    redirect(`/dashboard/missions/${data.id}`);
}
