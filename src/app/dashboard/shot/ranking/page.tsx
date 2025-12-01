import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, TrendingUp, Award, BarChart3 } from "lucide-react";
import { getUserRanking, getSectorRanking } from "./actions";

export default async function RankingPage() {
    const ranking = await getUserRanking();
    const sectorLeaders = await getSectorRanking(ranking?.sector || "");

    if (!ranking) {
        return (
            <div className="p-6">
                <h1 className="text-3xl font-bold tracking-tight mb-4">Ranking de Proveedores</h1>
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                        <p>Completa tu perfil de empresa para ver tu ranking.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Ranking de Proveedores</h1>
                <p className="text-muted-foreground">
                    Posicionamiento de mercado y análisis comparativo de competidores.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tu Posición Global</CardTitle>
                        <Trophy className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">#{ranking.globalRank}</div>
                        <p className="text-xs text-muted-foreground">{ranking.percentile} del sector</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Score de Competitividad</CardTitle>
                        <Award className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{ranking.competitivenessScore}/10</div>
                        <p className="text-xs text-muted-foreground">Basado en historial de adjudicaciones</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Crecimiento Anual</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{ranking.growth}%</div>
                        <p className="text-xs text-muted-foreground">En valor total contratado</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="sector" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="sector">Ranking por Sector</TabsTrigger>
                    <TabsTrigger value="experience">Experiencia</TabsTrigger>
                    <TabsTrigger value="compliance">Cumplimiento</TabsTrigger>
                </TabsList>

                <TabsContent value="sector" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Líderes en {ranking.sector}</CardTitle>
                            <CardDescription>
                                Top proveedores con mayor contratación en tu sector principal.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {sectorLeaders.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-4">No hay suficientes datos de competidores en este sector aún.</p>
                                ) : (
                                    sectorLeaders.map((comp, i) => (
                                        <div key={comp.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-bold">
                                                    {i + 1}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{comp.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(comp.amount)} Contratados
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant={i === 0 ? "default" : "secondary"}>
                                                {i === 0 ? "Líder del Mercado" : "Competidor Fuerte"}
                                            </Badge>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="experience">
                    <Card>
                        <CardHeader>
                            <CardTitle>Ranking por Experiencia Acreditada</CardTitle>
                            <CardDescription>
                                Comparativa basada en número de contratos ejecutados y certificados.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                                <BarChart3 className="mb-4 h-12 w-12 opacity-20" />
                                <p>Gráfica comparativa de experiencia en desarrollo.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
