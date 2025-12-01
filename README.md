# HUNTER - Plataforma de Inteligencia de Negocios para Licitaciones

HUNTER es una plataforma avanzada diseñada para optimizar la gestión y análisis de oportunidades de negocio con el Estado (SECOP II). Utiliza Inteligencia Artificial para analizar documentos, evaluar requisitos y generar informes estratégicos.

## 🚀 Características Principales

- **Market Analysis**: Búsqueda inteligente de oportunidades en tiempo real usando la API de Socrata (SECOP II).
- **Filtro Inteligente**: Filtrado automático de oportunidades basado en los códigos UNSPSC de la empresa.
- **Análisis con IA**: Procesamiento de documentos (PDF, Excel, Imágenes) con Gemini 2.5 Flash Lite para extracción de datos y generación de resúmenes.
- **Gestión de Empresa**: Perfilamiento completo de empresas, incluyendo indicadores financieros y experiencia contractual.
- **Ranking de Competidores**: Análisis comparativo y posicionamiento en el mercado.

## 🛠️ Arquitectura y Tecnologías

El proyecto está construido sobre un stack moderno y robusto:

- **Frontend**: Next.js 15 (App Router), React, Tailwind CSS, Shadcn UI.
- **Backend**: Server Actions, Supabase (Auth & Database).
- **IA**: Google Gemini API (vía `ai-processor` service).
- **Datos**: Socrata Open Data API (Datos Abiertos Colombia).

### Servicios Clave

#### `src/lib/ai-processor.ts`
Servicio centralizado para todas las operaciones de Inteligencia Artificial.
- **`generateDocumentSummary`**: Analiza documentos cargados y genera resúmenes ejecutivos.
- **`generateCompanyAnalysisReport`**: Crea informes gerenciales completos cruzando datos financieros, experiencia y documentos.
- **`extractTextFromDocument`**: Utilidad para extracción de texto desde PDFs e imágenes almacenados en Supabase.

#### `src/lib/socrata.ts`
Cliente para la interacción con la API de Datos Abiertos (SECOP II).
- Búsqueda optimizada por códigos UNSPSC.
- Filtrado avanzado por cuantía, ubicación y entidad.

## 📂 Estructura del Proyecto

```bash
src/
├── app/
│   ├── dashboard/       # Módulos principales (Company, Market Analysis, Ranking)
│   ├── login/           # Autenticación
│   └── page.tsx         # Landing page
├── components/          # Componentes UI reutilizables (basados en Shadcn)
├── lib/
│   ├── ai-processor.ts  # Servicio de IA (Gemini)
│   ├── socrata.ts       # Cliente API SECOP II
│   ├── supabase/        # Cliente y utilidades de base de datos
│   └── utils.ts         # Helpers generales
└── ...
```

## ⚡️ Optimización y Limpieza (Diciembre 2025)

Se realizó una refactorización mayor para mejorar la mantenibilidad:
- **Centralización de Lógica**: Se movió la lógica de IA de los Server Actions a servicios dedicados.
- **Eliminación de Código Muerto**: Se depuraron scripts de prueba y archivos temporales.
- **Eficiencia**: Se optimizaron las consultas a base de datos y la carga de archivos.

## 📦 Despliegue

El proyecto está configurado para despliegue continuo en **Vercel**.
Requiere las siguientes variables de entorno:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
GEMINI_API_KEY=...
```

---
Desarrollado por Edgar Barragan.
