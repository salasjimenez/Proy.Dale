---
layout: default
title: "Etapa 14 - Páginas legales"
---

# Etapa 14 - Páginas legales

Versión: `0.14.0` | Fecha: 10 de octubre de 2026.

## Rutas

- `/privacidad`: datos de cuenta (correo, nombre opcional, hash bcrypt), historial, transcripciones, métricas, aceptación, tratamiento de voz en el navegador y exportación o eliminación desde `/cuenta`.
- `/terminos`: uso aceptable, cuentas, límites, cambios y responsabilidad.
- `/cookies`: única cookie necesaria de autenticación. Sin banner para cookies no esenciales porque esta versión no incorpora tales cookies.

Las tres comparten la fecha visible definida en `frontend/src/lib/legal.ts` y se enlazan desde el footer global.

## Registro obligatorio

`POST /api/auth/register` requiere un campo JSON con valor booleano exacto `true`:

```json
{
  "nombre": "Ana",
  "email": "ana@example.com",
  "password": "Clave1234",
  "aceptaTerminos": true
}
```

La falta de aceptación, `false`, cadenas o números retornan `400 VALIDATION_ERROR` con el campo `fields.aceptaTerminos`. La validación se realiza antes de acceder a PostgreSQL. El servicio verifica de nuevo la aceptación.

## Persistencia y migración

Migración `20261010000100_legal_acceptance` sobre `usuarios`:

- `terminos_aceptados_en` (`TIMESTAMPTZ`, nullable)
- `version_legal_aceptada` (`VARCHAR(20)`, nullable)

Se mantienen como opcionales para usuarios existentes; nuevos registros escriben la fecha efectiva y la versión `2026-10-10`. El JSON exportado desde `/cuenta` incluye ambos campos. El seed existente solo carga escenarios y no se crean usuarios ficticios.

## Sesiones

La cookie `HttpOnly` usa `AUTH_COOKIE_NAME` (`dale_session` por defecto); `AUTH_COOKIE_SECURE` debe ser `true` en HTTPS de producción, `AUTH_COOKIE_SAME_SITE` predetermina `lax` y la duración se controla con `JWT_EXPIRES_IN_SECONDS` (604800 segundos por defecto).

## Verificación

```bash
npm install
npm run prisma:generate --workspace=backend
npm run prisma:validate --workspace=backend
npm run test --workspace=backend
npm run build
# Aplicar migraciones a la base configurada, solo en el entorno elegido:
npm run prisma:deploy
```

Comprobar las tres rutas, el footer y el formulario desde una ventana de 360 px y en escritorio, incluyendo navegación con teclado, foco visible y enlaces. El reconocimiento de voz del navegador puede implicar tratamiento del audio por el proveedor, pero Dale no almacena archivos de audio.

> Nota: la documentación y los textos legales son una base técnica. Antes del lanzamiento público un profesional debe revisar las obligaciones según jurisdicción, operador, contacto, retención y proveedores.
