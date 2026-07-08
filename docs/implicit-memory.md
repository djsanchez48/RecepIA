# Fulse — Plan: Memoria de preferencias implícitas

**Estado: Planificado 📋**

## Objetivo

Que Fulse aprenda de lo que el usuario **hace** (no solo de lo que dice): qué recetas guarda, cuáles cocina, cuáles descarta, qué ingredientes quita al ajustar. Con esos patrones, la app enriquece automáticamente el contexto de la IA y sugiere preferencias estables — sin que el usuario tenga que configurarlas a mano.

**Prerequisito:** ninguno. Compatible con el perfil explícito y los profileHints existentes. No requiere autenticación: todo se guarda contra el `UserProfile` singleton (`id: "main"`) y migra 1:1 cuando haya usuarios reales.

## Principios de diseño (CRÍTICOS)

1. **Transparencia total.** El usuario puede ver todo lo que Fulse aprendió, borrar cualquier insight individual, o apagar el aprendizaje implícito por completo.
2. **Confianza acumulada, nunca conclusiones apresuradas.** Un solo evento no genera preferencia. Se requieren N ocurrencias consistentes antes de actuar (umbral por tipo de señal).
3. **Sugerir, no imponer.** Los insights de alta confianza se ofrecen como chips (mismo flujo accept/reject que profileHints). Los de confianza media solo se inyectan como *contexto suave* en el prompt, jamás como restricción dura.
4. **Alergias jamás se infieren.** Una alergia solo entra al perfil por declaración explícita del usuario. El aprendizaje implícito no toca ese campo.
5. **Respeto de rechazos.** Si el usuario rechazó un hint (`rejectedHints`), la memoria implícita no vuelve a sugerirlo, aunque la evidencia crezca.
6. **Minimización de datos.** Solo se trackean interacciones con recetas dentro de la app. Nada sale a proveedores de IA salvo conclusiones agregadas y anónimas ("suele preferir recetas altas en proteína").

## Señales que se capturan

| Señal | Evento | Peso | Interpretación |
|---|---|---|---|
| Guardar receta generada | `recipe_saved` | +2 | Afinidad con ingredientes, tags y badges de la receta |
| Añadir a colección | `recipe_collected` | +1 | Refuerzo de afinidad |
| Marcar "Cociné esto" (nuevo botón) | `recipe_cooked` | +3 | Señal más fuerte: pasó del guardado a la acción |
| Borrar receta guardada | `recipe_deleted` | −2 | Señal negativa sobre sus ingredientes/tags |
| Descartar draft sin guardar | `draft_discarded` | −1 | Señal negativa débil |
| Ajuste que quita ingrediente ("sin cebolla") | `ingredient_removed` | −2 | Si se repite ≥3 veces → candidato a disliked |
| Ajuste que agrega ingrediente | `ingredient_added` | +2 | Si se repite ≥3 veces → candidato a loved |

## Cambios al modelo de datos

### Nuevo modelo `PreferenceEvent` (log de eventos, append-only)

```prisma
model PreferenceEvent {
  id        String   @id @default(cuid())
  type      String   // "recipe_saved"|"recipe_collected"|"recipe_cooked"|"recipe_deleted"|"draft_discarded"|"ingredient_removed"|"ingredient_added"
  entity    String   // "ingredient"|"tag"|"badge"
  value     String   // ej: "pollo", "italiana", "alta_proteina"
  weight    Int      // según tabla de señales
  recipeId  String?  // referencia débil (la receta puede borrarse)
  createdAt DateTime @default(now())

  @@index([entity, value])
  @@index([createdAt])
}
```

### Nuevo modelo `ImplicitInsight` (agregados derivados)

```prisma
model ImplicitInsight {
  id          String   @id @default(cuid())
  entity      String   // "ingredient"|"tag"|"badge"
  value       String
  score       Float    // suma ponderada de eventos
  occurrences Int      // cantidad de eventos que aportaron
  polarity    String   // "positive"|"negative"
  status      String   @default("observing") // "observing"|"suggested"|"accepted"|"rejected"|"muted"
  evidence    Json     @default("[]")         // últimos 5 eventos resumidos, para transparencia
  updatedAt   DateTime @updatedAt

  @@unique([entity, value, polarity])
}
```

### Extender `UserProfile`

```prisma
model UserProfile {
  // ...existentes...
  implicitLearningEnabled Boolean @default(true) // kill-switch global
}
```

### Extender `Recipe`

```prisma
model Recipe {
  // ...existentes...
  cookedCount  Int       @default(0)
  lastCookedAt DateTime?
}
```

## Pipeline de aprendizaje

