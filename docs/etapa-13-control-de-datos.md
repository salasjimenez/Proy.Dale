---
layout: default
title: "Etapa 13 — Control de datos y privacidad"
---

# Etapa 13 — Control de datos y privacidad

Versión: `0.13.0`

## Objetivo

Dar al usuario control directo sobre la información persistida por Dale sin introducir servicios externos ni modificar el modelo de datos.

## Capacidades

- Exportación autenticada de datos personales en JSON.
- Eliminación de una práctica individual.
- Eliminación completa del historial de prácticas.
- Eliminación definitiva de la cuenta con revalidación de contraseña.
- Borrado en cascada de métricas y sesiones asociado a las relaciones ya existentes en PostgreSQL.
- Controles visibles desde `/cuenta`.
- Política de privacidad actualizada con acceso, portabilidad y eliminación.

## Endpoints

- `GET /api/auth/export`
- `DELETE /api/auth/me`
- `DELETE /api/sesiones`
- `DELETE /api/sesiones/:id`

Todas las rutas requieren autenticación. La eliminación de cuenta exige además la contraseña actual.

## Modelo de datos

No se crea una migración en esta etapa. `Sesion.usuario` ya utiliza `onDelete: Cascade` y `Metrica.sesion` también utiliza `onDelete: Cascade`, por lo que la eliminación de un usuario o una sesión mantiene la integridad referencial.

## Seguridad

La exportación nunca incluye `passwordHash`, JWT ni secretos del servidor. La contraseña usada para confirmar la eliminación de cuenta se valida en memoria y no se persiste nuevamente.
