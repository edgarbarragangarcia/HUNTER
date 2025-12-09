import { createClient } from "@/lib/supabase/server";
import { getDashboardStats } from "./actions";
import { TrendingUp, AlertCircle, FileText, Calendar, Target } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const stats = await getDashboardStats();

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', { 
            style: 'currency', 
            currency: 'COP', 
            maximumFractionDigits: 0 
        }).format(amount);
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Panel de Control</h1>
                <p className="text-zinc-400">Bienvenido de nuevo, {user?.email}</p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Active Missions */}
                <Link href="/dashboard/missions" className="group">
                    <div className="p-6 rounded-2xl card-gradient shadow-glow hover:shadow-primary/20 transition-all hover:scale-[1.02]">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-medium text-muted-foreground">Misiones Activas</h3>
                            <Target className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-4xl font-bold text-foreground">{stats.activeMissions}</p>
                        {stats.upcomingDeadlines > 0 && (
                            <p className="text-sm text-yellow-500 mt-2 flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {stats.upcomingDeadlines} con fecha límite próxima
                            </p>
                        )}
                    </div>
                </Link>

                {/* New Alerts */}
                <Link href="/dashboard/notifications" className="group">
                    <div className="p-6 rounded-2xl card-gradient shadow-glow hover:shadow-primary/20 transition-all hover:scale-[1.02]">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-medium text-muted-foreground">Alertas Nuevas</h3>
                            <AlertCircle className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-4xl font-bold text-primary">{stats.newAlerts}</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Notificaciones pendientes
                        </p>
                    </div>
                </Link>

                {/* Documents */}
                <Link href="/dashboard/company" className="group">
                    <div className="p-6 rounded-2xl card-gradient shadow-glow hover:shadow-primary/20 transition-all hover:scale-[1.02]">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-medium text-muted-foreground">Documentos</h3>
                            <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-4xl font-bold text-foreground">{stats.documents}</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Documentos subidos
                        </p>
                    </div>
                </Link>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Success Rate */}
                <div className="p-6 rounded-2xl card-gradient shadow-glow">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-foreground">Tasa de Éxito</h3>
                        <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-5xl font-bold text-green-500">{stats.successRate}%</p>
                        <p className="text-sm text-muted-foreground">de licitaciones ganadas</p>
                    </div>
                </div>

                {/* Total in Process */}
                <div className="p-6 rounded-2xl card-gradient shadow-glow">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-foreground">Valor en Proceso</h3>
                        <Target className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold text-blue-500">{formatCurrency(stats.totalInProcess)}</p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                        En{stats.activeMissions} misión{stats.activeMissions !== 1 ? 'es' : ''} activa{stats.activeMissions !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            {/* Onboarding Card */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
                <h2 className="text-xl font-bold text-foreground mb-4">Completa tu Perfil de Empresa</h2>
                <p className="text-zinc-400 mb-6 max-w-2xl">
                    Para que HUNTER pueda encontrar las mejores licitaciones para ti, necesitamos conocer más sobre tu empresa. Sube tus documentos legales y financieros.
                </p>
                <Link
                    href="/dashboard/company"
                    className="inline-flex items-center justify-center h-10 px-6 rounded-lg bg-primary text-black font-semibold hover:bg-primary/90 transition-colors"
                >
                    Ir al Perfil de Empresa
                </Link>
            </div>
        </div>
    );
}