```
Interacción del usuario
        │
        ▼
 1. CAPTURA — el endpoint correspondiente registra PreferenceEvent(s)
    (guardar receta → un evento por ingrediente + por tag + por badge)
        │
        ▼
 2. AGREGACIÓN PEREZOSA — al generar una receta (o máx 1 vez/día),
    se recalculan los ImplicitInsight afectados desde los eventos
        │
        ▼
 3. CLASIFICACIÓN por umbral:
    · score ≥ +8 y occurrences ≥ 4  → candidato "loved"      → status: suggested
    · score ≤ −6 y occurrences ≥ 3  → candidato "disliked"   → status: suggested
    · |score| intermedio             → contexto suave          → status: observing
        │
        ▼
 4. SALIDA:
    a) status=suggested → chip en UI (mismo patrón que profileHints):
       "He notado que siempre quitás la cebolla. ¿Guardo que no te gusta?"
       Aceptar → pasa a UserProfile.dislikedIngredients + status: accepted
       Rechazar → status: rejected (nunca se vuelve a sugerir)
    b) status=observing con |score| ≥ 4 → bloque de contexto suave en el
       system prompt: "Patrones observados (orientativos, no restricciones):
       suele guardar recetas con pollo y pasta; suele preferir alta_proteina"
```

### Reglas anti-ruido

- Eventos con más de 180 días no cuentan para el score (decay por ventana).
- Máximo 1 chip de sugerencia por sesión de generación (no bombardear).
- `rejectedHints` y `status: rejected` bloquean re-sugerencias permanentemente.
- El contexto suave inyecta máximo 3 patrones positivos y 2 negativos, ordenados por score.
- Ingredientes ya presentes en el perfil explícito no generan insights (ya se saben).

## API

- `POST /api/insights/track` — registra eventos (lo llaman internamente los endpoints de recetas al guardar/borrar; el cliente lo llama para `recipe_cooked` y `draft_discarded`)
- `GET /api/insights` — lista insights con evidencia (para la UI de transparencia)
- `PUT /api/insights/[id]` — aceptar/rechazar/silenciar un insight
- `DELETE /api/insights/[id]` — borrar insight + sus eventos asociados
- `PUT /api/profile` — nuevo campo `implicitLearningEnabled`

Los endpoints existentes que se tocan:
- `POST /api/recipes` (guardar) → dispara captura de eventos positivos
- `DELETE /api/recipes/[id]` → dispara captura de eventos negativos
- `POST /api/recipes/[id]/collections` → evento `recipe_collected`
- `generateRecipe()` → detecta ajustes "sin X"/"con X" comparando mensajes, y dispara agregación perezosa + inyección de contexto suave

## UI

1. **Detalle de receta** → botón "🍳 Cociné esto" (contador + evento `recipe_cooked`).
2. **Crear** → chips de sugerencia de alta confianza (reutiliza el componente de profileHints, con copy distinto: "He notado que...").
3. **Ajustes → sección "Lo que Fulse aprendió 🧠"**:
   - Lista de insights aceptados y en observación, con su evidencia ("guardaste 6 recetas con pollo").
   - Botón borrar por insight.
   - Toggle "Aprendizaje automático" (`implicitLearningEnabled`) — al apagarlo se deja de capturar y de inyectar contexto; los datos existentes se conservan hasta que el usuario los borre.
   - Botón "Borrar toda la memoria implícita" (borra eventos + insights).

## i18n

Todas las strings nuevas van a `src/lib/i18n.ts` (ES + EN) con re-sync de `i18n-context.tsx` (Regla #1). Keys previstas: `insights.title`, `insights.cooked_this`, `insights.suggestion_prefix`, `insights.evidence_saved_n`, `insights.learning_toggle`, `insights.delete_all`, etc.

## Tests

- `tests/insights.test.ts`: scoring puro (suma ponderada, decay 180 días, umbrales de clasificación), bloqueo por rejectedHints, límite de patrones en contexto suave.
- Mock de Prisma con `vi.hoisted()` (Regla #7).

## Fases de implementación

| Fase | Alcance | Entregable |
|---|---|---|
| 1 | Modelos + migración + captura de eventos en save/delete/collect | Eventos registrándose en DB |
| 2 | Agregación perezosa + scoring + contexto suave en system prompt | La IA recibe patrones observados |
| 3 | Chips de sugerencia + botón "Cociné esto" + detección de ajustes | Sugerencias visibles y accionables |
| 4 | UI de transparencia en Ajustes + toggle + borrado | Control total del usuario |

## Fuera de alcance

- Inferencia de alergias (jamás).
- Análisis de sentimiento sobre texto libre del chat (eso ya lo cubre profileHints).
- Recomendaciones proactivas tipo feed ("te podría gustar...").
- Aprendizaje entre usuarios / colaborativo (no hay multiusuario).
- Embeddings o vector search — el volumen de un solo usuario no lo justifica; contadores ponderados alcanzan.
