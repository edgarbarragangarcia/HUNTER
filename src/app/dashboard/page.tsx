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
                    <div className="p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Target className="w-24 h-24 text-primary transform rotate-12 translate-x-4 -translate-y-4" />
                        </div>

                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Misiones Activas</h3>
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                <Target className="w-5 h-5 text-primary" />
                            </div>
                        </div>

                        <div className="relative z-10">
                            <p className="text-4xl font-bold text-foreground mb-1">{stats.activeMissions}</p>
                            {stats.upcomingDeadlines > 0 ? (
                                <p className="text-xs font-medium text-amber-500 flex items-center gap-1.5 bg-amber-500/10 py-1 px-2 rounded-lg w-fit">
                                    <Calendar className="w-3 h-3" />
                                    {stats.upcomingDeadlines} cierre{stats.upcomingDeadlines !== 1 ? 's' : ''} próximo{stats.upcomingDeadlines !== 1 ? 's' : ''}
                                </p>
                            ) : (
                                <p className="text-sm text-muted-foreground">Sin vencimientos cercanos</p>
                            )}
                        </div>
                    </div>
                </Link>

                {/* New Alerts */}
                <Link href="/dashboard/notifications" className="group">
                    <div className="p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-orange-500/50 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <AlertCircle className="w-24 h-24 text-orange-500 transform rotate-12 translate-x-4 -translate-y-4" />
                        </div>

                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Alertas Nuevas</h3>
                            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                                <AlertCircle className="w-5 h-5 text-orange-500" />
                            </div>
                        </div>

                        <div className="relative z-10">
                            <p className="text-4xl font-bold text-foreground mb-1">{stats.newAlerts}</p>
                            <p className="text-sm text-muted-foreground">
                                Notificaciones pendientes
                            </p>
                        </div>
                    </div>
                </Link>

                {/* Documents */}
                <Link href="/dashboard/company" className="group">
                    <div className="p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <FileText className="w-24 h-24 text-blue-500 transform rotate-12 translate-x-4 -translate-y-4" />
                        </div>

                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Documentos</h3>
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                                <FileText className="w-5 h-5 text-blue-500" />
                            </div>
                        </div>

                        <div className="relative z-10">
                            <p className="text-4xl font-bold text-foreground mb-1">{stats.documents}</p>
                            <p className="text-sm text-muted-foreground">
                                Documentos subidos
                            </p>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Success Rate */}
                <div className="p-6 rounded-2xl bg-card border border-border shadow-sm relative overflow-hidden group hover:border-green-500/50 transition-colors duration-300">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingUp className="w-32 h-32 text-green-500 transform rotate-12 translate-x-8 -translate-y-8" />
                    </div>

                    <div className="flex items-center gap-4 mb-4 relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-green-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">Tasa de Éxito</h3>
                    </div>

                    <div className="relative z-10 pl-1">
                        <div className="flex items-baseline gap-2">
                            <p className="text-5xl font-bold text-foreground tracking-tight">{stats.successRate}%</p>
                            <span className="text-sm font-medium text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">+2.5% vs mes anterior</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">de licitaciones ganadas</p>
                    </div>
                </div>

                {/* Total in Process */}
                <div className="p-6 rounded-2xl bg-card border border-border shadow-sm relative overflow-hidden group hover:border-indigo-500/50 transition-colors duration-300">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Target className="w-32 h-32 text-indigo-500 transform rotate-12 translate-x-8 -translate-y-8" />
                    </div>

                    <div className="flex items-center gap-4 mb-4 relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                            <Target className="w-6 h-6 text-indigo-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">Valor en Proceso</h3>
                    </div>

                    <div className="relative z-10 pl-1">
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-bold text-foreground tracking-tight">{formatCurrency(stats.totalInProcess)}</p>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                            <span className="bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded-full font-medium text-xs">ACTIVO</span>
                            En {stats.activeMissions} misión{stats.activeMissions !== 1 ? 'es' : ''} activa{stats.activeMissions !== 1 ? 's' : ''}
                        </p>
                    </div>
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
