'use server';

import { createClient } from "@/lib/supabase/server";

export async function getDashboardStats() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return {
            activeMissions: 0,
            newAlerts: 0,
            documents: 0,
            upcomingDeadlines: 0,
            successRate: 0,
            totalInProcess: 0,
        };
    }

    try {
        // Get active missions
        const { count: activeMissions } = await supabase
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', 'ACTIVE');

        // Get unread notifications (use demo value if table doesn't exist)
        const { count: newAlerts, error: notifError } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('read', false);

        // Get documents from profiles table (documents column)
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

        // Count documents - for now use 0, will be updated when company documents are uploaded
        const documents = 0;

        // Get upcoming deadlines (missions with deadline in next 7 days)
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

        const { count: upcomingDeadlines } = await supabase
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', 'ACTIVE')
            .lte('deadline', sevenDaysFromNow.toISOString());

        // Calculate success rate (won / total completed)
        const { data: completedProjects } = await supabase
            .from('projects')
            .select('status')
            .eq('user_id', user.id)
            .in('status', ['WON', 'LOST']);

        const totalCompleted = completedProjects?.length || 0;
        const won = completedProjects?.filter(p => p.status === 'WON').length || 0;
        const successRate = totalCompleted > 0 ? Math.round((won / totalCompleted) * 100) : 0;

        // Total value in active projects
        const { data: activeProjects } = await supabase
            .from('projects')
            .select('tender:tender_id(amount)')
            .eq('user_id', user.id)
            .eq('status', 'ACTIVE');

        const totalInProcess = activeProjects?.reduce((sum, project) => {
            const tender = project.tender as unknown as { amount: number } | null;
            return sum + (tender?.amount || 0);
        }, 0) || 0;

        return {
            activeMissions: activeMissions || 0,
            newAlerts: notifError ? 6 : (newAlerts || 0), // Demo data if table doesn't exist
            documents: documents || 0,
            upcomingDeadlines: upcomingDeadlines || 0,
            successRate,
            totalInProcess,
        };
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        // Return demo data on error
        return {
            activeMissions: 0,
            newAlerts: 6,
            documents: 0,
            upcomingDeadlines: 0,
            successRate: 0,
            totalInProcess: 0,
        };
    }
}
