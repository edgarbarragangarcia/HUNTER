import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, BellOff, CheckCircle2, Clock, AlertTriangle, Building2, TrendingUp, Settings } from "lucide-react";
import { getNotifications, getAlertSettings } from "./actions";

export default async function NotificationsPage() {
    const notifications = await getNotifications();
    const settings = await getAlertSettings();

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Bell className="h-8 w-8 text-primary" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">Centro de Notificaciones</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Alertas inteligentes sobre licitaciones, fechas límite y cambios en el mercado.
                    </p>
                </div>
                <Button variant="outline" className="gap-2">
                    <Settings className="h-4 w-4" />
                    Configurar Alertas
                </Button>
            </div>

            <Tabs defaultValue="all" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="all">
                        Todas ({notifications.length})
                    </TabsTrigger>
                    <TabsTrigger value="unread">
                        No leídas ({unreadCount})
                    </TabsTrigger>
                    <TabsTrigger value="tenders">
                        Licitaciones
                    </TabsTrigger>
                    <TabsTrigger value="deadlines">
                        Fechas Límite
                    </TabsTrigger>
                    <TabsTrigger value="market">
                        Mercado
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                    <NotificationList notifications={notifications} />
                </TabsContent>

                <TabsContent value="unread" className="space-y-4">
                    <NotificationList notifications={notifications.filter(n => !n.read)} />
                </TabsContent>

                <TabsContent value="tenders" className="space-y-4">
                    <NotificationList notifications={notifications.filter(n => n.type === 'new_tender')} />
                </TabsContent>

                <TabsContent value="deadlines" className="space-y-4">
                    <NotificationList notifications={notifications.filter(n => n.type === 'deadline')} />
                </TabsContent>

                <TabsContent value="market" className="space-y-4">
                    <NotificationList notifications={notifications.filter(n => n.type === 'market_change')} />
                </TabsContent>
            </Tabs>

            {/* Alert Settings Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Configuración de Alertas</CardTitle>
                    <CardDescription>
                        Personaliza qué notificaciones quieres recibir
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="flex items-center justify-between p-4 rounded-lg border">
                            <div className="flex items-center gap-3">
                                <Building2 className="h-5 w-5 text-blue-500" />
                                <div>
                                    <p className="font-medium">Nuevas Licitaciones</p>
                                    <p className="text-sm text-muted-foreground">
                                        Entidades monitoreadas: {settings.monitoredEntities}
                                    </p>
                                </div>
                            </div>
                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                                Activo
                            </Badge>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-lg border">
                            <div className="flex items-center gap-3">
                                <Clock className="h-5 w-5 text-yellow-500" />
                                <div>
                                    <p className="font-medium">Fechas Límite</p>
                                    <p className="text-sm text-muted-foreground">
                                        Recordatorios 48h antes
                                    </p>
                                </div>
                            </div>
                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                                Activo
                            </Badge>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-lg border">
                            <div className="flex items-center gap-3">
                                <TrendingUp className="h-5 w-5 text-purple-500" />
                                <div>
                                    <p className="font-medium">Cambios de Mercado</p>
                                    <p className="text-sm text-muted-foreground">
                                        Competidores y tendencias
                                    </p>
                                </div>
                            </div>
                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                                Activo
                            </Badge>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-lg border">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                <div>
                                    <p className="font-medium">Alertas Críticas</p>
                                    <p className="text-sm text-muted-foreground">
                                        Cambios en pliegos
                                    </p>
                                </div>
                            </div>
                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                                Activo
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function NotificationList({ notifications }: { notifications: any[] }) {
    if (notifications.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <BellOff className="mx-auto h-12 w-12 opacity-20 mb-4" />
                <p>No hay notificaciones</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {notifications.map((notification) => (
                <Card key={notification.id} className={notification.read ? "opacity-60" : "border-primary/30"}>
                    <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                            <div className={`mt-1 p-2 rounded-lg ${getNotificationStyle(notification.type).bg}`}>
                                {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h4 className="font-semibold">{notification.title}</h4>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {notification.message}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Badge variant="outline" className={getNotificationStyle(notification.type).badge}>
                                                {getNotificationLabel(notification.type)}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {formatDate(notification.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                    {!notification.read && (
                                        <Button variant="ghost" size="sm">
                                            <CheckCircle2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                                {notification.action_url && (
                                    <Button variant="link" className="px-0 mt-2" asChild>
                                        <a href={notification.action_url}>
                                            Ver detalles →
                                        </a>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function getNotificationIcon(type: string) {
    switch (type) {
        case 'new_tender':
            return <Building2 className="h-5 w-5 text-blue-500" />;
        case 'deadline':
            return <Clock className="h-5 w-5 text-yellow-500" />;
        case 'market_change':
            return <TrendingUp className="h-5 w-5 text-purple-500" />;
        case 'alert':
            return <AlertTriangle className="h-5 w-5 text-red-500" />;
        default:
            return <Bell className="h-5 w-5 text-gray-500" />;
    }
}

function getNotificationStyle(type: string) {
    switch (type) {
        case 'new_tender':
            return { bg: 'bg-blue-500/10', badge: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
        case 'deadline':
            return { bg: 'bg-yellow-500/10', badge: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' };
        case 'market_change':
            return { bg: 'bg-purple-500/10', badge: 'bg-purple-500/10 text-purple-600 border-purple-500/20' };
        case 'alert':
            return { bg: 'bg-red-500/10', badge: 'bg-red-500/10 text-red-600 border-red-500/20' };
        default:
            return { bg: 'bg-gray-500/10', badge: 'bg-gray-500/10 text-gray-600 border-gray-500/20' };
    }
}

function getNotificationLabel(type: string) {
    switch (type) {
        case 'new_tender':
            return 'Nueva Licitación';
        case 'deadline':
            return 'Fecha Límite';
        case 'market_change':
            return 'Cambio de Mercado';
        case 'alert':
            return 'Alerta';
        default:
            return 'Notificación';
    }
}

function formatDate(date: string) {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Hace menos de 1 hora';
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;
    if (diffInHours < 48) return 'Ayer';
    return notificationDate.toLocaleDateString('es-CO');
}
