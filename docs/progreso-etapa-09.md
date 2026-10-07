---
layout: default
title: "Etapa 09 — Mi voz, mi progreso"
---

# Etapa 09 — Mi voz, mi progreso

Versión: `0.9.0`

Esta etapa incorpora el primer dashboard de progreso de Dale. El objetivo es mostrar tendencias de prácticas completadas sin convertir los puntajes en diagnósticos personales.

## Flujo

1. El usuario inicia sesión.
2. `GET /api/progreso` consulta únicamente sus sesiones completadas.
3. El backend obtiene las métricas ya persistidas en PostgreSQL.
4. El frontend dibuja una serie cronológica con SVG nativo.
5. El usuario puede filtrar por todas las prácticas, voz o texto y cambiar la métrica visible.

## Endpoint

`GET /api/progreso?modalidad=TODAS&limit=30`

La ruta requiere autenticación. `modalidad` admite `TODAS`, `VOZ` o `TEXTO`. El límite se acota entre 2 y 50.

El resumen devuelve:

- total de prácticas completadas según el filtro;
- puntaje promedio;
- último puntaje;
- mejor puntaje;
- diferencia entre el primer y último puntaje visible;
- cantidad visible de prácticas por voz y texto;
- promedio de palabras por minuto de los intentos de voz visibles.

La serie incluye puntaje general, ritmo, pausas y muletillas, además de datos básicos del escenario.

## Visualización

`ProgressDashboard.vue` utiliza SVG generado en el navegador para la línea y el área del gráfico. No se agrega una dependencia de gráficos ni se genera una imagen adicional.

Las métricas de ritmo y pausas solo existen para sesiones de voz. Cuando una métrica no está disponible, la interfaz lo indica en lugar de inventar valores.

## Persistencia

Esta etapa no modifica `schema.prisma` ni crea una migración. Reutiliza las tablas `sesiones`, `metricas` y `escenarios` existentes.

## Privacidad

El dashboard consulta únicamente información del usuario autenticado mediante la cookie de sesión. No expone datos de otros usuarios y no incorpora audio almacenado.
