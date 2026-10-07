---
layout: default
title: "Backend base - Etapa 3"
---

# Backend base - Etapa 3

La Etapa 3 incorpora el servidor HTTP real de Dale y conecta Express con PostgreSQL mediante Prisma.

## Estructura

- `src/app.ts`: configura Express, Helmet, CORS, JSON y rutas.
- `src/server.ts`: conecta Prisma, levanta el puerto y realiza cierre controlado.
- `src/config/env.ts`: valida las variables de entorno mínimas.
- `src/lib/prisma.ts`: mantiene una instancia única de `PrismaClient`.
- `src/routes/ping.routes.ts`: health check de API y base de datos.
- `src/routes/*.routes.ts`: módulos preparados para autenticación, escenarios y sesiones.
- `src/middleware/`: respuestas 404 y manejo central de errores.

## Endpoints disponibles

| Método | Ruta | Propósito |
| --- | --- | --- |
| GET | `/ping` | Comprueba que API y PostgreSQL responden. |
| GET | `/api/auth/status` | Confirma que el módulo de auth está montado. |
| GET | `/api/escenarios/status` | Confirma que el módulo de escenarios está montado. |
| GET | `/api/sesiones/status` | Confirma que el módulo de sesiones está montado. |

Los tres endpoints `/status` son comprobaciones estructurales. La lógica funcional de esos módulos se implementará en versiones posteriores.

## Inicio local

Desde la raíz:

```bash
cp backend/.env.example backend/.env
# Reemplazar CHANGE_ME en backend/.env
npm install
npm run db:up
npm run prisma:deploy
npm run dev:backend
```

Validación:

```bash
curl http://localhost:3000/ping
curl http://localhost:3000/api/auth/status
curl http://localhost:3000/api/escenarios/status
curl http://localhost:3000/api/sesiones/status
```

## Migración inicial

`backend/prisma/migrations/20260929000100_init/migration.sql` crea el esquema definido en la Etapa 2. Es código de migración y sí debe versionarse. Los dumps y archivos SQL ajenos a `backend/prisma/migrations/` continúan excluidos por `.gitignore`.
