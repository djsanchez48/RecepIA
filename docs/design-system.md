# Fulse — Sistema de diseño

**Estado: En progreso 📐**

## Tipografía

4 tamaños. Una excepción justificada.

| Token | Clase Tailwind | Tamaño | Uso |
|---|---|---|---|
| `title` | `text-xl` | 20px / 1.25rem | Títulos de página (h1). Bold. |
| `heading` | `text-base` | 16px / 1rem | Subtítulos de sección (h2), títulos de cards. Semibold. |
| `body` | `text-sm` | 14px / 0.875rem | Texto general, etiquetas, chips, botones, ingredientes, descripciones. |
| `caption` | `text-xs` | 12px / 0.75rem | Badges, tags, metadatos, timestamps, hints, notas al pie. |

### Excepciones

| Clase | Justificación |
|---|---|
| `text-lg` | **Pasos de receta.** Tamaño grande necesario para leer mientras se cocina con el teléfono apoyado en la mesada. |
| `text-5xl` | **Emoji de bienvenida.** Una sola ocurrencia decorativa. |

### Reglas

1. **No usar `text-2xl`, `text-3xl`, `text-4xl`, `text-base`.** Ya están cubiertos por los tokens de arriba.
2. **`font-bold` solo en títulos (title).** El resto usa `font-semibold` o `font-medium`.
3. **Los section headers llevan `font-semibold`**. No `font-bold`.
4. **Todo texto visible usa `text-zinc-*`** (modo claro) y `dark:text-zinc-*` (modo oscuro). Nada de negro puro ni blanco puro.
5. **`leading-relaxed`** solo en pasos de receta y descripciones largas. No en chips ni labels.

### Migración

| Antes | Ahora |
|---|---|
| `text-2xl font-bold` | `text-xl font-bold` |
| `text-lg font-semibold` | `text-base font-semibold` |
| `text-base` | `text-sm` |
| `text-sm` (body) | `text-sm` (sin cambio) |
| `text-xs` | `text-xs` (sin cambio) |

## Colores (próximamente)

TBD. Por ahora: zinc para neutros, orange para acentos, green/red/purple para badges y estados.

## Espaciado (próximamente)

TBD. Por ahora: `px-4 py-6` en contenedores, gaps de `gap-2` a `gap-4` entre secciones.

## Componentes (próximamente)

TBD. Botones, inputs, chips, cards — con clases consistentes.
