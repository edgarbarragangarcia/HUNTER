"use client";

import { motion } from "framer-motion";
import {
    Target,
    BarChart3,
    Search,
    Brain,
    Eye,
    Trophy,
    Bot,
    LineChart,
    Sparkles
} from "lucide-react";
import Link from "next/link";

export default function ShotPage() {
    const modules = [
        {
            title: "Predicciones IA",
            description: "Oportunidades de alta probabilidad y detección de riesgos.",
            icon: Sparkles,
            href: "/dashboard/shot/predictions",
            color: "text-purple-400",
            bg: "bg-purple-500/10",
            hoverBg: "group-hover:bg-purple-500/20"
        },

        {
            title: "Ranking",
            description: "Tu posición en el mercado frente a la competencia.",
            icon: Trophy,
            href: "/dashboard/shot/ranking",
            color: "text-yellow-400",
            bg: "bg-yellow-500/10",
            hoverBg: "group-hover:bg-yellow-500/20"
        },
        {
            title: "Copilot",
            description: "Asistente inteligente para redacción y análisis.",
            icon: Bot,
            href: "/dashboard/shot/copilot",
            color: "text-green-400",
            bg: "bg-green-500/10",
            hoverBg: "group-hover:bg-green-500/20"
        },
        {
            title: "Analytics",
            description: "Panel de control empresarial y proyecciones.",
            icon: LineChart,
            href: "/dashboard/shot/analytics",
            color: "text-indigo-400",
            bg: "bg-indigo-500/10",
            hoverBg: "group-hover:bg-indigo-500/20"
        },
        {
            title: "Análisis de Mercado",
            description: "Exploración profunda de datos históricos SECOP.",
            icon: BarChart3,
            href: "/dashboard/shot/market-analysis",
            color: "text-cyan-400",
            bg: "bg-cyan-500/10",
            hoverBg: "group-hover:bg-cyan-500/20"
        }
    ];

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col mr-4 overflow-y-auto pb-8">
            {/* Header */}
            <div className="flex-shrink-0 mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Target className="w-6 h-6 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground">Shot</h1>
                </div>
                <p className="text-zinc-400">
                    Selecciona el módulo de inteligencia que deseas utilizar.
                </p>
            </div>

            {/* Content */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
                {modules.map((module, index) => (
                    <Link
                        key={index}
                        href={module.href}
                        className="group relative p-6 rounded-2xl card-gradient card-shimmer shadow-glow text-left hover:scale-[1.02] transition-all duration-300 border border-white/5 hover:border-primary/30 flex flex-col"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="relative z-10 flex flex-col h-full">
                            <div className={`w-12 h-12 rounded-xl ${module.bg} flex items-center justify-center mb-4 ${module.hoverBg} transition-colors`}>
                                <module.icon className={`w-6 h-6 ${module.color}`} />
                            </div>

                            <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                                {module.title}
                            </h3>

                            <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">
                                {module.description}
                            </p>

                            <div className="mt-auto flex items-center text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                                Abrir módulo <span className="ml-2">→</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </motion.div>
        </div>
    );
}
