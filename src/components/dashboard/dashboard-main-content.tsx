"use client";

import { useDashboard } from "./dashboard-context";
import { cn } from "@/lib/utils";

export function DashboardMainContent({ children }: { children: React.ReactNode }) {
    const { isCollapsed } = useDashboard();

    return (
        <div
            className={cn(
                "flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out",
                isCollapsed ? "lg:ml-[80px]" : "lg:ml-64"
            )}
        >
            {children}
        </div>
    );
}
