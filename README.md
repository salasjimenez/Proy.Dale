# Dale

Dale es una plataforma web gratuita, responsive y de código abierto para practicar comunicación en situaciones reales y medir el progreso de forma gradual.

## Estado actual

Versión `0.8.0` — autenticación propia, catálogo de escenarios y simulador persistente por texto o voz.

- Frontend: Astro + Vue + Tailwind CSS.
- Backend: Node.js + Express + TypeScript.
- Base de datos: PostgreSQL + Prisma ORM.
- Autenticación: email/contraseña, bcrypt, JWT y cookie `HttpOnly`.
- Práctica: texto y voz con Web Speech API.
- Métricas de voz: palabras por minuto, pausas estimadas, muletillas, repeticiones y puntajes de ritmo/pausas.
- Privacidad de voz: Dale no almacena archivos de audio; persiste transcripción y métricas.
- Desarrollo local: Docker Compose.
- Imagen única del proyecto: `frontend/public/DaleConTodoMiKing.png`.

## Desarrollo local

1. Crear `backend/.env` y `frontend/.env` desde sus respectivos `.env.example`.
2. En este equipo se recomienda `POSTGRES_PORT=5433` para evitar colisión con PostgreSQL local.
3. Configurar un `JWT_SECRET` largo y aleatorio en `backend/.env`.
4. Instalar dependencias con `npm install`.
5. Levantar PostgreSQL con `npm run db:up`.
6. Aplicar migraciones con `npm run prisma:deploy`.
7. Cargar escenarios con `npm run db:seed` si la base está vacía.
8. Ejecutar backend con `npm run dev:backend`.
9. En otra terminal ejecutar frontend con `npm run dev:frontend`.
10. Abrir `http://localhost:4321`.

Para práctica por voz se recomienda Chrome o Edge actualizado. El sitio necesita permiso de micrófono y Web Speech API. `localhost` se considera un contexto seguro para las APIs de medios; en producción debe usarse HTTPS.

## Endpoints actuales

- `GET /ping`
- `GET /api/auth/status`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/escenarios/status`
- `GET /api/escenarios`
- `GET /api/escenarios/categorias`
- `GET /api/escenarios/:slug`
- `GET /api/sesiones/status`
- `GET /api/sesiones`
- `POST /api/sesiones`
- `GET /api/sesiones/:id`
- `POST /api/sesiones/:id/completar`

## Práctica por voz

El navegador realiza dos tareas durante una práctica de voz:

1. Web Speech API produce una transcripción en vivo.
2. Web Audio API estima intervalos de silencio del micrófono para construir métricas de pausa.

El backend recibe la transcripción, duración y marcas temporales de pausa; valida esos datos y calcula las métricas persistidas. El archivo de audio no se envía ni se guarda en Dale.

La disponibilidad y el procesamiento interno de Web Speech dependen del navegador. Algunos navegadores pueden utilizar servicios del proveedor para reconocimiento de voz; esta limitación está documentada en la interfaz y en `/docs`.

## Variables públicas

El frontend usa únicamente:

```env
PUBLIC_API_URL=http://localhost:3000
```

Las credenciales PostgreSQL, `JWT_SECRET` y cualquier otro secreto permanecen exclusivamente en el backend.
