"use client";

import { User, Mail, Calendar, Shield } from "lucide-react";
import { useState, useTransition } from "react";
import { updateProfile } from "./actions";
import TokenCounter from "@/components/dashboard/token-counter";

interface ProfileFormProps {
    user: {
        id: string;
        email: string | undefined;
        created_at: string;
    };
    profile: {
        full_name: string | null;
        role?: string | null;
    } | null;
}

export default function ProfileForm({ user, profile }: ProfileFormProps) {
    const [fullName, setFullName] = useState(profile?.full_name || "");
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage(null);

        const formData = new FormData();
        formData.append("full_name", fullName);

        startTransition(async () => {
            const result = await updateProfile(formData);

            if (result.success) {
                setMessage({ type: "success", text: "Perfil actualizado exitosamente" });
                // Clear success message after 3 seconds
                setTimeout(() => setMessage(null), 3000);
            } else {
                setMessage({ type: "error", text: result.error || "Error al actualizar el perfil" });
            }
        });
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Mi Perfil</h1>
                <p className="text-muted-foreground">Gestiona tu información personal y preferencias</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="lg:col-span-1">
                    <div className="p-6 rounded-2xl card-gradient shadow-glow space-y-6">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-black font-bold text-3xl mb-4">
                                {fullName ? fullName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                            </div>
                            <h2 className="text-xl font-bold text-foreground">
                                {fullName || "Usuario"}
                            </h2>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>

                        <div className="pt-6 border-t border-border space-y-3">
                            <div className="flex items-center gap-3 text-sm">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <span className="text-foreground">{user.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span className="text-foreground">
                                    Miembro desde {new Date(user.created_at || "").toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Shield className="w-4 h-4 text-muted-foreground" />
                                <span className="text-foreground capitalize">{profile?.role || "user"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Token Counter */}
                    <div className="mt-6">
                        <TokenCounter />
                    </div>
                </div>

                {/* Profile Information */}
                <div className="lg:col-span-2 space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="p-6 rounded-2xl card-gradient shadow-glow">
                            <h3 className="text-lg font-bold text-foreground mb-6">Información Personal</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                                        Nombre Completo
                                    </label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full h-10 px-4 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        placeholder="Tu nombre completo"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                                        Correo Electrónico
                                    </label>
                                    <input
                                        type="email"
                                        value={user.email || ""}
                                        disabled
                                        className="w-full h-10 px-4 rounded-lg bg-muted border border-border text-sm text-muted-foreground cursor-not-allowed"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        El correo electrónico no se puede cambiar
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-6 rounded-2xl card-gradient shadow-glow">
                            <h3 className="text-lg font-bold text-foreground mb-6">Acciones</h3>

                            {/* Success/Error Message */}
                            {message && (
                                <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === "success"
                                    ? "bg-green-500/10 text-green-500 border border-green-500/20"
                                    : "bg-red-500/10 text-red-500 border border-red-500/20"
                                    }`}>
                                    {message.text}
                                </div>
                            )}

                            <div className="space-y-3">
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="w-full h-10 px-6 rounded-lg bg-primary text-black font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isPending ? "Guardando..." : "Guardar Cambios"}
                                </button>
                                <button
                                    type="button"
                                    className="w-full h-10 px-6 rounded-lg border border-border text-foreground hover:bg-accent transition-colors"
                                >
                                    Cambiar Contraseña
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
