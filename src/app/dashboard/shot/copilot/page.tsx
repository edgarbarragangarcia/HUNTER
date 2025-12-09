import { getProjects } from "@/app/dashboard/missions/actions";
import { CopilotClient } from "./copilot-client";

export default async function CopilotPage() {
    const missions = await getProjects();

    return (
        <div className="flex flex-col gap-2">
            <div className="px-6 pt-6">
                <h1 className="text-3xl font-bold tracking-tight">Asistente de Licitación (Copilot)</h1>
                <p className="text-muted-foreground">
                    Tu experto en IA para redacción de propuestas, análisis de pliegos y generación de documentos.
                </p>
            </div>

            <CopilotClient missions={missions} />
        </div>
    );
}
