# RecepIA — Plan: Onboarding y perfil vivo

## Objetivo
Primera receta en <90s, perfil construido dentro de la experiencia (no en un formulario).

## 3 capas
1. **Micro-onboarding** (`/bienvenida`): alergias/restricciones + objetivo. Saltable. Nunca reaparece.
2. **Perfil vivo**: IA detecta preferencias en ajustes ("odio el cilantro") → chip "¿Guardo?"
3. **Nudges**: invitaciones puntuales a completar perfil, máx 1/sesión, máx 2 veces total.

## DB
- `onboardingCompletedAt DateTime?` 
- `rejectedHints String[] @default([])`
- `nudgeState Json @default("{}")`

## Estado: Pendiente
