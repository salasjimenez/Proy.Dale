---
layout: default
title: "Documentación técnica de Dale"
---

# Documentación técnica de Dale

La documentación se mantiene separada del sitio de producción de la aplicación y está preparada para publicarse desde `/docs` mediante GitHub Pages.

## Estado por etapas

- `backend-etapa-03.md`: servidor Express, Prisma y salud.
- `catalogo-escenarios-etapa-04.md`: catálogo y filtros.
- `frontend-etapa-05.md`: Astro + Vue y páginas legales.
- `autenticacion-etapa-06.md`: registro, login y sesión.
- `simulador-texto-etapa-07.md`: primera práctica persistente.
- `simulador-voz-etapa-08.md`: Web Speech, micrófono, ritmo y pausas.
- `progreso-etapa-09.md`: dashboard personal y evolución temporal de métricas.
- `mapa-escenarios-etapa-10.md`: radar de fortalezas y cobertura por categoría.
- `ci-cd-etapa-11.md`: pruebas automatizadas, pipeline `test -> build -> deploy` y publicación de `/docs` en GitHub Pages.

## Componentes

Consulta el [catalogo de componentes](components/index.html) y el [codigo auxiliar](codigo/index.html). Ejecuta `npm run docs:sync` tras modificar archivos Vue o TypeScript; `npm run docs:check` detecta diferencias en CI.

Consulta tambien la [etapa 16: accesibilidad y onboarding](etapa-16-accesibilidad-onboarding.html).

## Experiencia de inicio v0.16.1

Consulta [redisenio de la portada y selector de entrenamientos](etapa-16-1-redisenio-home.html).

## Experiencia v0.16.2

[Entrenamiento personalizado y recomendaciones deterministas](etapa-16-2-entrenamiento-personalizado.html).

## Ajustes responsive v0.16.3

[Diseno adaptable, validacion por anchos y zoom](etapa-16-3-responsive.html).

## Simulaciones y voz (v0.16.4)

[Secuencia por fases, analitica vocal y privacidad](etapa-16-4-simulacion-voz.html).

## Parche de simulaciones exigentes (v0.16.4-P1)

[Reglas, limites y metricas de voz por fase](etapa-16-4-parche-dificil.html).
