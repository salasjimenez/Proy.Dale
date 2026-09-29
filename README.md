# Dale

Dale es una plataforma web gratuita y de código abierto para practicar comunicación en situaciones reales y medir la evolución del usuario.

## Estado del proyecto

Versión actual: **v0.4.0 — Etapa 4**.

El backend ya dispone de un catálogo funcional de escenarios almacenado en PostgreSQL. Incluye cuatro categorías, tres niveles por situación, filtros de consulta, detalle por `slug` y resumen por categoría.

## Arquitectura

- `frontend/`: Astro + Vue + Tailwind CSS.
- `backend/`: Node.js + Express + TypeScript + Prisma.
- `backend/prisma/`: esquema, migraciones y seed PostgreSQL.
- `docs/`: documentación técnica.
- `.github/workflows/`: automatizaciones que se incorporarán por etapas.

## Preparación local

1. Crear variables locales si todavía no existen:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

2. Reemplazar los `CHANGE_ME` de `backend/.env`. La contraseña de `POSTGRES_PASSWORD` debe ser la misma de `DATABASE_URL`.

3. Instalar dependencias:

```bash
npm install
```

4. Levantar PostgreSQL:

```bash
npm run db:up
```

5. Aplicar migraciones:

```bash
npm run prisma:deploy
npm run prisma:status
```

6. Cargar el catálogo inicial:

```bash
npm run db:seed
```

El seed es idempotente y puede ejecutarse nuevamente sin duplicar escenarios.

7. Ejecutar backend:

```bash
npm run dev:backend
```

8. Probar salud:

```bash
curl http://localhost:3000/ping
```

9. Probar catálogo:

```bash
curl http://localhost:3000/api/escenarios/status
curl http://localhost:3000/api/escenarios/categorias
curl "http://localhost:3000/api/escenarios?categoria=LABORAL&nivel=BASICO"
curl http://localhost:3000/api/escenarios/entrevista-trabajo-basico
```

## Endpoints de escenarios

- `GET /api/escenarios`
- `GET /api/escenarios?categoria=...&nivel=...&q=...`
- `GET /api/escenarios/categorias`
- `GET /api/escenarios/:slug`
- `GET /api/escenarios/status`

## Seguridad

Los `.env`, dumps y datos persistentes no se versionan. El frontend nunca recibe `DATABASE_URL`. El seed solo contiene escenarios públicos de práctica y no contiene datos de usuarios.

## Identidad visual

Dale mantiene una sola imagen de marca: `frontend/public/DaleConTodoMiKing.png`. No se generan logos alternativos.
