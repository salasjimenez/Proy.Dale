---
layout: default
title: "Dale v0.16.1 - Inicio y entrenamiento real"
---

# Etapa 16.1 - Portada y selector de entrenamientos

Version: `0.16.1`. Este cambio es de experiencia de usuario y no modifica la base de datos ni los endpoints.

## Enfoque de producto

La portada explica que Dale sirve para **entrenar conversaciones reales**, no para rendir pruebas de dificultad. Muestra los ambitos de trabajo, estudios, conversaciones sociales y tramites, seis entrenamientos destacados y el catalogo completo.

Los seis enlaces directos de la portada utilizan slugs existentes en `backend/prisma/seed.ts`; el test `npm run home:check` verifica esta correspondencia.

## Una situacion, varias formas de entrenar

La API conserva 36 registros (12 situaciones, tres variantes por cada una). El frontend agrupa esas variantes en **12 tarjetas**. Al abrir una tarjeta, el usuario elige:

| Interfaz | Codigo de la API | Descripcion |
| --- | --- | --- |
| Preparacion | `BASICO` | Primer ensayo de una conversacion |
| Practica guiada | `INTERMEDIO` | Variante con mayor intercambio |
| Simulacion real | `DIFICIL` | Variante mas exigente |

Esto solo cambia el lenguaje y la presentacion: el registro de sesiones, los puntajes y las migraciones no se modifican. Los botones llevan a `/practicar?escenario=<slug>`; se mantiene la seleccion entre texto y voz en el simulador real.

## Filtro compartible por categoria

Las tarjetas de categoria abren la portada con `/?categoria=LABORAL#escenarios` o los codigos reales de las otras categorias. `ScenarioCatalog.vue` lee ese parametro, comprueba que sea valido y consulta `GET /api/escenarios`. La busqueda por texto mantiene el comportamiento anterior. No se simulan respuestas de API.

## Imagenes y rendimiento

Las siete ilustraciones de la portada y tarjetas estan disponibles en `frontend/public-assets/landing/` como archivos WebP, creadas especificamente para Dale. Se sirven desde la misma aplicacion, sin rastreadores externos, fuentes remotas ni nuevas dependencias. El hero tiene prioridad de descarga; los recursos de tarjetas se cargan de forma diferida. La ilustracion de marca `DaleConTodoMiKing.png` y el favicon original se conservan.

## Accesibilidad y privacidad

- Responsive desde 360 px, con controles tactiles de altura minima de 44 px.
- Imagenes informativas con texto alternativo y decorativas con `alt` vacio.
- Selector en dialogo con Escape, Tab, Shift+Tab, foco inicial y devolucion del foco al cerrar.
- Compatibilidad con las preferencias de fuente y contraste de v0.16.0 y con movimiento reducido.
- La modalidad de voz sigue dependiendo de Web Speech API, los permisos del navegador y HTTPS fuera de localhost. Dale no almacena audio.
- No se agregan cookies, registros de datos, dependencias de pago ni servicios externos.

## Validaciones

```bash
npm install
npm run docs:sync
npm run home:check
npm run check
git diff --check
```

Pruebas manuales recomendadas: comprobar las cuatro tarjetas de categoria, la busqueda, las doce tarjetas agrupadas y la seleccion de las tres variantes; navegar por teclado; abrir practicas por texto y voz; revisar 360 px, 768 px, escritorio y zoom al 200 %; comprobar las preferencias de accesibilidad. La verificacion estatica y el build no sustituyen pruebas de navegacion reales.
