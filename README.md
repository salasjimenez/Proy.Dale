# Dale

Dale es una plataforma web gratuita, responsive y de código abierto para practicar comunicación en situaciones reales y medir el progreso de forma gradual.

## Estado actual

Versión `0.13.0` — funcionalidades principales de práctica y progreso, pruebas automatizadas, pipeline CI/CD y documentación técnica publicable en GitHub Pages.

- Frontend: Astro + Vue + Tailwind CSS.
- Backend: Node.js + Express + TypeScript.
- Base de datos: PostgreSQL + Prisma ORM.
- Autenticación: email/contraseña, bcrypt, JWT y cookie `HttpOnly`.
- Práctica: texto y voz con Web Speech API.
- Métricas de voz: palabras por minuto, pausas estimadas, muletillas, repeticiones y puntajes de ritmo/pausas.
- Dashboard 1: `Mi voz, mi progreso` con serie temporal y filtros Texto/Voz.
- Dashboard 2: `Mapa de escenarios` con radar por categoría, cobertura y siguiente foco sugerido.
- Privacidad de voz: Dale no almacena archivos de audio; persiste transcripción y métricas.
- Control de datos: exportación JSON, eliminación de prácticas e eliminación de cuenta desde `/cuenta`.
- Desarrollo local: Docker Compose.
- Imagen única del proyecto: `frontend/public-assets/DaleConTodoMiKing.png`.
- Calidad: pruebas automatizadas de rutas críticas del backend con Vitest + Supertest.
- CI/CD: workflow `test -> build -> deploy`, con migraciones Prisma antes del despliegue.
- Documentación: `/docs` publicable de forma independiente mediante GitHub Pages.

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

Para práctica por voz se recomienda Chrome o Edge actualizado. El sitio necesita permiso de micrófono y Web Speech API. `localhost` se considera un contexto seguro para las APIs de medios; en producción debe usarse HTTPS.

## Endpoints actuales

- `GET /ping`
- `GET /health/live`
- `GET /health/ready`
- `GET /api/auth/status`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/auth/export`
- `DELETE /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/escenarios/status`
- `GET /api/escenarios`
- `GET /api/escenarios/categorias`
- `GET /api/escenarios/:slug`
- `GET /api/sesiones/status`
- `GET /api/sesiones`
- `DELETE /api/sesiones`
- `POST /api/sesiones`
- `GET /api/sesiones/:id`
- `DELETE /api/sesiones/:id`
- `POST /api/sesiones/:id/completar`
- `GET /api/progreso/status`
- `GET /api/progreso`
- `GET /api/mapa/status`
- `GET /api/mapa`

## Mi voz, mi progreso

`/progreso` consume las sesiones completadas del usuario autenticado y construye una serie cronológica de hasta 30 intentos por defecto. Permite filtrar `TODAS`, `VOZ` o `TEXTO` y alternar entre puntaje general, ritmo, pausas y muletillas.

El gráfico se genera con SVG nativo en Vue. Las métricas inexistentes para una modalidad se muestran como no disponibles; Dale no rellena esos datos artificialmente.

## Mapa de escenarios

`/mapa` agrupa las sesiones completadas por categoría y calcula el promedio del puntaje general para Laboral, Trámites y calle, Social, y Jóvenes y estudiantes. También muestra cobertura, número de intentos, niveles practicados, mejor puntaje y una sugerencia de siguiente foco.

El radar se genera con SVG nativo. Las categorías todavía no practicadas se muestran como `Sin datos`; la ausencia de evidencia nunca se presenta como una calificación de cero.

## Práctica por voz

El navegador realiza dos tareas durante una práctica de voz:

1. Web Speech API produce una transcripción en vivo.
2. Web Audio API estima intervalos de silencio del micrófono para construir métricas de pausa.

El backend recibe la transcripción, duración y marcas temporales de pausa; valida esos datos y calcula las métricas persistidas. El archivo de audio no se envía ni se guarda en Dale.

La disponibilidad y el procesamiento interno de Web Speech dependen del navegador. Algunos navegadores pueden utilizar servicios del proveedor para reconocimiento de voz; esta limitación está documentada en la interfaz y en `/docs`.

## Variables públicas

El frontend usa únicamente:

```env
PUBLIC_API_URL=http://localhost:3000
```

Las credenciales PostgreSQL, `JWT_SECRET` y cualquier otro secreto permanecen exclusivamente en el backend.

## Calidad y CI/CD

La versión `0.11.0` agrega pruebas automatizadas del backend y los workflows de GitHub Actions:

- `.github/workflows/ci-cd.yml`: ejecuta `test`, luego `build` y deja `deploy` condicionado a `DEPLOY_ENABLED=true`.
- `.github/workflows/deploy-docs.yml`: publica exclusivamente `/docs` en GitHub Pages.

Para ejecutar las pruebas localmente:

```bash
npm run test --workspace=backend
```

El despliegue de producción permanece desactivado hasta configurar `DATABASE_URL`, `BACKEND_DEPLOY_HOOK_URL`, `FRONTEND_DEPLOY_HOOK_URL` y habilitar la variable `DEPLOY_ENABLED=true` en GitHub.
