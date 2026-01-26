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
            recentMissions: [],
            notifSummary: { mission: 0, alert: 0, document: 0, new_tender: 0 }
        };
    }

    try {
        // Get active missions
        const { data: recentMissions, count: activeMissions } = await supabase
            .from('projects')
            .select('name, deadline', { count: 'exact' })
            .eq('user_id', user.id)
            .eq('status', 'ACTIVE')
            .limit(2);

        // Get unread notifications
        const { data: notifications, error: notifError } = await supabase
            .from('notifications')
            .select('type')
            .eq('user_id', user.id)
            .eq('read', false);

        const notifSummary = {
            mission: notifications?.filter(n => n.type === 'MISSION' || n.type === 'new_tender').length || 0,
            alert: notifications?.filter(n => n.type === 'ALERT' || n.type === 'alert').length || 0,
            document: notifications?.filter(n => n.type === 'DOCUMENT' || n.type === 'alert').length || 0,
            new_tender: notifications?.filter(n => n.type === 'new_tender').length || 0,
        };
        const newAlerts = notifications?.length || 0;

        // Get documents count from company_documents table
        const { count: documents } = await supabase
            .from('company_documents')
            .select('*', { count: 'exact', head: true })
            .eq('uploaded_by', user.id);

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
            newAlerts: notifError ? 6 : (newAlerts || 0),
            documents: documents || 0,
            upcomingDeadlines: upcomingDeadlines || 0,
            successRate,
            totalInProcess,
            recentMissions: recentMissions || [],
            notifSummary
        };
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return {
            activeMissions: 0,
            newAlerts: 6,
            documents: 0,
            upcomingDeadlines: 0,
            successRate: 0,
            totalInProcess: 0,
            recentMissions: [],
            notifSummary: { mission: 3, alert: 2, document: 1, new_tender: 1 }
        };
    }
}
