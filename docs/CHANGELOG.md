# Changelog

Todos los cambios relevantes de Dale se documentan en este archivo siguiendo versionado semántico.

## [0.6.0] - 2026-10-01

### Agregado

- Registro con correo, contraseña y nombre opcional.
- Inicio y cierre de sesión mediante el backend propio.
- Hash de contraseñas con bcrypt.
- JWT con expiración configurable almacenado en cookie `HttpOnly`.
- Endpoint protegido `GET /api/auth/me`.
- Soporte opcional de `Authorization: Bearer` para pruebas de API.
- Páginas `/login`, `/registro` y `/cuenta`.
- Componentes Vue `AuthForm`, `AuthNav` y `AccountPanel`.
- Documentación copiable de `AuthForm.vue`.
- Variables de entorno para duración y política de cookie de autenticación.

## [0.5.0] - 2026-09-29

### Agregado

- Página principal responsive en Astro, reemplazando el `404` inicial.
- Catálogo interactivo Vue conectado a `GET /api/escenarios`.
- Filtros por categoría, nivel y búsqueda desde el frontend.
- Estados de carga, vacío, error y detalle de escenario.
- Componente reutilizable `ScenarioCard.vue` y documentación copiable.
- Layout base, footer y páginas legales iniciales de privacidad y términos.
- Consumo del backend mediante `PUBLIC_API_URL`, sin URLs hardcodeadas en componentes.
- Reutilización exclusiva de `DaleConTodoMiKing.png` como imagen y favicon.

## [0.4.0] - 2026-09-29

### Agregado

- Catálogo funcional de escenarios mediante Express + Prisma.
- 12 situaciones base con tres niveles cada una: 36 registros iniciales.
- Seed idempotente de escenarios con `upsert`.
- Filtros por categoría, nivel y búsqueda textual.
- Detalle de escenario por `slug`.
- Resumen de categorías y disponibilidad por nivel.
- Puerto PostgreSQL del host configurable; ejemplo local movido a `5433`.


## [0.3.0] - 2026-09-29

### Agregado

- Servidor Express funcional con TypeScript.
- Conexión de arranque y cierre controlado de Prisma.
- `GET /ping` con comprobación real de PostgreSQL.
- Rutas base para `auth`, `escenarios` y `sesiones`.
- Helmet, CORS configurable y límite de JSON.
- Middleware central de 404 y errores.
- Migración inicial versionada para PostgreSQL.
- Scripts para levantar PostgreSQL y aplicar/verificar migraciones.

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
