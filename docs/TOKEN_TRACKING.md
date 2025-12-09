# Sistema de Contabilización de Tokens de IA

## 📊 Descripción General

El sistema de contabilización de tokens permite rastrear y monitorear el uso de APIs de IA (como GPT-4, Claude, Gemini) en la aplicación HUNTER. Esto es esencial para:

- **Control de costos**: Monitorear gasto en APIs de IA
- **Análisis de uso**: Identificar patrones y optimizar consumo
- **Transparencia**: Mostrar a los usuarios su consumo de recursos
- **Debugging**: Detectar uso excesivo o anormal

## 🏗️ Arquitectura

### Componentes

1. **Base de Datos** (`20241209_ai_token_usage.sql`)
   - Tabla `ai_token_usage`: Registros individuales de uso
   - Vista materializada `user_token_stats`: Estadísticas agregadas por usuario
   - Políticas RLS para seguridad

2. **API Routes** (`/api/ai/usage/route.ts`)
   - `GET /api/ai/usage`: Obtener estadísticas del usuario
   - `POST /api/ai/usage`: Registrar nuevo uso de tokens

3. **Utilidades** (`/lib/ai/token-tracker.ts`)
   - `recordTokenUsage()`: Registra uso en la BD
   - `calculateCost()`: Calcula costo estimado
   - `getUserTokenUsage()`: Obtiene estadísticas

4. **UI Component** (`/components/dashboard/token-counter.tsx`)
   - Visualización moderna de estadísticas
   - Actualización en tiempo real
   - Diseño responsive y premium

## 🚀 Instalación

### 1. Ejecutar Migración

```bash
# Si usas Supabase CLI
supabase migration up

# O ejecuta manualmente el SQL
psql -f supabase/migrations/20241209_ai_token_usage.sql
```

### 2. Verificar Instalación

```sql
-- Verificar que la tabla existe
SELECT * FROM ai_token_usage LIMIT 1;

-- Verificar vista materializada
SELECT * FROM user_token_stats;
```

## 📝 Uso

### Registrar Uso de Tokens

Cuando hagas una llamada a una API de IA, registra el uso:

```typescript
import { recordTokenUsage } from '@/lib/ai/token-tracker';

// Después de llamar a la API de IA
const response = await openai.chat.completions.create({
  model: "gpt-4-turbo",
  messages: [{ role: "user", content: "Analiza esta licitación..." }]
});

// Registrar el uso
await recordTokenUsage({
  total_tokens: response.usage.total_tokens,
  prompt_tokens: response.usage.prompt_tokens,
  completion_tokens: response.usage.completion_tokens,
  model: 'gpt-4-turbo',
  provider: 'openai',
  feature: 'copilot',        // 'copilot', 'predictions', 'analytics'
  request_type: 'chat'        // 'chat', 'completion', 'embedding'
});
```

### Ejemplos por Caso de Uso

#### 1. Copilot / Chat

```typescript
// En tu función de chat
const aiResponse = await callOpenAI(userMessage);

await recordTokenUsage({
  total_tokens: aiResponse.usage.total_tokens,
  prompt_tokens: aiResponse.usage.prompt_tokens,
  completion_tokens: aiResponse.usage.completion_tokens,
  model: 'gpt-4-turbo',
  provider: 'openai',
  feature: 'copilot',
  request_type: 'chat'
});
```

#### 2. Predicciones de Licitaciones

```typescript
// En tu módulo de predicciones
const prediction = await analyzeTender(tenderData);

await recordTokenUsage({
  total_tokens: prediction.usage.total_tokens,
  prompt_tokens: prediction.usage.prompt_tokens,
  completion_tokens: prediction.usage.completion_tokens,
  model: 'gpt-4-turbo',
  provider: 'openai',
  feature: 'predictions',
  request_type: 'analysis'
});
```

#### 3. Embeddings

