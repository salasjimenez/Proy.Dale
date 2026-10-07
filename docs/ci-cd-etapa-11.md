---
layout: default
title: "Etapa 11 — Calidad, CI/CD y documentación publicada"
---

# Etapa 11 — Calidad, CI/CD y documentación publicada

La versión `v0.11.0` incorpora automatización de validaciones y deja preparado el despliegue de producción sin acoplar Dale a un proveedor concreto.

## Pipeline de aplicación

El workflow `.github/workflows/ci-cd.yml` conserva tres etapas explícitas:

1. `test`: instala dependencias, genera Prisma Client, valida `schema.prisma` y ejecuta pruebas automatizadas del backend.
2. `build`: compila backend y frontend y conserva los artefactos de compilación como evidencia del workflow.
3. `deploy`: solo se habilita en `main` cuando la variable del repositorio `DEPLOY_ENABLED=true`. Antes de disparar los despliegues aplica `prisma migrate deploy` sobre la base de producción.

El job `deploy` requiere estos secretos de GitHub:

- `DATABASE_URL`: conexión PostgreSQL de producción.
- `BACKEND_DEPLOY_HOOK_URL`: webhook HTTPS del proveedor que despliega el backend.
- `FRONTEND_DEPLOY_HOOK_URL`: webhook HTTPS del proveedor que despliega el frontend.

Los secretos nunca deben escribirse en archivos versionados.

## Activación del despliegue

Mientras no exista infraestructura de producción definitiva, `DEPLOY_ENABLED` debe permanecer ausente o con un valor distinto de `true`. En ese estado GitHub ejecutará `test` y `build`, pero omitirá `deploy`.

Cuando los tres secretos estén configurados y los webhooks hayan sido probados, crear la variable de repositorio:

```text
DEPLOY_ENABLED=true
```

A partir de ese momento cada push exitoso a `main` podrá ejecutar la secuencia:

```text
test -> build -> prisma migrate deploy -> backend deploy -> frontend deploy
```

## Pruebas automatizadas

`backend/tests/status.routes.test.ts` valida rutas que no requieren una base de datos activa:

- estado de autenticación;
- modos texto/voz;
- dashboard de progreso;
- mapa de escenarios y sus cuatro categorías;
- protección `401` de una ruta autenticada;
- respuesta JSON `404` para una ruta inexistente.

Localmente:

```bash
npm run test --workspace=backend
```

Para ejecutar la validación completa del backend:

```bash
npm run check --workspace=backend
```

## GitHub Pages

`.github/workflows/deploy-docs.yml` publica exclusivamente `/docs` en GitHub Pages. No publica la aplicación de Dale.

Para habilitarlo en GitHub:

1. Abrir `Settings -> Pages`.
2. En `Build and deployment`, seleccionar `GitHub Actions`.
3. Ejecutar manualmente `Deploy technical docs` o realizar un cambio dentro de `/docs` en `main`.

`docs/index.md` funciona como portada y `docs/_config.yml` contiene la configuración mínima de Jekyll.

## Seguridad

Los workflows de `pull_request` no utilizan credenciales de producción. El job de producción solo se evalúa para `push` a `main`, exige la activación explícita mediante `DEPLOY_ENABLED` y utiliza secretos almacenados por GitHub.
