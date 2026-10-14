---
layout: default
title: "Catalogo Vue | Dale"
---

# Catalogo de componentes Vue

Documentacion de los **12 componentes Vue reales** de Dale v0.16.2, generada directamente desde `frontend/src/components/vue/` sin recortar el codigo.

- [AccessibilityControls.vue](AccessibilityControls.html): Panel flotante de ajustes locales: tamano de texto y contraste, sin servidor ni cookies.
- [AccountPanel.vue](AccountPanel.html): Panel autenticado de Mi cuenta: historial, exportacion JSON, borrado de practicas y eliminacion de cuenta.
- [AuthForm.vue](AuthForm.html): Formulario de registro e inicio de sesion. Muestra validaciones por campo y envia la aceptacion legal obligatoria solo en registro.
- [AuthNav.vue](AuthNav.html): Navegacion de autenticacion: muestra entrada, registro, cuenta o salida segun la sesion.
- [OnboardingGuide.vue](OnboardingGuide.html): Guia voluntaria de cuatro pasos, con dialogo accesible y estado local.
- [PracticeSimulator.vue](PracticeSimulator.html): Orquesta practicas de texto y voz, consulta escenarios, crea y completa sesiones y muestra metricas.
- [ProgressDashboard.vue](ProgressDashboard.html): Dashboard de evolucion cronologica de puntajes y metricas; SVG nativo y filtros por modalidad.
- [ScenarioCard.vue](ScenarioCard.html): Tarjeta ilustrada de situacion real con categoria y boton para elegir entrenamiento.
- [ScenarioCatalog.vue](ScenarioCatalog.html): Catalogo agrupado por situacion con busqueda, filtro por categoria y tres formas de entrenamiento.
- [ScenarioMapDashboard.vue](ScenarioMapDashboard.html): Mapa radar SVG de las categorias practicadas, cobertura y sugerencia de siguiente foco.
- [TrainingPlanner.vue](TrainingPlanner.html): Selector de objetivos, etapa, modalidad y tiempo orientativo. Todas las sugerencias usan escenarios existentes.
- [VoiceCapture.vue](VoiceCapture.html): Captura de voz con Web Speech API y estimacion de pausas con Web Audio API, sin almacenar audio.

## Como copiar e integrar

1. Copia el bloque de codigo completo del componente a `frontend/src/components/vue/`.
2. Copia los archivos TypeScript que aparezcan en **Requisitos y dependencias**, desde [Codigo auxiliar](../codigo/index.html).
3. En Astro, importa el componente y agrega `client:load` cuando necesite interaccion.
4. Configura `PUBLIC_API_URL` para que apunte a tu backend y ejecuta las migraciones si una funcionalidad las necesita.
5. Comprueba los endpoints del backend y las restricciones de autenticacion.

Los componentes conectados a la API no son demos aisladas: requieren backend Express, sesion y tipos correspondientes. Copiar solo el archivo `.vue` no reemplaza esos servicios.

## Evitar desactualizacion

- `npm run docs:sync`: regenera las paginas desde el codigo fuente.
- `npm run docs:check`: verifica que los bloques documentados sean identicos al codigo.

No se agregan paquetes ni servicios externos para documentar los componentes.
