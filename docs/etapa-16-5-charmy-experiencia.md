---
layout: default
title: Dale v0.16.5 — Charmy y prueba guiada
---

# Dale v0.16.5 — Charmy: experiencia de bienvenida y prueba sin registro

## Objetivo

La v0.16.5 reemplaza la portada extensa anterior por una experiencia enfocada en **elección de caso → introducción con Charmy → prueba guiada de hasta cinco minutos → registro o inicio de sesión para continuar**.

## Cambios de producto

- Portada visual con el avatar original de Charmy, movimiento local y lectura en voz alta mediante `SpeechSynthesisUtterance` (motor del sistema o navegador).
- Seis casos de la vida real seleccionables, procedentes de los escenarios existentes en `backend/prisma/seed.ts`. No hay banners de empresas.
- Nueva ruta `/probar`: permite elegir un caso antes de empezar; cinco preguntas guiadas, cronómetro máximo de 300 segundos, voz del personaje y respuesta por voz cuando el navegador ofrece `SpeechRecognition`.
- Opción escrita alternativa para accesibilidad, compatibilidad o falta de permisos de micrófono.
- Después de la introducción, enlaces a `/registro` y `/login` con `next` que apunta a `/simulacion` del caso elegido.
- Catálogo completo trasladado a `/escenarios` (sigue consumiendo la API real); `/entrenar`, `/simulacion`, `/progreso` y `/analisis-voz` se conservan.
- CSS responsive desde 320 px, menú global, foco visible y alternativa estática para `prefers-reduced-motion`.
- El pie conserva acceso al modal **Creador**: Jhonn Pether / Instagram `@pitx29`.

## Limitaciones explícitas

Charmy **no es un chatbot con IA generativa**: la prueba es una conversación estructurada con cinco preguntas adaptadas a cada situación. La voz se sintetiza localmente con la API del navegador o sistema, sin garantía de que existan voces españolas instaladas. La voz puede no estar disponible en todos los navegadores. En ese caso el contenido permanece visible por escrito.

El reconocimiento de voz mediante Web Speech puede procesar el audio en servicios externos del proveedor del navegador. Dale **no graba archivos de audio** ni envía las respuestas de la **prueba de invitado** a su backend; las respuestas solo están en memoria mientras la página permanece abierta. No se trasladan al historial al registrarse. Se debe obtener permiso del navegador para el micrófono.

La introducción dura **hasta** cinco minutos: termina antes si el usuario completa las cinco preguntas o pulsa finalizar, y termina automáticamente a los 300 segundos. Se evita obligar al usuario a esperar artificialmente.

Las sugerencias de la prueba se basan solo en la extensión de la respuesta, sin fingir medir emociones, pronunciación, rasgos personales o desempeño vocal real. La analítica existente del backend permanece para sesiones autenticadas.

## Verificación

```bash
npm ci
npm run docs:sync
npm run ux:check
npm run home:check
npm run check
```

Comprobar manualmente en Chrome y Edge: reproducción de la voz desde un clic, micrófono permitido/denegado, temporizador y prueba sin login. Repetir en Safari/Firefox para verificar el fallback escrito. Validar 320, 360, 390, 768, 1024 y 1440 px, zoom de 200 %, teclado, lector de pantalla y movimiento reducido.

No se agregan servicios pagos, cookies, migraciones Prisma ni endpoints.
