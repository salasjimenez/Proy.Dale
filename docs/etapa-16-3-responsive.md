---
layout: default
title: "Etapa 16.3 — Responsive adaptable | Dale"
---

# Dale v0.16.3 — Diseño adaptable y experiencia UI/UX

## Objetivo

Mantener intactos el entrenamiento, la sesión, las métricas y PostgreSQL, mejorando la distribución visual al **redimensionar la ventana**, cambiar entre móvil y escritorio, rotar el dispositivo y ampliar el tamaño del texto.

## Ajustes

- Cabecera flexible: el menú se ofrece hasta pantallas anchas y se cierra con Escape, pulsación fuera del menú o al pasar al diseño de escritorio.
- Portada: ilustración, título y botones ajustados a pantallas estrechas; las tarjetas de categorías, escenarios y pasos usan rejillas fluidas.
- Planificador: opciones según el ancho real disponible, tarjetas legibles con zoom y resumen lateral fijo solo si hay espacio suficiente.
- Catálogo: filtros en una columna cuando hace falta; tarjetas elásticas y diálogo con desplazamiento interno, incluso en horizontal.
- Práctica: pasos de progreso visibles, editor que cabe en el contenedor, métricas reacomodadas sin columnas estrechas y botones que cambian a una columna en móvil.
- Progreso y mapa: gráficos anchos dentro de regiones enfocables mediante Tab y desplazables horizontalmente, con alternativas textuales existentes.
- Accesibilidad: se conservan ajustes de tamaño de texto, contraste, indicadores de foco, movimiento reducido y superficies táctiles.

## Matriz manual de comprobación

| Ancho CSS | Estado esperado |
|---|---|
| 320 px | Sin scroll lateral en la página, cabecera en dos filas |
| 360 px y 390 px | Portada, tarjetas y CTA en una columna; diálogos utilizables |
| 480 px | Cabecera navegable, formularios y menús sin recortes |
| 768 px | Tarjetas redistribuidas; selector sin etapas comprimidas |
| 1024 px | Planificador y práctica siguen cómodos sin forzar dos columnas |
| 1280 px y 1440 px | Dos columnas donde corresponda, menú completo |
| 1920 px | Contenido con max-width y márgenes equilibrados |
| Zoom 200 % | Sin controles truncados ni obstáculos para teclado |
| Landscape de baja altura | Diálogos desplazables, encabezado no ocupa toda la pantalla |

**Verificación manual:** usar Chrome/Edge DevTools con los anchos anteriores; revisar `/`, `/entrenar`, `/practicar?escenario=entrevista-trabajo-basico`, `/progreso`, `/mapa`, `/registro` y `/cuenta`. En las regiones de gráficos, pulsar Tab y probar las flechas. Repetir con el tamaño de texto de Dale en "Extra" y el alto contraste. Probar el menú mientras se cambia el ancho de la ventana.

## Comprobaciones automáticas

```bash
npm install
npm run docs:sync
npm run responsive:check
npm run home:check
npm run training:check
npm run check
```

`responsive:check` valida la estructura y los puntos de adaptación; no sustituye las pruebas de visualización en navegadores. No se agregaron dependencias, endpoints, migraciones ni servicios externos. El despliegue de producción sigue deshabilitado hasta la v0.17.0.