```typescript
// Para búsquedas semánticas
const embedding = await createEmbedding(searchQuery);

await recordTokenUsage({
  total_tokens: embedding.usage.total_tokens,
  prompt_tokens: embedding.usage.prompt_tokens,
  completion_tokens: 0, // Los embeddings no tienen completion
  model: 'text-embedding-ada-002',
  provider: 'openai',
  feature: 'search',
  request_type: 'embedding'
});
```

### Obtener Estadísticas

```typescript
import { getUserTokenUsage } from '@/lib/ai/token-tracker';

// En un componente o API route
const stats = await getUserTokenUsage();

console.log(`Total tokens: ${stats.total_tokens}`);
console.log(`Modelo principal: ${stats.model}`);
console.log(`Costo estimado: $${stats.total_cost}`);
```

## 🎨 Componente de UI

El componente `TokenCounter` ya está integrado en la página de perfil. Para agregarlo en otras partes:

```tsx
import TokenCounter from '@/components/dashboard/token-counter';

export default function MyPage() {
  return (
    <div>
      <TokenCounter />
    </div>
  );
}
```

## 💰 Cálculo de Costos

El sistema calcula automáticamente costos estimados basándose en los precios de OpenAI (actualizados a 2024):

| Modelo | Input (por 1M tokens) | Output (por 1M tokens) |
|--------|----------------------|------------------------|
| GPT-4 Turbo | $10.00 | $30.00 |
| GPT-4 | $30.00 | $60.00 |
| GPT-3.5 Turbo | $0.50 | $1.50 |
| Claude 3 Opus | $15.00 | $75.00 |
| Claude 3 Sonnet | $3.00 | $15.00 |
| Gemini Pro | $0.50 | $1.50 |

**Nota**: Actualiza los precios en `/lib/ai/token-tracker.ts` según cambien.

## 📊 Modelos Soportados

El sistema soporta automáticamente estos modelos:

### OpenAI
- `gpt-4-turbo`
- `gpt-4`
- `gpt-3.5-turbo`
- `text-embedding-ada-002`

### Anthropic
- `claude-3-opus`
- `claude-3-sonnet`
- `claude-3-haiku`

### Google
- `gemini-pro`
- `gemini-pro-vision`

Para agregar nuevos modelos, actualiza:
1. Precios en `token-tracker.ts`
2. Nombres display en `token-counter.tsx`

## 🔒 Seguridad

- **RLS (Row Level Security)**: Los usuarios solo ven sus propios datos
- **Autenticación requerida**: Todas las APIs requieren autenticación
- **Validación de datos**: Se validan todos los inputs antes de guardar

## 🔧 Mantenimiento

### Refrescar Vista Materializada

La vista se refresca automáticamente con cada INSERT/UPDATE/DELETE, pero puedes hacerlo manualmente:

```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY user_token_stats;
```

### Limpiar Datos Antiguos

```sql
-- Eliminar registros más antiguos de 90 días
DELETE FROM ai_token_usage 
WHERE created_at < NOW() - INTERVAL '90 days';
```

### Monitorear Uso Total

```sql
-- Ver top 10 usuarios por consumo
SELECT 
  u.email,
  uts.total_tokens,
  uts.total_cost,
  uts.primary_model
FROM user_token_stats uts
JOIN auth.users u ON u.id = uts.user_id
ORDER BY uts.total_tokens DESC
LIMIT 10;
```

## 📈 Métricas Disponibles

- **total_tokens**: Total de tokens consumidos
- **prompt_tokens**: Tokens de entrada (prompts)
- **completion_tokens**: Tokens de salida (respuestas)
- **total_requests**: Número de solicitudes
- **total_cost**: Costo estimado total
- **primary_model**: Modelo más utilizado
- **last_usage**: Última vez que se usó IA

## 🎯 Mejoras Futuras

- [ ] Dashboard de analíticas con gráficos
- [ ] Alertas por uso excesivo
- [ ] Comparación mes a mes
- [ ] Límites configurables por usuario
- [ ] Exportar reportes
- [ ] Integración con sistema de facturación

## 📞 Soporte

Para preguntas o problemas, contacta al equipo de desarrollo.
