import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, Bell, Search, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getMonitoredEntities, getCompetitors, getMarketAlerts } from "./actions";

export default async function MonitorPage() {
    const entities = await getMonitoredEntities();
    const competitors = await getCompetitors();
    const alerts = await getMarketAlerts();

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Monitor de Mercado</h1>
                <p className="text-muted-foreground">
                    Seguimiento inteligente de entidades, competidores y alertas de mercado con datos reales.
                </p>
            </div>

            <Tabs defaultValue="entities" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="entities">Monitor de Entidades</TabsTrigger>
                    <TabsTrigger value="competitors">Análisis de Competidores</TabsTrigger>
                    <TabsTrigger value="alerts">Alertas Inteligentes</TabsTrigger>
                </TabsList>

                <TabsContent value="entities" className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Buscar entidad para monitorear..."
                                className="pl-8"
                            />
                        </div>
                        <Button>Agregar Entidad</Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {entities.length === 0 ? (
                            <div className="col-span-full text-center py-8 text-muted-foreground">
                                <Building2 className="mx-auto h-12 w-12 opacity-20 mb-4" />
                                <p>No hay entidades monitoreadas. Agrega una para comenzar.</p>
                            </div>
                        ) : (
                            entities.map((entity, idx) => (
                                <Card key={idx}>
                                    <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/20">
                                            <Building2 className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <CardTitle className="text-base truncate" title={entity.name}>{entity.name}</CardTitle>
                                            <CardDescription>Monitor Activo</CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="mt-2 space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Procesos Recientes:</span>
                                                <span className="font-medium">{entity.processCount}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Monto Total:</span>
                                                <span className="font-medium">
                                                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(entity.executedBudget)}
                                                </span>
                                            </div>
                                            <div className="pt-2">
                                                <p className="text-xs text-muted-foreground">Última actividad: {entity.lastActivity}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="competitors" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Competidores Frecuentes</CardTitle>
                            <CardDescription>
                                Análisis de empresas que participan en los mismos procesos que tú.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {competitors.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Users className="mx-auto h-12 w-12 opacity-20 mb-4" />
                                        <p>No se han identificado competidores frecuentes aún.</p>
                                    </div>
                                ) : (
                                    competitors.map((comp) => (
                                        <div key={comp.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800">
                                                    <Users className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{comp.name}</p>
                                                    <p className="text-sm text-muted-foreground">NIT: {comp.nit}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-medium ${comp.riskScore > 70 ? 'text-red-600' : 'text-yellow-600'}`}>
                                                    {comp.riskScore > 70 ? 'Alta Competencia' : 'Competencia Media'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">Tasa de éxito: {(comp.winRate * 100).toFixed(1)}%</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="alerts" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Alertas de Mercado</CardTitle>
                            <CardDescription>
                                Notificaciones sobre cambios inusuales y oportunidades.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {alerts.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Bell className="mx-auto h-12 w-12 opacity-20 mb-4" />
                                        <p>No tienes alertas nuevas.</p>
                                    </div>
                                ) : (
                                    alerts.map((alert) => (
                                        <div key={alert.id} className="flex items-start gap-4 rounded-lg border p-4">
                                            <Bell className="mt-1 h-5 w-5 text-blue-500" />
                                            <div>
                                                <h4 className="font-semibold">{alert.title}</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    {alert.message}
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {new Date(alert.date).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
