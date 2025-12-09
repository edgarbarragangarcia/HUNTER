'use server';

import { createClient } from "@/lib/supabase/server";

export async function getUpcomingEvents() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { urgent: [], all: [] };

    const now = new Date();
    const twoDaysFromNow = new Date(now.getTime() + (2 * 24 * 60 * 60 * 1000));
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

    // Get urgent events (next 2 days)
    const { data: urgentEvents } = await supabase
        .from('project_events')
        .select(`
            *,
            project:projects(id, name)
        `)
        .eq('user_id', user.id)
        .gte('event_date', now.toISOString())
        .lte('event_date', twoDaysFromNow.toISOString())
        .order('event_date');

    // Get all upcoming events (next 30 days)
    const { data: allEvents } = await supabase
        .from('project_events')
        .select(`
            *,
            project:projects(id, name)
        `)
        .eq('user_id', user.id)
        .gte('event_date', now.toISOString())
        .lte('event_date', thirtyDaysFromNow.toISOString())
        .order('event_date');

    return {
        urgent: urgentEvents || getDemoUrgentEvents(),
        all: allEvents || getDemoEvents(),
    };
}

export async function getAllEvents() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data } = await supabase
        .from('project_events')
        .select(`
            *,
            project:projects(id, name)
        `)
        .eq('user_id', user.id)
        .order('event_date');

    return data || getDemoEvents();
}

// Demo data
function getDemoUrgentEvents() {
    const now = new Date();
    return [
        {
            id: '1',
            project_id: '1',
            user_id: 'demo',
            event_type: 'proposal_deadline',
            title: 'Cierre de Propuestas - Construcción Puente Vehicular',
            description: 'Fecha límite para presentar propuesta técnica y económica',
            event_date: new Date(now.getTime() + (1 * 24 * 60 * 60 * 1000)).toISOString(),
            reminder_sent: false,
            project: { id: '1', name: 'Licitación Puente Vehicular INVÍAS' }
        },
        {
            id: '2',
            project_id: '2',
            user_id: 'demo',
            event_type: 'question_deadline',
            title: 'Cierre de Preguntas - Suministro Equipos',
            description: 'Última fecha para enviar preguntas y solicitar aclaraciones',
            event_date: new Date(now.getTime() + (2 * 24 * 60 * 60 * 1000)).toISOString(),
            reminder_sent: false,
            project: { id: '2', name: 'Suministro Equipos de Cómputo - MinEducación' }
        }
    ];
}

function getDemoEvents() {
    const now = new Date();
    return [
        ...getDemoUrgentEvents(),
        {
            id: '3',
            project_id: '1',
            user_id: 'demo',
            event_type: 'opening_event',
            title: 'Apertura de Sobres',
            description: 'Apertura pública de propuestas presentadas',
            event_date: new Date(now.getTime() + (5 * 24 * 60 * 60 * 1000)).toISOString(),
            reminder_sent: false,
            project: { id: '1', name: 'Licitación Puente Vehicular INVÍAS' }
        },
        {
            id: '4',
            project_id: '2',
            user_id: 'demo',
            event_type: 'answer_release',
            title: 'Publicación de Respuestas',
            description: 'La entidad publicará respuestas a las preguntas recibidas',
            event_date: new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)).toISOString(),
            reminder_sent: false,
            project: { id: '2', name: 'Suministro Equipos de Cómputo - MinEducación' }
        },
        {
            id: '5',
            project_id: '3',
            user_id: 'demo',
            event_type: 'adjudication',
            title: 'Fecha Estimada de Adjudicación',
            description: 'Publicación del informe de evaluación y adjudicación',
            event_date: new Date(now.getTime() + (15 * 24 * 60 * 60 * 1000)).toISOString(),
            reminder_sent: false,
            project: { id: '3', name: 'Mantenimiento Vial - Cundinamarca' }
        },
        {
            id: '6',
            project_id: '1',
            user_id: 'demo',
            event_type: 'contract_signing',
            title: 'Firma de Contrato',
            description: 'Firma del contrato con el adjudicatario',
            event_date: new Date(now.getTime() + (25 * 24 * 60 * 60 * 1000)).toISOString(),
            reminder_sent: false,
            project: { id: '1', name: 'Licitación Puente Vehicular INVÍAS' }
        }
    ];
}
