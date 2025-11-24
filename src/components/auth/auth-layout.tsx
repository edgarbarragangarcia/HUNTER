"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Search } from "lucide-react";

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
    return (
        <div className="min-h-screen w-full flex bg-[#0a1628] overflow-hidden">
            {/* Left Side - Visuals (Redis Style) */}
            <div className="hidden lg:flex w-1/2 relative bg-[#0a1628] flex-col justify-between p-12 overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent" />

                {/* Logo */}
                <Link href="/" className="relative z-10 flex items-center gap-2 w-fit">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/20">
                        <Search className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-xl font-bold text-white">HUNTER</span>
                </Link>

                {/* Main Content */}
                <div className="relative z-10 flex flex-col items-center text-center mt-20">
                    <h2 className="text-3xl font-bold text-white mb-6 max-w-md">
                        Experience app-building with seamless, scalable speed with HUNTER.
                    </h2>

                    {/* Partner Logos (Mockup) */}
                    <div className="flex items-center gap-6 mt-8 opacity-70 grayscale hover:grayscale-0 transition-all">
                        <span className="text-zinc-400 font-semibold">AWS</span>
                        <span className="text-zinc-400 font-semibold">Google Cloud</span>
                        <span className="text-zinc-400 font-semibold">Microsoft Azure</span>
                    </div>
                </div>

                {/* Illustration (Abstract Buildings/Cloud) */}
                <div className="relative z-10 mt-auto flex justify-center">
                    <div className="relative w-full max-w-md aspect-square">
                        {/* Abstract City/Cloud Illustration using CSS/Divs */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
                        <div className="relative grid grid-cols-3 gap-4 opacity-80">
                            <div className="h-32 bg-[#1b263b] rounded-t-lg transform translate-y-8 border border-blue-500/20" />
                            <div className="h-48 bg-[#1b263b] rounded-t-lg border border-blue-500/20" />
                            <div className="h-24 bg-[#1b263b] rounded-t-lg transform translate-y-16 border border-blue-500/20" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 md:p-12 lg:p-20 relative z-10 bg-[#0d1b2a]">
                <div className="w-full max-w-md">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
                    </div>

                    {children}
                </div>
            </div>
        </div>
    );
}
