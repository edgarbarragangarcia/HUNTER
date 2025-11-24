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
                        {/* Social Login Icons */}
                        <div className="flex justify-center gap-6 mt-6">
                            <div className="flex flex-col items-center gap-2 cursor-pointer group">
                                <div className="w-10 h-10 rounded-full bg-[#1b263b] flex items-center justify-center border border-white/5 group-hover:border-primary/50 transition-colors">
                                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .533 5.333.533 12S5.867 24 12.48 24c3.44 0 6.373-1.147 8.587-3.493 2.293-2.293 3.2-5.12 3.2-7.573 0-.72-.067-1.413-.187-2.013h-11.6z" />
                                    </svg>
                                </div>
                                <span className="text-xs text-zinc-400 group-hover:text-white">Google</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 cursor-pointer group">
                                <div className="w-10 h-10 rounded-full bg-[#1b263b] flex items-center justify-center border border-white/5 group-hover:border-primary/50 transition-colors">
                                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                </div>
                                <span className="text-xs text-zinc-400 group-hover:text-white">GitHub</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 cursor-pointer group">
                                <div className="w-10 h-10 rounded-full bg-[#1b263b] flex items-center justify-center border border-white/5 group-hover:border-primary/50 transition-colors">
                                    <Search className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-xs text-zinc-400 group-hover:text-white">SSO</span>
                            </div>
                        </div>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-zinc-800"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-[#0d1b2a] px-2 text-zinc-500">Or</span>
                            </div>
                        </div>
                    </div>

                    {children}
                </div>
            </div>
        </div>
    );
}
