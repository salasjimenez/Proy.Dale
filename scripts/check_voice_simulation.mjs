#!/usr/bin/env node
/** Pruebas v0.16.4: contratos de simulacion, combinacion de pausas y estado final. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
let checks = 0;
function check(condition, message) {
  checks += 1;
  if (!condition) throw new Error(`voice:check FALLO: ${message}`);
}
function shouldThrow(fn, message) {
  let threw = false;
  try { fn(); } catch { threw = true; }
  check(threw, message);
}
const source = read("frontend/src/lib/sequence.ts");
const result = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  reportDiagnostics: true,
});
check(!(result.diagnostics || []).some(d => d.category === ts.DiagnosticCategory.Error), "No compila sequence.ts");
const sequence = await import(`data:text/javascript;base64,${Buffer.from(result.outputText).toString("base64")}`);
const base = {
  situacion: "En una entrevista te solicitan presentarte.",
  instrucciones: "Describe tus capacidades con un ejemplo.",
  categoria: { codigo: "LABORAL", nombre: "Laboral" },
  nivel: { codigo: "DIFICIL", nombre: "Difícil" },
};
for (const category of ["LABORAL", "TRAMITES_CALLE", "SOCIAL", "JOVENES_ESTUDIANTES"]) {
  const phases = sequence.sequencePhases({ ...base, categoria: { codigo: category, nombre: category } });
  check(phases.length === 3, `${category}: se requieren tres fases`);
  check(phases[0].id === "apertura" && phases[1].id === "objecion" && phases[2].id === "presion", `${category}: orden de fases incorrecto`);
  check(phases.every(p => p.interaction && p.hint), `${category}: faltan contexto o reto`);
  check(phases[2].intensity === "Alta", `${category}: el escenario extremo no aumenta presion`);
}
check(sequence.sequencePhases({ ...base, nivel: { codigo: "BASICO", nombre: "Básico" } })[2].intensity !== "Alta", "No se debe presentar toda situacion como extrema");
check(sequence.answerWordCount("hola   buenos días") === 3, "Conteo de palabras incorrecto");
check(sequence.answerReady("uno dos tres cuatro cinco", sequence.sequencePhases(base)[0]), "Respuesta suficiente rechazada");
check(!sequence.answerReady("sí", sequence.sequencePhases(base)[0]), "Respuesta demasiado breve aceptada");
const answers = [
  { text: "Primera fase: presento una respuesta clara.", durationMs: 10000, pauses: [{ inicioMs: 1000, duracionMs: 800 }] },
  { text: "Segunda fase: aclaro mis argumentos.", durationMs: 12000, pauses: [{ inicioMs: 2400, duracionMs: 900 }] },
  { text: "Tercera fase: cierro la conversación.", durationMs: 11000, pauses: [{ inicioMs: 1000, duracionMs: 700 }] },
];
const voice = sequence.assembleSequence(answers, "VOZ");
check(voice.duracionMs === 33000, "Duracion total incorrecta");
check(voice.pausasDetalle.length === 3, "Las pausas por fase se perdieron");
check(voice.pausasDetalle[1].inicioMs === 12400 && voice.pausasDetalle[2].inicioMs === 23000, "Los offsets de pausas no son acumulativos");
check(voice.transcripcion.includes("Primera fase") && voice.transcripcion.includes("Tercera fase"), "Falta transcript consolidado");
const text = sequence.assembleSequence(answers, "TEXTO");
check(!("pausasDetalle" in text), "Texto no debe enviar pausas de voz");
shouldThrow(() => sequence.assembleSequence(answers.slice(0, 2), "VOZ"), "Permite guardar con fases incompletas");
shouldThrow(() => sequence.assembleSequence([{...answers[0], text: "x".repeat(5000)}, answers[1], answers[2]], "VOZ"), "No valida maximo de caracteres");
check(sequence.sequenceVerdict(null, false).kind === "incomplete", "Estado de abandono incorrecto");
check(sequence.sequenceVerdict(40, true).kind === "review", "Refuerzo recomendado no disponible");
check(sequence.sequenceVerdict(65, true).kind === "progress", "Estado en progreso incorrecto");
check(sequence.sequenceVerdict(85, true).kind === "success", "Estado superado incorrecto");
const vue = read("frontend/src/components/vue/ScenarioSequence.vue");
check(vue.includes("apiDelete") && vue.includes("/api/sesiones/"), "Abandono no descarta sesion");
check(vue.includes("<VoiceCapture") && vue.includes("finishText"), "Se perdio alguna modalidad de practica");
check(vue.includes("assembleSequence") && vue.includes("saveAll"), "No se agrupan las tres respuestas");
check(read("frontend/src/pages/simulacion.astro").includes("<ScenarioSequence client:load />"), "No existe la ruta de simulacion");
check(read("frontend/src/pages/analisis-voz.astro").includes("<VoiceAnalyticsDashboard client:load />"), "No existe ruta de analitica");
const analytics = read("frontend/src/components/vue/VoiceAnalyticsDashboard.vue");
check(analytics.includes("/api/progreso?modalidad=VOZ&limit=30") && analytics.includes("Sin datos"), "La analitica no usa metricas reales");
const creator = read("frontend/src/components/vue/CreatorModal.vue");
check(creator.includes("Jhonn Pether") && creator.includes("https://www.instagram.com/pitx29/"), "El creador no tiene datos correctos");
check(creator.includes('aria-modal="true"') && creator.includes("Escape"), "El modal no es accesible");
check(fs.statSync(path.join(root, "frontend/public-assets/creator-avatar.svg")).size > 200, "Falta avatar local");
check(JSON.parse(read("package.json")).version === "0.16.4", "Version raiz incorrecta");
check(read("backend/src/version.ts").includes('APP_VERSION = "0.16.4"'), "Version backend no coincide");
console.log(`Dale voice:check OK (${checks} aserciones): fases, presion, pausas acumuladas, transcript, resultados, analitica, creador y versiones.`);
