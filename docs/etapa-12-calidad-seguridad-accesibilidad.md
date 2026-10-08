---
layout: default
title: "Etapa 12 — Robustez, seguridad y accesibilidad"
---

# Etapa 12 — Robustez, seguridad y accesibilidad

Versión: `0.12.0`

## Objetivo

Mejorar Dale sin cambiar su arquitectura base ni agregar servicios de pago. Esta etapa refuerza tres frentes: operación del backend, protección de autenticación y accesibilidad del frontend.

## Backend

- `GET /health/live`: confirma que el proceso Express está vivo sin consultar PostgreSQL.
- `GET /health/ready`: confirma que el backend puede acceder a PostgreSQL.
- `X-Request-Id`: cada respuesta incorpora un identificador de solicitud para diagnóstico.
- Rate limit en `/api/auth/login` y `/api/auth/register`.
- `trust proxy = 1` únicamente en producción para obtener IP de cliente detrás de un proxy de hosting.
- El límite de autenticación es configurable mediante variables de entorno.

## Frontend

- Enlace para saltar directamente al contenido principal.
- Estado `aria-current` en navegación.
- Respeto de `prefers-reduced-motion`.
- Página 404 propia.
- Mensajes de validación del formulario asociados a sus campos mediante `aria-describedby`.
- Estados de error y envío anunciables por tecnologías de asistencia.

## Variables nuevas

```env
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=10
```

## Consideración de escalado

El rate limit de esta etapa utiliza memoria del proceso. Es suficiente para una instancia inicial. Si Dale escala a varias réplicas, el contador debe migrarse a un almacenamiento compartido como Redis.

## Validación

```bash
npm run check
curl http://localhost:3000/health/live
curl http://localhost:3000/health/ready
```
