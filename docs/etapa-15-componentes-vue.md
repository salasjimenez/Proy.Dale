---
layout: default
title: "Etapa 15 — Documentacion copiable de Vue"
---

# Etapa 15 — Documentacion copiable de componentes Vue

Version: `0.15.0`

## Objetivo

Documentar exactamente los componentes que usa el frontend sin duplicar una implementacion resumida que pueda quedar obsoleta. El resultado se publica en `/docs`, separadamente de la aplicacion.

## Inventario

- [Catalogo de nueve componentes Vue](components/index.html): ficha, interfaz, dependencias, uso Astro/Vue y codigo fuente completo.
- [Codigo auxiliar](codigo/index.html): cliente API y tipos TypeScript en bloques copiables.

## Regeneracion y validacion

```bash
npm run docs:sync
npm run docs:check
npm run check
```

El generador `scripts/generar_docs_vue.mjs` solo utiliza bibliotecas nativas de Node.js; no instala dependencias ni consulta redes. Al documentar una modificacion del frontend, ejecuta primero `docs:sync` y confirma que `docs:check` pasa. El job de pruebas de CI ejecuta esa verificacion.

Los archivos generados estan versionados en Git para que GitHub Pages pueda servirlos directamente sin ejecutar Node durante el despliegue de Jekyll. Los bloques Vue utilizan las etiquetas Liquid de apertura y cierre de contenido literal para evitar que Jekyll interprete las llaves de las plantillas.

## Limitaciones y requisitos

Los componentes necesitan Vue 3, Astro y Tailwind CSS en la estructura actual de Dale. Para consumir funciones protegidas necesitan Express, PostgreSQL y una sesion valida. Configura `PUBLIC_API_URL` en el frontend; manten las credenciales del servidor fuera del repositorio. Web Speech API requiere permisos del navegador, soporte compatible y contexto seguro (`localhost` o HTTPS). No se almacena audio.

Las fichas se generan desde el codigo vigente. Si se cambia un componente en v0.16+, se regeneran los documentos y se registra la nueva version; no se modifican componentes ni servicios funcionales durante v0.15.0.
