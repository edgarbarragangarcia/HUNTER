'use client'

import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Loader2, Check } from "lucide-react";
import { searchEntities, addMonitoredEntity } from './actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function EntitySearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<{ name: string; count: number }[]>([]);
    const [loading, setLoading] = useState(false);
    const [adding, setAdding] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const router = useRouter();

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length >= 3) {
                setLoading(true);
                try {
                    const data = await searchEntities(query);
                    setResults(data);
                    setOpen(true);
                } catch (error) {
                    console.error("Error searching entities:", error);
                } finally {
                    setLoading(false);
                }
            } else {
                setResults([]);
                setOpen(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

    const handleAddEntity = async (name: string) => {
        setAdding(name);
        try {
            const result = await addMonitoredEntity(name);
            if (result.success) {
                toast.success(result.message);
                setQuery('');
                setOpen(false);
                router.refresh(); // Refresh to show new entity in list
            }
        } catch (error: any) {
            toast.error(error.message || "Error al agregar entidad");
        } finally {
            setAdding(null);
        }
    };

    return (
        <div className="relative w-full max-w-md">
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Buscar entidad (ej. Alcaldía, Gobernación...)"
                    className="pl-8"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                {loading && (
                    <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                )}
            </div>

            {open && results.length > 0 && (
                <div className="absolute top-full mt-2 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95 z-50">
                    <div className="p-1">
                        {results.map((entity, idx) => (
                            <div
                                key={idx}
                                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                            >
                                <div className="flex-1">
                                    <p className="font-medium">{entity.name}</p>
                                    <p className="text-xs text-muted-foreground">{entity.count} procesos recientes</p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleAddEntity(entity.name)}
                                    disabled={adding === entity.name}
                                >
                                    {adding === entity.name ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Plus className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {open && results.length === 0 && !loading && (
                <div className="absolute top-full mt-2 w-full rounded-md border bg-popover p-4 text-center text-sm text-muted-foreground shadow-md z-50">
                    No se encontraron entidades con ese nombre.
                </div>
            )}
        </div>
    );
}
