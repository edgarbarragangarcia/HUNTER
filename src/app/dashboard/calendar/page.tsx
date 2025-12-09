import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, Clock, AlertCircle, Plus, CheckCircle2 } from "lucide-react";
import { getUpcomingEvents, getAllEvents } from "./actions";
import Link from "next/link";

export default async function CalendarPage() {
    const upcomingEvents = await getUpcomingEvents();
    const allEvents = await getAllEvents();

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <CalendarIcon className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold tracking-tight">Calendario de Eventos</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Fechas críticas de tus misiones y licitaciones
                    </p>
                </div>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nuevo Evento
                </Button>
            </div>

            {/* Upcoming Deadlines Alert */}
            {upcomingEvents.urgent.length > 0 && (
                <Card className="border-red-500/50 bg-red-500/5">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                            <div className="p-2 rounded-lg bg-red-500/10">
                                <AlertCircle className="h-6 w-6 text-red-500" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-red-600 mb-2">
                                    ⚠️ {upcomingEvents.urgent.length} Fecha{upcomingEvents.urgent.length > 1 ? 's' : ''} Límite Próxima{upcomingEvents.urgent.length > 1 ? 's' : ''}
                                </h3>
                                <div className="space-y-2">
                                    {upcomingEvents.urgent.map((event) => (
                                        <div key={event.id} className="text-sm">
                                            <Link
                                                href={`/dashboard/missions/${event.project_id}`}
                                                className="font-medium hover:underline"
                                            >
                                                {event.title}
                                            </Link>
                                            <span className="text-muted-foreground ml-2">
                                                {formatDate(event.event_date)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Tabs defaultValue="upcoming" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="upcoming">
                        Próximos Eventos ({upcomingEvents.all.length})
                    </TabsTrigger>
                    <TabsTrigger value="all">
                        Todos
                    </TabsTrigger>
                    <TabsTrigger value="by-mission">
                        Por Misión
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming" className="space-y-4">
                    <EventTimeline events={upcomingEvents.all} />
                </TabsContent>

                <TabsContent value="all" className="space-y-4">
                    <EventsGrid events={allEvents} />
                </TabsContent>

                <TabsContent value="by-mission" className="space-y-4">
                    <EventsByMission events={allEvents} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function EventTimeline({ events }: { events: any[] }) {
    if (events.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <CalendarIcon className="mx-auto h-12 w-12 opacity-20 mb-4" />
                <p>No hay eventos próximos</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {events.map((event, index) => {
                const daysUntil = getDaysUntil(event.event_date);
                const isUrgent = daysUntil <= 2;
                const isPast = daysUntil < 0;

                return (
                    <Card key={event.id} className={isUrgent && !isPast ? "border-red-500/30" : ""}>
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                {/* Timeline indicator */}
                                <div className="flex flex-col items-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isPast
                                        ? "bg-gray-500/10"
                                        : isUrgent
                                            ? "bg-red-500/10"
                                            : "bg-blue-500/10"
                                        }`}>
                                        {isPast ? (
                                            <CheckCircle2 className="h-5 w-5 text-gray-500" />
                                        ) : (
                                            <Clock className={`h-5 w-5 ${isUrgent ? "text-red-500" : "text-blue-500"}`} />
                                        )}
                                    </div>
                                    {index < events.length - 1 && (
                                        <div className="w-0.5 h-12 bg-border mt-2" />
                                    )}
                                </div>

                                {/* Event details */}
                                <div className="flex-1">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-foreground">
                                                    {event.title}
                                                </h3>
                                                <Badge variant="outline" className={getEventTypeBadge(event.event_type)}>
                                                    {getEventTypeLabel(event.event_type)}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-2">
                                                {event.description}
                                            </p>
                                            {event.project?.name && (
                                                <Link
                                                    href={`/dashboard/missions/${event.project_id}`}
                                                    className="text-sm text-primary hover:underline"
                                                >
                                                    📋 {event.project.name}
                                                </Link>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium">
                                                {formatDate(event.event_date)}
                                            </p>
                                            <p className={`text-xs ${isPast ? "text-gray-500" :
                                                isUrgent ? "text-red-500 font-medium" : "text-muted-foreground"
                                                }`}>
                                                {isPast ? "Pasado" :
                                                    daysUntil === 0 ? "¡Hoy!" :
                                                        daysUntil === 1 ? "¡Mañana!" :
                                                            `En ${daysUntil} días`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}

function EventsGrid({ events }: { events: any[] }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => (
                <Card key={event.id}>
                    <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                            <Badge variant="outline" className={getEventTypeBadge(event.event_type)}>
                                {getEventTypeLabel(event.event_type)}
                            </Badge>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        <CardDescription>{event.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm space-y-2">
                            <p className="font-medium">
                                📅 {formatDate(event.event_date)}
                            </p>
                            {event.project?.name && (
                                <Link
                                    href={`/dashboard/missions/${event.project_id}`}
                                    className="text-primary hover:underline block"
                                >
                                    📋 {event.project.name}
                                </Link>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function EventsByMission({ events }: { events: any[] }) {
    // Group events by project
    const eventsByProject = events.reduce((acc, event) => {
        const projectId = event.project_id;
        if (!acc[projectId]) {
            acc[projectId] = {
                project: event.project,
                events: []
            };
        }
        acc[projectId].events.push(event);
        return acc;
    }, {} as Record<string, { project: any; events: any[] }>);

    return (
        <div className="space-y-6">
            {(Object.values(eventsByProject) as { project: any; events: any[] }[]).map(({ project, events }) => (
                <Card key={project?.id || 'unknown'}>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <Link
                                href={`/dashboard/missions/${project?.id}`}
                                className="hover:text-primary transition-colors"
                            >
                                {project?.name || 'Sin misión asignada'}
                            </Link>
                            <Badge variant="secondary">{events.length} eventos</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {events.map((event: any) => (
                                <div key={event.id} className="flex items-center justify-between p-3 rounded-lg border">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className={getEventTypeBadge(event.event_type)}>
                                            {getEventTypeLabel(event.event_type)}
                                        </Badge>
                                        <span className="font-medium">{event.title}</span>
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                        {formatDate(event.event_date)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-CO', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(date);
}

function getDaysUntil(dateString: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(dateString);
    eventDate.setHours(0, 0, 0, 0);
    const diffTime = eventDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getEventTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        question_deadline: 'Cierre de Preguntas',
        answer_release: 'Publicación de Respuestas',
        proposal_deadline: 'Cierre de Propuestas',
        opening_event: 'Apertura de Sobres',
        adjudication: 'Adjudicación',
        contract_signing: 'Firma de Contrato',
        custom: 'Personalizado'
    };
    return labels[type] || type;
}

function getEventTypeBadge(type: string): string {
    const badges: Record<string, string> = {
        question_deadline: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
        answer_release: 'bg-green-500/10 text-green-600 border-green-500/20',
        proposal_deadline: 'bg-red-500/10 text-red-600 border-red-500/20',
        opening_event: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
        adjudication: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
        contract_signing: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
        custom: 'bg-gray-500/10 text-gray-600 border-gray-500/20'
    };
    return badges[type] || badges.custom;
}
