import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, TrendingUp, AlertTriangle, Target, Calendar, DollarSign } from "lucide-react";
import { getPredictionStats, getOpportunities, getRisks } from "./actions";

export default async function PredictionsPage() {
    const stats = await getPredictionStats();
    const opportunities = await getOpportunities();
    const risks = await getRisks();

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Sin fecha';
        return new Date(dateString).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Motor de Predicciones IA</h1>
                <p className="text-muted-foreground">
                    Análisis predictivo de oportunidades, probabilidad de éxito y detección de riesgos con datos en tiempo real.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Oportunidades Alta Probabilidad</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.opportunities}</div>
                        <p className="text-xs text-muted-foreground">Detectadas por IA</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Score Promedio de Éxito</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.avgSuccessScore}%</div>
                        <p className="text-xs text-muted-foreground">En tus licitaciones activas</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Alertas de Riesgo</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.risks}</div>
                        <p className="text-xs text-muted-foreground">Requieren atención inmediata</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="opportunities" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="opportunities">Oportunidades Detectadas</TabsTrigger>
                    <TabsTrigger value="success">Probabilidad de Éxito</TabsTrigger>
                    <TabsTrigger value="risks">Riesgos Identificados</TabsTrigger>
                </TabsList>

                <TabsContent value="opportunities" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Oportunidades Recomendadas</CardTitle>
                            <CardDescription>
                                Licitaciones seleccionadas por la IA basándose en tu perfil y experiencia histórica.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {opportunities.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Brain className="mx-auto h-12 w-12 opacity-20 mb-4" />
                                    <p>No hay oportunidades detectadas aún. La IA está analizando nuevos procesos.</p>
                                </div>
                            ) : (
                                opportunities.map((opp) => (
                                    <div key={opp.id} className="rounded-md border p-4 hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <h3 className="font-semibold">{opp.title}</h3>
                                                <p className="text-sm text-muted-foreground">{opp.entity}</p>
                                            </div>
                                            <Badge variant={opp.matchScore > 90 ? "default" : "secondary"} className={opp.matchScore > 90 ? "bg-green-600 hover:bg-green-700" : ""}>
                                                Match {opp.matchScore}%
                                            </Badge>
                                        </div>
                                        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <DollarSign className="h-3 w-3" />
                                                <span>{formatCurrency(opp.amount)}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                <span>Cierre: {formatDate(opp.closingDate)}</span>
                                            </div>
                                            {opp.reason && (
                                                <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 w-full md:w-auto mt-2 md:mt-0">
                                                    <Brain className="h-3 w-3" />
                                                    <span className="text-xs">{opp.reason}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="success">
                    <Card>
                        <CardHeader>
                            <CardTitle>Análisis de Probabilidad de Éxito</CardTitle>
                            <CardDescription>
                                Evaluación detallada de tus posibilidades en procesos activos.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                                <Brain className="mb-4 h-12 w-12 opacity-20" />
                                <p>Selecciona un proceso para ver el análisis detallado de éxito.</p>
                                <p className="text-sm mt-2">(Funcionalidad en desarrollo: requiere seleccionar un proceso específico)</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="risks">
                    <Card>
                        <CardHeader>
                            <CardTitle>Monitor de Riesgos</CardTitle>
                            <CardDescription>
                                Detección temprana de anomalías y riesgos en pliegos.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {risks.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Target className="mx-auto h-12 w-12 opacity-20 mb-4" />
                                    <p>No se han detectado riesgos críticos en los procesos monitoreados.</p>
                                </div>
                            ) : (
                                risks.map((risk) => (
                                    <div key={risk.id} className={`rounded-md border p-4 ${risk.severity === 'high' ? 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20' : 'border-yellow-200 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-900/20'}`}>
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className={`mt-0.5 h-5 w-5 ${risk.severity === 'high' ? 'text-red-600 dark:text-red-500' : 'text-yellow-600 dark:text-yellow-500'}`} />
                                            <div>
                                                <h3 className={`font-semibold ${risk.severity === 'high' ? 'text-red-900 dark:text-red-500' : 'text-yellow-900 dark:text-yellow-500'}`}>
                                                    {risk.title}
                                                </h3>
                                                <p className={`text-sm ${risk.severity === 'high' ? 'text-red-800 dark:text-red-400' : 'text-yellow-800 dark:text-yellow-400'}`}>
                                                    {risk.description}
                                                </p>
                                                {risk.tenderId && (
                                                    <p className="mt-2 text-xs opacity-70">Proceso ID: {risk.tenderId}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
