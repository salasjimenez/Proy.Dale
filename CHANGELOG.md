# Dale - Historial de cambios

## [0.16.2] - 2026-10-14

### Agregado

- Selector por seis objetivos personales y rutas de entrenamiento en `/entrenar` y portada.
- Entrada de práctica breve con reloj de cinco minutos orientativos, sin guardar ni terminar automáticamente.
- Guía Prepárate / Entrena / Revisa con foco en el contexto del escenario.
- Sugerencias de repetición o siguiente etapa y foco de mejora basado solo en métricas existentes.
- Menú móvil de navegación con Escape y controles accesibles.
- `npm run training:check`, documentación Vue regenerada y guía de la etapa 16.2.

### Sin cambios

- No se modifican endpoints, Prisma, migraciones, datos existentes ni servicios externos.

## [0.16.1] - 2026-10-13

### Agregado

- Portada visual centrada en entrenamiento de comunicaciones reales, con ilustraciones WebP locales y seis situaciones destacadas.
- Seleccion por cuatro categorias y catalogo con una tarjeta por situacion (12 en vez de 36 repetidas).
- Dialogo accesible para elegir Preparacion, Practica guiada o Simulacion real, sin cambiar los codigos de Prisma.
- Comprobacion `npm run home:check` integrada en CI y `npm run check`.
- Guia tecnica de UX en /docs y versiones actualizadas a 0.16.1.

### Conservado

- Registro, backend, PostgreSQL, sesion, metrica, accesibilidad de v0.16.0 y despliegue desactivado.

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
