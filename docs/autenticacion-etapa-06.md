---
layout: default
title: "Etapa 6 — Autenticación"
---

# Etapa 6 — Autenticación

Versión: `0.6.0`

Dale incorpora registro, inicio de sesión, consulta de sesión y cierre de sesión usando el backend propio.

## Flujo

1. El frontend envía correo y contraseña al backend.
2. El backend valida los datos.
3. La contraseña se guarda únicamente como hash `bcrypt`.
4. El backend firma un JWT con expiración configurable.
5. El JWT se entrega mediante una cookie `HttpOnly`, por lo que JavaScript del frontend no puede leerlo directamente.
6. `GET /api/auth/me` valida la cookie y devuelve únicamente datos públicos del usuario.
7. `POST /api/auth/logout` elimina la cookie de sesión.

## Endpoints

### POST `/api/auth/register`

```json
{
  "nombre": "Ana",
  "email": "ana@example.com",
  "password": "Clave1234",
  "aceptaTerminos": true
}
```

Respuesta `201`:

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "ana@example.com",
      "nombre": "Ana",
      "creadoEn": "2026-10-01T00:00:00.000Z"
    }
  }
}
```

### POST `/api/auth/login`

```json
{
  "email": "ana@example.com",
  "password": "Clave1234"
}
```

### GET `/api/auth/me`

Requiere la cookie de sesión o un `Authorization: Bearer <token>` válido.

### POST `/api/auth/logout`

Elimina la cookie de sesión.

> Desde la versión 0.14.0, el registro requiere `aceptaTerminos: true`. El backend rechaza la omisión o valores no booleanos y guarda la fecha y versión de la aceptación.

## Seguridad aplicada

- Hash de contraseña con bcrypt, 12 rondas.
- JWT HS256 con `issuer`, `audience`, `subject` y expiración.
- Cookie `HttpOnly` configurable mediante variables de entorno.
- CORS limitado a `FRONTEND_URL`.
- Respuestas de login sin revelar si el correo existe.
- Validación de longitud del correo, nombre y contraseña.
- El backend nunca devuelve `passwordHash`.

## Variables

```env
JWT_SECRET=CHANGE_ME_WITH_A_LONG_RANDOM_VALUE
JWT_EXPIRES_IN_SECONDS=604800
AUTH_COOKIE_NAME=dale_session
AUTH_COOKIE_SAME_SITE=lax
AUTH_COOKIE_SECURE=false
```

En producción con HTTPS, usar `AUTH_COOKIE_SECURE=true`. Si frontend y backend quedan en sitios distintos, revisar la política `SameSite` según el proveedor de despliegue.
