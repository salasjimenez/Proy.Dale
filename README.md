# Dale

Dale es una plataforma web gratuita, responsive y de código abierto para practicar comunicación en situaciones reales y medir el progreso de forma gradual.

## Estado actual

Versión `0.16.5` — funcionalidades principales de práctica y progreso, pruebas automatizadas, pipeline CI/CD y documentación técnica publicable en GitHub Pages.

## Charmy y prueba guiada (v0.16.5)

La portada da prioridad a **elegir un caso real** e introduce a **Charmy**, avatar animado y hablante mediante la síntesis de voz del navegador. En `/probar` se ofrecen seis casos y una conversación estructurada de cinco preguntas, con un límite de **hasta cinco minutos** sin iniciar sesión. El reconocimiento por micrófono es opcional y depende de la compatibilidad del navegador; el texto sigue disponible.

La prueba de invitado no utiliza la API ni guarda respuestas en PostgreSQL; al terminar ofrece registro o login para practicar escenarios completos. **No es un asistente generativo** y no diagnostica emociones o pronunciación. La analítica real solo utiliza sesiones autenticadas. No se crean nuevas migraciones ni dependencias. Consulta [documentación v0.16.5](docs/etapa-16-5-charmy-experiencia.md) y ejecuta `npm run ux:check`, `npm run check`.
