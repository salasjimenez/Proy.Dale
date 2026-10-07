---
layout: default
title: "Frontend base — Etapa 05"
---

# Frontend base — Etapa 05

## Objetivo

Conectar Astro + Vue con el catálogo real del backend y reemplazar el `404` inicial por una experiencia responsive utilizable desde 360 px.

## Arquitectura

- Astro renderiza layout, estructura y páginas estáticas.
- Vue se hidrata únicamente en `ScenarioCatalog.vue` mediante `client:load`.
- El navegador consulta el backend exclusivamente por `PUBLIC_API_URL`.
- No existe acceso directo desde el frontend hacia PostgreSQL.
- Tailwind CSS se carga mediante el plugin oficial para Vite.
- `DaleConTodoMiKing.png` continúa siendo la única imagen del sistema.

## Flujo

```text
Navegador
   ↓
Astro / Vue
   ↓ PUBLIC_API_URL
Express /api/escenarios
   ↓
Prisma
   ↓
PostgreSQL
```

## Variables

`frontend/.env`:

```env
PUBLIC_API_URL=http://localhost:3000
```

No deben colocarse secretos en variables prefijadas con `PUBLIC_`.
