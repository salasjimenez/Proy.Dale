# Dale

Dale es una plataforma web gratuita y de codigo abierto orientada a practicar comunicacion en situaciones reales.

## Estado

Etapa 1 - estructura inicial del monorepo (`v0.1.0`).

## Arquitectura base

- `frontend/`: Astro + Vue + Tailwind CSS.
- `backend/`: Node.js + Express + TypeScript + Prisma.
- PostgreSQL local mediante Docker Compose.
- `docs/`: documentacion tecnica.
- `.github/workflows/`: automatizaciones CI/CD y documentacion en etapas posteriores.

## Preparacion local

1. Copiar `backend/.env.example` a `backend/.env`.
2. Cambiar los valores `CHANGE_ME` por valores locales seguros.
3. Copiar `frontend/.env.example` a `frontend/.env`.
4. Instalar dependencias desde la raiz con `npm install`.
5. Levantar PostgreSQL con `docker compose --env-file backend/.env up -d postgres`.

El backend funcional, Prisma schema y la interfaz Astro se agregaran en las siguientes etapas.

## Seguridad

Los archivos `.env`, volcados de base de datos y datos persistentes estan excluidos de Git. El frontend solo conocera la URL publica de la API y nunca tendra acceso directo a PostgreSQL.

## Identidad visual

El proyecto utiliza un unico archivo de imagen de marca: `frontend/public/DaleConTodoMiKing.png`. No se incluyen imagenes de marca alternativas.
