# Dale

Dale es una plataforma web gratuita, responsive y de código abierto para practicar comunicación en situaciones reales y medir el progreso de forma gradual.

## Estado actual

Versión `0.5.0` — frontend base conectado al catálogo real de escenarios.

- Frontend: Astro + Vue + Tailwind CSS.
- Backend: Node.js + Express + TypeScript.
- Base de datos: PostgreSQL + Prisma ORM.
- Desarrollo local: Docker Compose.
- Imagen única del proyecto: `frontend/public/DaleConTodoMiKing.png`.

## Desarrollo local

1. Crear `backend/.env` y `frontend/.env` desde sus respectivos `.env.example`.
2. En este equipo se recomienda `POSTGRES_PORT=5433` para evitar colisión con PostgreSQL local.
3. Instalar dependencias con `npm install`.
4. Levantar PostgreSQL con `npm run db:up`.
5. Aplicar migraciones con `npm run prisma:deploy`.
6. Cargar escenarios con `npm run db:seed`.
7. Ejecutar backend con `npm run dev:backend`.
8. En otra terminal ejecutar frontend con `npm run dev:frontend`.
9. Abrir `http://localhost:4321`.

## Endpoints actuales

- `GET /ping`
- `GET /api/escenarios/status`
- `GET /api/escenarios`
- `GET /api/escenarios/categorias`
- `GET /api/escenarios/:slug`

## Variables públicas

El frontend usa únicamente:

```env
PUBLIC_API_URL=http://localhost:3000
```

Las credenciales PostgreSQL y secretos permanecen exclusivamente en el backend.
