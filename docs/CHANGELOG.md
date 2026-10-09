---
layout: default
title: "Changelog"
---

# Changelog

## [0.13.0] - 2026-10-09

### Agregado

- Exportación autenticada de datos personales en JSON.
- Eliminación de prácticas individuales y del historial completo.
- Eliminación definitiva de cuenta con confirmación de contraseña.
- Controles de privacidad integrados en /cuenta.
- Pruebas de protección para las nuevas rutas sensibles.

### Cambiado

- Política de privacidad con acceso, portabilidad y eliminación de datos.
- Cliente HTTP del frontend con soporte DELETE.


Todos los cambios relevantes de Dale se documentan en este archivo siguiendo versionado semántico.

## [0.12.0] - 2026-10-08

### Agregado

- Endpoints /health/live y /health/ready.
- X-Request-Id en respuestas del backend.
- Rate limit configurable para login y registro.
- Página 404 propia y mejoras de accesibilidad.

## [0.11.1] - 2026-10-08

### Corregido

- Build CI/CD con devDependencies disponibles.
- Conflictos entre Jekyll/Liquid y ejemplos Vue.
- Generación correcta de la home de Astro manteniendo index.html aislado.

## [0.11.0] - 2026-10-07

### Agregado

- Pruebas automatizadas del backend con Vitest y Supertest para rutas de estado, protección de autenticación y respuesta 404.
- Workflow principal de GitHub Actions con etapas explícitas `test`, `build` y `deploy`.
- Validación de Prisma y generación de Prisma Client dentro de CI.
- Compilación automatizada de frontend y backend con artefactos de build.
- Migraciones automáticas mediante `prisma migrate deploy` antes del despliegue de producción.
- Activación segura del job de producción mediante la variable `DEPLOY_ENABLED=true`.
- Deploy hooks desacoplados para frontend y backend, sin fijar Dale a un proveedor específico.
- Workflow `deploy-docs.yml` para publicar `/docs` de forma independiente en GitHub Pages.
- Portada `docs/index.md` y configuración mínima de Jekyll.
- Documentación de configuración, secretos y activación del pipeline.

## [0.10.0] - 2026-10-03

### Agregado

- Dashboard autenticado `Mapa de escenarios` en `/mapa`.
- Endpoint protegido `GET /api/mapa` con filtros `TODAS`, `VOZ` y `TEXTO`.
- Radar SVG nativo con las cuatro categorías de escenarios.
- Promedio, mejor puntaje, intentos y niveles practicados por categoría.
- Resumen de cobertura, fortaleza actual y siguiente foco sugerido.
- Tratamiento explícito de categorías sin datos para no confundir ausencia de práctica con puntaje cero.
- Componente reutilizable `ScenarioMapDashboard.vue` con documentación de código completo.
- Accesos al mapa desde la navegación principal y Mi cuenta.

## [0.9.0] - 2026-10-02

### Agregado

- Dashboard autenticado `Mi voz, mi progreso` en `/progreso`.
- Endpoint protegido `GET /api/progreso` con filtros por modalidad.
- Serie cronológica de puntaje general, ritmo, pausas y muletillas.
- Resumen de puntaje promedio, último puntaje, mejor puntaje y cambio dentro del período visible.
- Indicadores de prácticas por voz/texto y promedio de palabras por minuto.
- Gráfico de línea/área mediante SVG nativo, sin dependencia externa de charts.
- Componente reutilizable `ProgressDashboard.vue` con documentación de código completo.
- Accesos a Progreso desde la navegación y Mi cuenta.

## [0.8.0] - 2026-10-01

### Agregado

- Práctica por voz mediante Web Speech API y micrófono del navegador.
- Transcripción en vivo en español (`es-PE`).
- Detección aproximada de pausas con Web Audio API, sin almacenar audio.
- Persistencia de palabras por minuto, pausas, muletillas y repeticiones.
- Puntajes separados de ritmo, pausas y muletillas.
- Retroalimentación específica para sesiones de voz.
- Selector de modalidad Texto/Voz en `/practicar`.
- Componente reutilizable `VoiceCapture.vue` y documentación con código completo.
- Compatibilidad degradada: si Web Speech no está disponible, el modo texto continúa operativo.

## [0.7.0] - 2026-10-01

### Agregado

- Simulador funcional de práctica por texto.
- Creación y persistencia de sesiones autenticadas.
- Finalización de sesiones con transcripción y duración.
- Métricas iniciales de palabras, muletillas y repeticiones.
- Puntaje textual preliminar y retroalimentación accionable.
- Historial reciente de prácticas en `/cuenta`.
- Redirección segura al escenario solicitado después de login o registro.
- Página `/practicar` y componente reutilizable `PracticeSimulator.vue`.
- Documentación técnica y ejemplo completo de uso del simulador.

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
