import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, FileText, CheckSquare, PenTool } from "lucide-react";

export default function CopilotPage() {
    return (
        <div className="flex h-[calc(100vh-6rem)] flex-col gap-6 p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Asistente de Licitación (Copilot)</h1>
                <p className="text-muted-foreground">
                    Tu experto en IA para redacción de propuestas, análisis de pliegos y generación de documentos.
                </p>
            </div>

            <div className="grid flex-1 gap-6 md:grid-cols-[300px_1fr]">
                <div className="flex flex-col gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Herramientas Rápidas</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-2">
                            <Button variant="outline" className="justify-start gap-2">
                                <FileText className="h-4 w-4" />
                                Respuesta a Pliegos
                            </Button>
                            <Button variant="outline" className="justify-start gap-2">
                                <PenTool className="h-4 w-4" />
                                Redactar Observación
                            </Button>
                            <Button variant="outline" className="justify-start gap-2">
                                <CheckSquare className="h-4 w-4" />
                                Matriz de Cumplimiento
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="flex-1">
                        <CardHeader>
                            <CardTitle className="text-lg">Historial</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground">
                                No hay conversaciones recientes.
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="flex flex-col">
                    <CardHeader className="border-b">
                        <div className="flex items-center gap-2">
                            <Bot className="h-5 w-5 text-primary" />
                            <div>
                                <CardTitle>Chat con Hunter AI</CardTitle>
                                <CardDescription>Pregunta sobre cualquier proceso o requisito legal.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-4">
                        <div className="flex flex-col gap-4">
                            <div className="flex gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                    <Bot className="h-4 w-4 text-primary" />
                                </div>
                                <div className="rounded-lg bg-muted p-3 text-sm">
                                    Hola, soy tu asistente de licitaciones. ¿En qué puedo ayudarte hoy? Puedo analizar pliegos, redactar cartas de presentación o verificar requisitos habilitantes.
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <div className="border-t p-4">
                        <form className="flex gap-2">
                            <Input placeholder="Escribe tu mensaje aquí..." className="flex-1" />
                            <Button type="submit" size="icon">
                                <Send className="h-4 w-4" />
                                <span className="sr-only">Enviar</span>
                            </Button>
                        </form>
                    </div>
                </Card>
            </div>
        </div>
    );
}
