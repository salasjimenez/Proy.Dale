# Changelog

Todos los cambios relevantes de Dale se documentan en este archivo siguiendo versionado semántico.

## [0.2.0] - 2026-09-29

### Agregado

- Modelo de datos inicial con Prisma y PostgreSQL.
- Tablas `usuarios`, `escenarios`, `sesiones` y `metricas`.
- Enums para categoría, dificultad, modalidad de respuesta y estado de sesión.
- Relaciones, índices y borrado controlado para conservar consistencia histórica.
- Métricas base para ritmo, pausas, muletillas, repeticiones y puntajes de comunicación.

## [0.1.0] - 2026-09-29

### Agregado

- Estructura inicial del monorepo.
- Frontend Astro + Vue + Tailwind CSS.
- Backend Node.js + Express + TypeScript preparado para Prisma.
- PostgreSQL local mediante Docker Compose.
- Variables de entorno de ejemplo y reglas de exclusión de secretos.
