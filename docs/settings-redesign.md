# Fulse — Rediseño de la pantalla de Perfil / Ajustes

Spec de implementación. App móvil de recetas con IA (tema oscuro, acento naranja). Este documento es la fuente de verdad: descríbelo tal cual, no hay mockup visual que consultar.

---

## 0. Objetivo del cambio

La pantalla actual mezcla cuatro trabajos (perfil, configuración, biblioteca de recetas y medidor de uso) sin jerarquía, y tenía tres formas distintas de guardar datos. Este rediseño la reduce a un solo trabajo: **"lo que Fulse sabe de ti para cocinar a tu medida"**. Todo lo que no sea eso sale de la pantalla.

**Regla global de guardado:** no hay botón "Guardar". Todo autoguarda al cambiar y muestra un indicador `✓ Guardado` en el header. Debounce ~600 ms por campo.

**Eliminar de la versión anterior:**
- Barra de progreso "0 de 7" (esta es la pantalla de perfil recurrente, no el onboarding).
- Botón "Guardar perfil".
- Sección "Mis listas" (Favoritas / Aderezos) → esto es contenido, va en el Recetario, no aquí.
- El párrafo largo de privacidad en medio del formulario → colapsarlo tras un link "Por qué lo pedimos".

---

## 1. Design tokens (CSS variables)

```css
--bg:#0E0E10;          /* fondo pantalla */
--surface:#17171A;     /* cards, inputs */
--surface-2:#1E1E22;
--border:#2A2A2F;
--text:#F2F2F3;
--text-dim:#8A8A90;
--text-faint:#5E5E64;
--accent:#FF5A1F;      /* naranja de marca */
--accent-soft:rgba(255,90,31,0.12);
--accent-border:rgba(255,90,31,0.35);
--ok:#5FCB7E;          /* check "guardado" */
--radius:14px;         /* cards */
--radius-input:11px;   /* inputs */
--pill:999px;          /* chips/tags */
```
Fuente: system sans (`-apple-system, Inter, Roboto`). Título 26px/700, eyebrows 11px/700 uppercase letter-spacing 1.4px, body 13–14px.

---

## 2. Estructura de la pantalla (orden top → bottom)

Todo dentro de un scroll vertical. Orden por impacto en el output, no por orden de implementación.

### Header
- Marca "🍳 Fulse" centrada arriba, separada por un borde inferior.
- H1: **Tu perfil**
- Subtítulo (text-dim): "Lo que Fulse usa para cocinar a tu medida."
- A la derecha del H1, chip de estado: `✓ Guardado` (check en `--ok`, fondo `--surface`, borde). Aparece/actualiza al autoguardar.

### Sección A — Mi objetivo
Eyebrow: `MI OBJETIVO`
Hint: "Elige uno. Fulse ajusta cada receta a esta meta."

- **Selector de meta principal = single-select** (segmented). Opciones:
  `Bajar de peso` · `Ganar masa muscular` · `Comer más saludable` · `Mantenerme`
  - Solo una activa a la vez. Activa: fondo `--accent`, texto blanco. Inactiva: fondo `--surface`, texto `--text-dim`.
  - Esto resuelve el bug conceptual anterior donde "bajar de peso" y "ganar masa muscular" podían estar activas juntas.

- Sub-bloque **Ajustes** (multi-select, opcional):
  Eyebrow `AJUSTES`, hint: "Opcionales. Se apilan sobre tu meta, no la reemplazan."
  Chips (toggle múltiple): `Más proteína` · `Menos azúcar` · `Menos sal` · `Más vegetales` · `Comer económico`
  - Chip activo: fondo `--accent-soft`, borde `--accent-border`, texto `#FF8A5B`. Inactivo: `--surface`/`--text-dim`.

### Sección B — Mi Memoria (bloque destacado, diferenciador)
Card con fondo degradado suave del acento (`linear-gradient(135deg, rgba(255,90,31,.10), rgba(255,90,31,.03))`) y borde `--accent-border`.
- Fila superior: icono 🧠 + título **Mi Memoria** + badge `AUTOMÁTICO` (texto acento, fondo `--accent-soft`, pill).
- Texto: "Fulse aprende en silencio de lo que cocinas y guardas. Esto ya lo detectó:"
- Lista de chips de "lo aprendido" (ejemplos poblados desde el backend de memoria): `Recetas de menos de 30 min`, `Cocina para 3`, `Evita fritos`.
- CTA link: "Ver y editar lo aprendido →" (navega a la pantalla de memoria).
- Nota: es el diferenciador del producto vs. un generador genérico. Va arriba, con espacio, no de pie de página.

### Sección C — Tu cuerpo
Eyebrow `TU CUERPO`
Hint: "Opcional. Afina porciones y macros. [Por qué lo pedimos]" (el link abre un modal/acordeón con el texto de privacidad — NO lo pongas inline).
- Grid 2 columnas:
  - `Edad` (número) — ej. 35
  - `Peso (kg)` (número) — ej. 70
  - `Estatura (cm)` (número) — ej. 170
  - `Actividad` (select) — valores: Sedentario / Ligero / Moderado / Alto. Default "Moderado".
- Campo `Sexo · para estimar macros` (la nota justifica por qué se pide). Chips single-select: `Hombre` · `Mujer` · `Prefiero no decir`.

### Sección D — Tu cocina y gustos
Eyebrow `TU COCINA Y GUSTOS`
Hint: "Lo que más cambia el resultado de cada receta."
- `Alergias` — tag-input. Tags existentes con ✕ para borrar (ej. `coliflor`). Placeholder input: "agrega una…".
- `Restricciones` — tag-input. Placeholder: "sin gluten, bajo en azúcar…".
- `Ingredientes que no me gustan` — tag-input. Placeholder: "cilantro…".
- `Ingredientes que me encantan` — tag-input. Placeholder: "ajo, limón…".
- `Equipo de cocina` — tag-input con tags (ej. `airfryer`). Placeholder: "olla a presión, horno…".
- `Porciones por defecto` — stepper (– / valor / +), rango 1–12, default 3.

Estilo tag: fondo `--accent-soft`, borde `--accent-border`, texto `#FF8A5B`, ✕ clickeable.

### Sección E — Cuenta (footer, separado por borde superior)
Eyebrow `CUENTA`
- `Idioma` — toggle pill pequeño `Español` / `English` (se mueve aquí abajo: es trivial, no compite con objetivo).
- Fila de plan: card con `Plan Free` + subtítulo "1 generación este mes" a la izquierda, y link "Ver planes →" a la derecha (convierte el contador de uso suelto en gancho de monetización). Corrige el bug de copy "1 generaciones" → singular/plural correcto.
- Botón ghost `Cerrar sesión` (borde, texto `--text-dim`, sin relleno).

---

## 3. Comportamientos

- **Autosave:** cualquier cambio (toggle, chip, input blur, stepper, tag add/remove) persiste solo; el chip del header pasa a estado "guardando…" y vuelve a `✓ Guardado`.
- **Meta principal:** exactamente una seleccionada siempre (no permitir cero ni dos).
- **Ajustes/gustos:** multi-select libre.
- **Tag-inputs:** Enter o coma crea tag; ✕ o Backspace en vacío borra la última.
- **Privacidad:** el detalle vive detrás de "Por qué lo pedimos", nunca inline.
