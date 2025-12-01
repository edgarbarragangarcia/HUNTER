import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, LineChart, PieChart, Activity } from "lucide-react";
import { getAnalyticsData } from "./actions";

export default async function AnalyticsPage() {
    const data = await getAnalyticsData();

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Panel de Control Empresarial</h1>
                <p className="text-muted-foreground">
                    Analytics avanzados, proyecciones de ingresos y estadísticas de desempeño.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ingresos Proyectados</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(data.projectedRevenue)}
                        </div>
                        <p className="text-xs text-muted-foreground">{data.period} (Estimado)</p>
                    </CardContent>
                </Card>
                {/* Add more metric cards */}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Tendencia de Adjudicaciones</CardTitle>
                        <CardDescription>
                            Histórico de contratos ganados vs perdidos en los últimos 12 meses.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                            <LineChart className="mr-2 h-4 w-4" />
                            Gráfico de Tendencias (Próximamente con datos reales)
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Distribución por Región</CardTitle>
                        <CardDescription>
                            Zonas geográficas con mayor éxito.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                            <PieChart className="mr-2 h-4 w-4" />
                            Gráfico Circular (Próximamente con datos reales)
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
