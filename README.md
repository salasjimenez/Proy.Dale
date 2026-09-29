# Dale

Dale es una plataforma web gratuita y de código abierto para practicar comunicación en situaciones reales y medir la evolución del usuario.

## Estado del proyecto

Versión actual: **v0.3.0 — Etapa 3**.

La base del backend ya es funcional: Express se conecta a PostgreSQL mediante Prisma, expone `GET /ping` y deja montados los módulos de rutas para autenticación, escenarios y sesiones.

## Arquitectura

- `frontend/`: Astro + Vue + Tailwind CSS.
- `backend/`: Node.js + Express + TypeScript + Prisma.
- `backend/prisma/`: esquema y migraciones PostgreSQL versionadas.
- `docs/`: documentación técnica.
- `.github/workflows/`: automatizaciones que se incorporarán por etapas.

## Preparación local

1. Crear variables locales:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

2. Reemplazar todos los `CHANGE_ME` de `backend/.env` por valores locales seguros. La contraseña de `POSTGRES_PASSWORD` debe coincidir con la usada dentro de `DATABASE_URL`.

3. Instalar dependencias:

```bash
npm install
```

4. Levantar PostgreSQL:

```bash
npm run db:up
```

5. Aplicar la migración inicial:

```bash
npm run prisma:deploy
npm run prisma:status
```

6. Ejecutar backend:

```bash
npm run dev:backend
```

7. En otra terminal probar:

```bash
curl http://localhost:3000/ping
```

Respuesta esperada:

```json
{
  "status": "ok",
  "service": "dale-backend",
  "version": "0.3.0",
  "database": "ok"
}
```

El objeto también incluye un `timestamp` en formato ISO.

## Rutas preparadas

- `GET /api/auth/status`
- `GET /api/escenarios/status`
- `GET /api/sesiones/status`

Estas rutas confirman que los módulos están correctamente montados; la funcionalidad de negocio se agregará en las siguientes etapas.

## Seguridad

Los `.env`, dumps y datos persistentes no se versionan. El frontend nunca recibe `DATABASE_URL`. Los archivos `migration.sql` bajo `backend/prisma/migrations/` son definición de esquema, no dumps de datos, y sí forman parte del código fuente.

## Identidad visual

Dale mantiene una sola imagen de marca: `frontend/public/DaleConTodoMiKing.png`. No se generan logos alternativos.
