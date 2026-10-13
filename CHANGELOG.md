# Dale - Historial de cambios

## [0.16.0] - 2026-10-12

### Agregado

- Control global de tamano de letra y contraste que guarda ajustes solo en el navegador.
- Guia voluntaria de cuatro pasos con navegacion por teclado y gestion de foco.
- Pruebas unitarias para normalizacion de preferencias y pasos del recorrido.
- Documentacion Vue sincronizada y guia tecnica de accesibilidad en /docs.

### Mejorado

- Dialogo del catalogo con Escape, ciclo de Tab y devolucion de foco.
- Foco inicial en campos invalidos del registro; informacion sobre almacenamiento local en textos legales.
- Versiones de frontend, backend, lockfiles y salud actualizadas a 0.16.0.

### Sin cambios

- No se modifican endpoints, persistencia PostgreSQL, migraciones, secretos ni politica de despliegue.

## [0.15.0] - 2026-10-11

### Agregado

- Catalogo de los nueve componentes Vue de Dale y ejemplos Astro/Vue listos para adaptar.
- Bloques de codigo completos generados directamente desde los archivos fuente para evitar ejemplos incompletos.
- Documentacion copiable de dependencias de `frontend/src/lib` y `frontend/src/types`.
- Guia de integracion, requisitos de API y advertencias sobre permisos de microfono, autenticacion y privacidad.
- Comandos `npm run docs:sync` y `npm run docs:check` para regenerar y validar la documentacion.
- Verificacion de consistencia integrada en `npm run check` y `ci:test`.

### Mantenido

- Backend, modelo de datos, autenticacion y logica del frontend sin cambios funcionales.
- Publicacion de `/docs` independiente mediante GitHub Pages.

## [0.14.0] - 2026-10-10

- Política de privacidad, términos y aviso de cookies, enlazados en el footer.
- Aceptación obligatoria, validada en frontend/backend, con registro de fecha y versión.
- Migración Prisma, pruebas de registro y documentación técnica.

Para el historial anterior y el detalle completo, consultar [docs/CHANGELOG.md](docs/CHANGELOG.md).
