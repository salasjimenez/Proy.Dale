#!/usr/bin/env node
/** Verificación funcional y estructural del plan de entrenamiento v0.16.2. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const errors = [];
function check(test, message) {
  if (!test) errors.push(message);
}

const trainingSource = read("frontend/src/lib/training.ts");
const built = ts.transpileModule(trainingSource, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  reportDiagnostics: true,
});
check((built.diagnostics ?? []).filter(d => d.category === ts.DiagnosticCategory.Error).length === 0, "No se pudo transpilar training.ts");
const training = await import(`data:text/javascript;base64,${Buffer.from(built.outputText).toString("base64")}`);
const seed = read("backend/prisma/seed.ts");
const available = new Set([...seed.matchAll(/^\s*slug:\s*"([a-z-]+)"/gm)].map(x => x[1]));
const identifiers = new Set();
check(training.TRAINING_GOALS.length >= 4, "Deben existir al menos cuatro objetivos de entrenamiento");
for (const goal of training.TRAINING_GOALS) {
  check(!identifiers.has(goal.id), `Objetivo duplicado: ${goal.id}`);
  identifiers.add(goal.id);
  check(available.has(goal.baseSlug), `Escenario no presente en el seed: ${goal.baseSlug}`);
  check(goal.image.startsWith("/landing/") && goal.image.endsWith(".webp"), `Imagen local inválida: ${goal.image}`);
  const image = path.join(root, "frontend", "public-assets", goal.image.slice(1));
  check(fs.existsSync(image) && fs.statSync(image).size > 1000, `Imagen ausente: ${goal.image}`);
  for (const stage of training.TRAINING_STAGES) {
    const slug = training.toTrainingSlug(goal.baseSlug, stage.code);
    check(slug.startsWith(`${goal.baseSlug}-`), `Ruta inválida: ${slug}`);
  }
}
check(training.trainingHref("entrevista-trabajo", "BASICO", "VOZ", true) === "/simulacion?escenario=entrevista-trabajo-basico&modalidad=VOZ&rapido=1", "La URL del entrenamiento breve no conserva modalidad y escenario");
check(training.recommendNextStage("entrevista-trabajo-basico", 74).slug === "entrevista-trabajo-basico", "No se debe avanzar con 74 puntos");
check(training.recommendNextStage("entrevista-trabajo-basico", 75).slug === "entrevista-trabajo-intermedio", "No se recomienda la siguiente etapa con 75 puntos");
check(training.recommendNextStage("entrevista-trabajo-intermedio", 82).slug === "entrevista-trabajo-dificil", "No avanza de práctica guiada a simulación real");
check(training.recommendNextStage("entrevista-trabajo-dificil", 95).slug === "entrevista-trabajo-dificil", "No deben inventarse niveles posteriores a DIFICIL");
check(training.recommendNextStage("entrevista-trabajo-basico", null).advanced === false, "No debe inferirse progreso cuando no hay puntaje");
check(training.remainingTimeLabel(0) === "5:00" && training.remainingTimeLabel(299) === "0:01" && training.remainingTimeLabel(999) === "0:00", "El temporizador de cinco minutos es incorrecto");
check(training.focusSuggestion({ palabras: 60, muletillasTotal: 4, repeticiones: 0, puntajeRitmo: null, puntajePausas: null }, "TEXTO").includes("muletillas"), "No identifica muletillas con datos reales");
const home = read("frontend/src/pages/index.astro");
const planner = read("frontend/src/components/vue/TrainingPlanner.vue");
const practice = read("frontend/src/components/vue/PracticeSimulator.vue");
const layout = read("frontend/src/layouts/BaseLayout.astro");
const page = read("frontend/src/pages/entrenar.astro");
const sourceGenerator = read("scripts/generar_docs_vue.mjs");
check(home.includes("<TrainingPlanner client:load />") && home.includes("<ScenarioCatalog client:load />"), "Portada sin planificador o sin catálogo de escenarios");
check(page.includes("<TrainingPlanner client:load />"), "Falta /entrenar");
check(planner.includes("trainingHref(") && planner.includes("shortSession"), "Selector no conecta entrenamiento breve con práctica");
check(practice.includes("shortSession") && practice.includes("remainingTimeLabel"), "Simulador sin seguimiento de tiempo");
check(practice.includes("recommendNextStage") && practice.includes("focusSuggestion"), "Resultados sin próxima práctica contextualizada");
check(practice.includes("finishVoicePractice") && practice.includes("finishTextPractice"), "Se alteró una modalidad de práctica");
check(layout.includes("Navegación móvil") && layout.includes('href="/entrenar"'), "Falta navegación de entrenamiento en móvil");
check(sourceGenerator.includes("TrainingPlanner:"), "Falta la ficha generada de TrainingPlanner en /docs");
check(JSON.parse(read("package.json")).version === "0.16.4", "La versión raíz no es 0.16.4");
check(read("backend/src/version.ts").includes('APP_VERSION = "0.16.4"'), "El health backend tiene versión distinta");

if (errors.length) {
  console.error(`Dale training:check FALLÓ (${errors.length} hallazgos)`);
  for (const message of errors) console.error(`- ${message}`);
  process.exitCode = 1;
} else {
  console.log(`Dale training:check OK: ${training.TRAINING_GOALS.length} objetivos, ${training.TRAINING_STAGES.length} etapas, temporizador y recomendaciones.`);
}
