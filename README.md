# Dale

Dale es una plataforma web gratuita, responsive y de código abierto para practicar comunicación en situaciones reales y medir el progreso de forma gradual.

## Estado actual

Versión `0.7.0` — autenticación propia, catálogo de escenarios y primer simulador persistente por texto.

- Frontend: Astro + Vue + Tailwind CSS.
- Backend: Node.js + Express + TypeScript.
- Base de datos: PostgreSQL + Prisma ORM.
- Autenticación: email/contraseña, bcrypt, JWT y cookie `HttpOnly`.
- Práctica actual: texto, con sesiones y métricas básicas persistidas.
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

## Variables públicas

El frontend usa únicamente:

```env
PUBLIC_API_URL=http://localhost:3000
```

Las credenciales PostgreSQL, `JWT_SECRET` y cualquier otro secreto permanecen exclusivamente en el backend.
