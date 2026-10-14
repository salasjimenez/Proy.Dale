---
layout: default
title: "Etapa 16.2 — Entrenamiento personalizado"
---

# Etapa 16.2 — Entrenamiento personalizado

Versión: `0.16.2`.

## Objetivo

Transformar la selección por categorías de la v0.16.1 en un recorrido de entrenamiento por objetivos personales. No se introducen modelos de IA ni diagnósticos: las sugerencias utilizan escenarios existentes y métricas reales.

## Flujo

1. En `/` o `/entrenar`, el usuario escoge un objetivo y una de las seis situaciones sugeridas.
2. Selecciona la etapa **Preparación**, **Práctica guiada** o **Simulación real** y el modo **Texto** o **Voz**.
3. Opcionalmente activa una sesión breve de cinco minutos. El temporizador es orientativo: **no termina ni envía contenido automáticamente**.
4. `/practicar` muestra tres momentos: **Prepárate**, **Entrena** y **Revisa**. Los resultados incluyen la retroalimentación original y una sugerencia determinista para el siguiente intento.
5. Puede repetir libremente cualquier etapa; la sugerencia de avanzar (puntaje general >= 75) no bloquea opciones.

## Rutas

- `/entrenar`: selector de objetivo, etapa y modalidad.
- `/entrenar?rapido=1`: activa por defecto la opción de entrenamiento breve.
- `/practicar?escenario=entrevista-trabajo-basico&modalidad=TEXTO&rapido=1`: ejemplo de sesión breve.
- `/progreso` y `/mapa`: no se modifican.

## Reglas técnicas

- `frontend/src/lib/training.ts` contiene la lista pública de objetivos y las reglas puras para URL, avance, cuenta regresiva y recomendaciones.
- `frontend/src/components/vue/TrainingPlanner.vue` realiza la selección. No guarda preferencias ni requiere sesión para visualizarse.
- `frontend/src/components/vue/PracticeSimulator.vue` mantiene los endpoints existentes de sesión. Se agregan una cabecera por etapas y un temporizador orientativo.
- El frontend puede sugerir avanzar a la siguiente etapa tras un puntaje general de 75 o más, con independencia de la modalidad; no constituye una certificación ni una medición psicológica.
- Los consejos sobre muletillas, repeticiones y ritmo solo se muestran según los indicadores existentes. Nunca se infiere emoción, postura, confianza o lenguaje corporal.
- Los códigos de Prisma `BASICO`, `INTERMEDIO`, `DIFICIL` y todos los slugs se mantienen intactos.
- Los cambios de navegación móvil se realizan con HTML nativo y foco visible. El modo de alto contraste y el onboarding siguen disponibles.

## Validación

```bash
npm install
npm run prisma:generate --workspace=backend
npm run training:check
npm run home:check
npm run docs:check
npm run check
```

`training:check` valida que todos los objetivos remitan a slugs del seed, que las ilustraciones existan, que las reglas de avance sean coherentes y que el recorrido de cinco minutos no dependa de servicios externos. La revisión manual sigue siendo necesaria para probar las modalidades voz/texto, Tab/Escape, zoom, 360 px y escritorio.

## Límites de privacidad

No se introducen cookies, analítica, nuevos datos personales ni servicios de IA. La captura de voz mantiene el comportamiento existente: Dale no conserva archivos de audio y el proveedor de reconocimiento del navegador puede procesarlo según su política.
