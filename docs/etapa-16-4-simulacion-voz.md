---
layout: default
title: "Etapa 16.4 — Simulación secuencial y analítica vocal"
---

# Etapa 16.4 — Simulación secuencial y analítica vocal

Versión: `0.16.4`.

## Qué se implementa

- `/simulacion?escenario=<slug>`: simulación por tres fases — apertura, objeción y presión — a partir de los escenarios existentes en PostgreSQL. Las objeciones se eligen por categoría y el nivel `DIFICIL` activa mayor presión en la tercera fase.
- `/analisis-voz`: tablero de los últimos 30 intentos por voz, con puntaje medio, palabras por minuto, pausas, muletillas, evolución y tabla accesible.
- El selector de `/entrenar`, los escenarios destacados y el catálogo dirigen a la nueva simulación. Voz es la modalidad recomendada, mientras que texto permanece disponible para accesibilidad y navegadores sin reconocimiento de voz.
- El footer ofrece **Creador**: modal con avatar ilustrado, nombre **Jhonn Pether** y enlace explícito a `https://www.instagram.com/pitx29/`.

## Arquitectura y compatibilidad

Una nueva simulación crea una sesión mediante `POST /api/sesiones`. Cada respuesta parcial se conserva temporalmente en memoria del navegador; no se guarda por separado. Al completar las tres fases se envía una única transcripción, duración agregada y pausas ajustadas en el tiempo a `POST /api/sesiones/:id/completar`. El backend sigue aplicando las reglas de validación y cálculo de métricas existentes. No se cambia el esquema Prisma, ni los endpoints ni los historiales previos. Los resultados se conservan como **una sesión consolidada**, por lo que la analítica histórica no ofrece puntuaciones por fase.

El botón de abandono llama a `DELETE /api/sesiones/:id` y solo confirma descarte cuando el servidor lo acepta. Cerrar la pestaña sin usar ese botón puede dejar una sesión `INICIADA`, como en la experiencia antigua. El temporizador breve es orientativo y nunca graba, finaliza ni envía respuestas automáticamente.

## Estados de resultado

Los estados **Entrenamiento superado** (puntaje >=75), **En progreso** (55–74), **Refuerzo recomendado** (<55), **Completada sin puntaje** y **Simulación no completada** son etiquetas pedagógicas. Un puntaje resume estimaciones de ritmo, pausas, muletillas y otras señales implementadas; no mide persuasión, confianza, empatía ni éxito real ante otra persona. No hay interlocutor generado por IA ni reconocimiento de emociones.

## Voz y privacidad

Dale no conserva archivos de audio ni video. El reconocimiento puede implicar procesamiento externo por el navegador. La cámara y la inferencia de expresiones faciales **no se incorporan en la v0.16.4** y requieren diseño de consentimiento, justificación de métricas y revisión de privacidad antes de experimentarse.

## Validación

```bash
npm run voice:check
npm run training:check
npm run home:check
npm run responsive:check
npm run docs:check
npm run check
```

Revisión manual: registro/login, micrófono concedido y denegado, tres fases por voz, tres por texto, abandono, error de guardado con reintento, tablero sin datos/con datos, modal con teclado/Escape, navegación a 320–1920 px y zoom al 200 %. No se garantiza certificación WCAG por el simple hecho de superar tests automatizados.
