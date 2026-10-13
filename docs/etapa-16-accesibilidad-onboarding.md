---
layout: default
title: "Etapa 16 - Accesibilidad y onboarding"
---

# Etapa 16 - Accesibilidad y onboarding guiado

Version: `0.16.0`

## Objetivo

Mejorar el acceso a Dale sin cambiar el backend, el modelo de PostgreSQL ni los flujos de practica existentes.

## Controles de lectura

En todas las paginas aparece el boton **Accesibilidad**. Permite elegir tamanos de letra normal (100 %), grande (112,5 %) y extra (125 %), ademas de activar un tema de mayor contraste. Las preferencias se conservan en el almacenamiento local del navegador (`dale-a11y-text-size`, `dale-a11y-contrast`); no se mandan al servidor. Si el almacenamiento esta bloqueado, el ajuste funciona durante la vista actual pero no se conserva.

Se mantiene el enlace «Saltar al contenido principal», los indicadores de foco, el idioma del documento y el soporte a `prefers-reduced-motion`. El control no suplanta el zoom o las opciones de accesibilidad del sistema operativo.

## Recorrido de bienvenida

La portada ofrece una **guia voluntaria de cuatro pasos**: explorar escenarios, practicar por texto/voz, consultar progreso y controlar la cuenta. No se abre de forma forzosa. Se puede cerrar con Escape, navegar con Tab y Shift+Tab, volver atras, finalizar u omitir. Al finalizar u omitir se guarda solo `dale-onboarding-v1-completed` en el navegador. La guia se puede abrir de nuevo desde la portada o visitando `/?guia=1`.

## Lectores de pantalla y teclado

La guia usa `role="dialog"`, `aria-modal`, titulos descriptivos, foco inicial, ciclo de foco y devolucion al elemento anterior al cerrarse. El dialogo de detalle del catalogo aplica el mismo patron. Los componentes utilizan botones y enlaces nativos, controles etiquetados y mensajes de estado. Los graficos SVG disponen de una etiqueta accesible y estan acompanados por explicaciones o datos en texto.

## Verificacion

```bash
npm install
npm run prisma:generate --workspace=backend
npm run docs:check
npm run check
```

Pruebas manuales recomendadas:

1. Abrir `/` a 360 px, 768 px y escritorio; comprobar tambien zoom al 200 % y 400 % con desplazamiento horizontal solo en graficos que lo requieren.
2. Cambiar tamano de letra y contraste, recargar y verificar que los ajustes permanecen; probar tambien almacenamiento deshabilitado.
3. Navegar por botones, panel y guia con Tab, Shift+Tab, Enter y Escape; revisar que el foco no quede oculto.
4. Abrir el detalle de un escenario y comprobar la devolucion del foco al cerrar el dialogo.
5. Leer portada, registro, escenarios, progreso y mapa con NVDA (Windows) o lector equivalente; comprobar los nombres, estados y textos alternativos.
6. Confirmar que `GET /health/live`, las sesiones por texto/voz y la eliminacion/exportacion de datos siguen funcionando.

Los tests automatizados verifican validaciones puras y la estructura del recorrido, pero **no certifican por si solos WCAG 2.2 AA**. La revision con lectores de pantalla y navegador es indispensable.

## Privacidad y despliegue

No se agregan cookies ni peticiones de analitica. Las preferencias y el estado del recorrido son valores locales independientes de la cookie `HttpOnly` de sesion. El frontend no guarda transcripciones ni audio adicionales. No hay migraciones nuevas ni dependencias pagadas.
