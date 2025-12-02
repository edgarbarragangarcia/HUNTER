'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Trash2, Loader2 } from "lucide-react";
import { removeMonitoredEntity } from "./actions";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface MonitoredEntityProps {
    entity: {
        name: string;
        processCount: number;
        executedBudget: number;
        lastActivity: string;
        isMonitored?: boolean;
    };
}

export function MonitoredEntityCard({ entity }: MonitoredEntityProps) {
    const [removing, setRemoving] = useState(false);
    const router = useRouter();

    const handleRemove = async () => {
        if (!confirm(`¿Estás seguro de dejar de monitorear a ${entity.name}?`)) return;

        setRemoving(true);
        try {
            const result = await removeMonitoredEntity(entity.name);
            if (result.success) {
                toast.success("Entidad eliminada del monitor");
                router.refresh();
            }
        } catch (error: any) {
            toast.error(error.message || "Error al eliminar entidad");
        } finally {
            setRemoving(false);
        }
    };

    return (
        <Card className="relative group">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/20">
                    <Building2 className="h-5 w-5" />
                </div>
                <div className="flex-1 overflow-hidden">
                    <CardTitle className="text-base truncate" title={entity.name}>{entity.name}</CardTitle>
                    <CardDescription>
                        {entity.isMonitored ? 'Monitor Activo' : 'Sugerido'}
                    </CardDescription>
                </div>
                {entity.isMonitored && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-red-500"
                        onClick={handleRemove}
                        disabled={removing}
                    >
                        {removing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Trash2 className="h-4 w-4" />
                        )}
                    </Button>
                )}
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
    );
}
