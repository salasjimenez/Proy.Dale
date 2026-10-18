---
layout: default
title: "v0.16.4-P1 — Simulación exigente y análisis de voz"
---

# v0.16.4-P1 — Parche de la dificultad Difícil

Este parche refuerza únicamente `DIFICIL` en `/simulacion`. Las etapas Preparación (`BASICO`) y Práctica guiada (`INTERMEDIO`) mantienen sus requisitos de respuesta anteriores.

## Qué cambia

- La secuencia sigue teniendo tres fases: **apertura**, **objeción** y **presión**.
- El nivel Difícil exige al menos **24, 30 y 35 palabras** respectivamente. La cantidad de palabras solo valida que exista una muestra mínima; no garantiza una respuesta correcta.
- Cada fase tiene una objeción por categoría y metas observables: presentar contexto, responder, justificar, ofrecer alternativa y concretar seguimiento. No se usa un modelo conversacional generativo ni se simula una respuesta dinámica del interlocutor.
- Al finalizar, la vista muestra **un desglose temporal por fase**, con palabras, ritmo estimado, pausas, porcentaje de silencios, muletillas y repeticiones. En modo texto se dejan sin datos las métricas acústicas.
- Se muestran coincidencias explícitas de **señales discursivas** en la transcripción. Su ausencia no significa que la comunicación haya fallado: otras expresiones pueden ser válidas y el reconocimiento de voz puede cometer errores.
- El estado «Reto no superado» indica únicamente que los **umbrales pedagógicos** configurados no se alcanzaron. No representa un fracaso real ni una evaluación psicológica.
- `/analisis-voz` agrega una sección de **simulaciones Difíciles por voz** basada en registros reales de `GET /api/progreso?modalidad=VOZ&limit=30`.

## Cómo se calcula

El **índice por fase** combina (en voz) indicios textuales explícitos (70 %) e indicadores vocales aproximados (30 %). La parte textual considera longitud mínima y expresiones sencillas sobre contexto, objeciones, alternativas y próximos pasos. La parte vocal se deriva de duración, palabras/minuto, pausas estimadas, muletillas y repeticiones. En modo texto no hay puntuación acústica. Todos estos pesos son orientativos y se usan para entrenamiento, no para inferir claridad real, confianza, emociones, actitud, contacto visual ni habilidades personales.

El resultado del reto utiliza el índice por fase **y** el puntaje general del backend. La analítica detallada por fase **no se envía como nuevos datos**, **no se guarda** en tablas y desaparece al cerrar o recargar la página. El backend sigue guardando una única transcripción consolidada y sus métricas habituales; el dashboard histórico solo dispone de esos valores consolidados.

## Compatibilidad y validación

- Base: Dale `0.16.4`, rama `main`; identificador de parche `P1` (no cambia el número de versión ni el modelo Prisma).
- Ejecutar `npm run hard:check`, `npm run voice:check`, `npm run docs:check` y `npm run check`.
- Probar con micrófono real: consentimiento, rechazo de permiso, respuesta corta, respuesta completa, pausa larga, objeciones, última fase, cierre y retroalimentación.
- Probar a 320, 360, 768 y 1440 px, con zoom de navegador y teclado; los resultados por fase deben mantenerse legibles.
- Verificar que una sesión por texto no muestre palabras/minuto ni pausas acústicas y que los resultados de historial no inventen datos individuales por fase.

No añade servicios externos, cámara, análisis facial ni almacenamiento de archivos de audio. No hay migraciones nuevas.
