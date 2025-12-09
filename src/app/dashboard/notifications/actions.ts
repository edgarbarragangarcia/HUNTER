'use server';

import { createClient } from "@/lib/supabase/server";

export interface Notification {
    id: string;
    user_id: string;
    type: 'new_tender' | 'deadline' | 'market_change' | 'alert';
    title: string;
    message: string;
    read: boolean;
    action_url?: string;
    created_at: string;
}

export async function getNotifications(): Promise<Notification[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    // Query notifications from database
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Error fetching notifications:', error);
        // Return demo data for now
        return getDemoNotifications();
    }

    return data || getDemoNotifications();
}

export async function getAlertSettings() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { monitoredEntities: 0 };

    // Get count of monitored entities
    const { count } = await supabase
        .from('monitored_entities')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

    return {
        monitoredEntities: count || 0,
    };
}

export async function markAsRead(notificationId: string) {
    const supabase = await createClient();
    
    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

    if (error) {
        console.error('Error marking notification as read:', error);
        return { success: false };
    }

    return { success: true };
}

export async function markAllAsRead() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false };

    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

    if (error) {
        console.error('Error marking all as read:', error);
        return { success: false };
    }

    return { success: true };
}

// Demo data for development
function getDemoNotifications(): Notification[] {
    return [
        {
            id: '1',
            user_id: 'demo',
            type: 'new_tender',
            title: 'Nueva licitación disponible',
            message: 'Ministerio de Educación publicó "Suministro de equipos de cómputo" - $450M - Compatible con tus códigos UNSPSC',
            read: false,
            action_url: '/dashboard/shot/market-analysis',
            created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
        },
        {
            id: '2',
            user_id: 'demo',
            type: 'deadline',
            title: 'Fecha límite próxima - 48 horas',
            message: 'La licitación "Construcción de puente vehicular" cierra en 2 días. Asegúrate de presentar tu propuesta a tiempo.',
            read: false,
            action_url: '/dashboard/missions',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        },
        {
            id: '3',
            user_id: 'demo',
            type: 'market_change',
            title: 'Nuevo competidor detectado',
            message: 'CONSTRUCTORA LÍDERES S.A.S ha ganado 3 licitaciones en tu sector este mes. Revisa su perfil.',
            read: false,
            action_url: '/dashboard/shot/ranking',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
        },
        {
            id: '4',
            user_id: 'demo',
            type: 'alert',
            title: 'Cambio en pliego de condiciones',
            message: 'La entidad INVÍAS modificó requisitos técnicos. Revisa la adenda publicada.',
            read: false,
            action_url: '/dashboard/missions/1',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
        },
        {
            id: '5',
            user_id: 'demo',
            type: 'new_tender',
            title: 'Licitación de alta probabilidad',
            message: 'IA detectó oportunidad con 87% de compatibilidad: "Servicios de mantenimiento vial" - $890M',
            read: true,
            action_url: '/dashboard/shot/predictions',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        },
        {
            id: '6',
            user_id: 'demo',
            type: 'deadline',
            title: 'Respuesta a pregunta publicada',
            message: 'La entidad respondió tus preguntas sobre la licitación "Mejoramiento de vías terciarias".',
            read: true,
            action_url: '/dashboard/missions/2',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), // 1.5 days ago
        },
    ];
}
