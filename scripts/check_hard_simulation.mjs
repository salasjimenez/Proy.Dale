#!/usr/bin/env node
/** Pruebas del parche v0.16.4-P1: dificultad, métricas de voz y límites de interpretación. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
let tests = 0;
function check(ok, message) {
  tests += 1;
  if (!ok) throw new Error(`hard:check FALLÓ: ${message}`);
}
async function loadTS(rel) {
  const transpiled = ts.transpileModule(read(rel), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    reportDiagnostics: true,
  });
  check(!(transpiled.diagnostics ?? []).some(d => d.category === ts.DiagnosticCategory.Error), `No compila ${rel}`);
  return import(`data:text/javascript;base64,${Buffer.from(transpiled.outputText).toString("base64")}`);
}
const seq = await loadTS("frontend/src/lib/sequence.ts");
const hard = await loadTS("frontend/src/lib/hardSimulation.ts");
const mock = {
  situacion: "En una entrevista te solicitan justificar una experiencia.",
  instrucciones: "Argumenta una propuesta con evidencia.",
  categoria: { codigo: "LABORAL", nombre: "Laboral" },
  nivel: { codigo: "DIFICIL", nombre: "Difícil" },
};
const categories = ["LABORAL", "TRAMITES_CALLE", "SOCIAL", "JOVENES_ESTUDIANTES"];
for (const category of categories) {
  const phases = seq.sequencePhases({ ...mock, categoria: { codigo: category, nombre: category } });
  check(phases.length === 3, `${category}: faltan fases`);
  check(phases[0].minimumWords >= 24 && phases[1].minimumWords >= 30 && phases[2].minimumWords >= 35, `${category}: dificultad insuficiente`);
  check(phases[1].intensity === "Alta" && phases[2].intensity === "Alta", `${category}: presión sin escalar`);
  check(phases.every(p => (p.goals?.length ?? 0) >= 3), `${category}: faltan objetivos de fase`);
  check(!seq.answerReady("Sí, claro, muchas gracias.", phases[0]), `${category}: se aceptó una respuesta breve`);
  check(seq.answerReady(Array(40).fill("motivo").join(" "), phases[2]), `${category}: se rechazó la longitud mínima`);
  check(phases[1].interaction !== phases[2].interaction, `${category}: no se distingue la objeción de la presión`);
}
const basic = seq.sequencePhases({ ...mock, nivel: { codigo: "BASICO", nombre: "Básico" } });
check(basic[0].minimumWords === 5 && basic[2].minimumWords === 8, "Se alteró la etapa BASICO");
const medium = seq.sequencePhases({ ...mock, nivel: { codigo: "INTERMEDIO", nombre: "Intermedio" } });
check(medium[0].minimumWords === 5 && medium[2].minimumWords === 8, "Se alteró INTERMEDIO");
const phases = seq.sequencePhases(mock);
const goodText = "Entiendo su duda porque en un ejemplo anterior obtuve un resultado concreto. " +
  "Propongo una alternativa: podemos revisar los datos hoy y acordar una fecha con el responsable. " +
  "La prioridad es confirmar el siguiente paso y enviar la información necesaria.";
const first = { text: goodText, durationMs: 30_000, pauses: [] };
const textDiag = hard.assessHardPhase(phases[1], first, "TEXTO");
check(textDiag.words > 25, "Conteo de palabras deficiente");
check(textDiag.signals.filter(s => s.detected).length >= 3, "No reconoce expresiones explícitas");
check(textDiag.wordsPerMinute === null && textDiag.pauseCount === null && textDiag.voiceScore === null, "Inventa métricas acústicas para texto");
const vocal = hard.assessHardPhase(phases[1], {
  ...first,
  pauses: [
    { inicioMs: 1000, duracionMs: 800 },
    { inicioMs: 1200, duracionMs: 900 },
    { inicioMs: 55000, duracionMs: 950 },
  ],
}, "VOZ");
check(vocal.wordsPerMinute !== null && vocal.wordsPerMinute > 0, "No calcula ritmo desde duración");
check(vocal.pauseCount === 2, "No descarta pausas fuera de fase");
check(vocal.pauseTotalMs === 1100, "Cuenta dos veces pausas solapadas");
check(vocal.pauseRatioPercent !== null && vocal.pauseRatioPercent > 0 && vocal.pauseRatioPercent <= 100, "Porcentaje de pausas inválido");
const repetitive = hard.assessHardPhase(phases[0], { text: "yo yo yo este este eh eh voy voy", durationMs: 5000, pauses: [] }, "VOZ");
check(repetitive.fillers >= 3 && repetitive.repetitions >= 3, "No detecta muletillas o repetición consecutiva");
const incomplete = hard.hardSimulationVerdict([vocal], 80);
check(incomplete.kind === "incomplete", "Declara éxito sin tres fases");
const poorly = [0,1,2].map(i => hard.assessHardPhase(phases[i], {
  text: Array(40).fill("palabra").join(" "), durationMs: 5000, pauses: [],
}, "VOZ"));
check(hard.hardSimulationVerdict(poorly, 30).kind === "review", "Falta estado reto no superado");
check(hard.hardSimulationVerdict(poorly, null).kind === "progress", "Inventó evaluación sin backend");
const well = [0,1,2].map(i => hard.assessHardPhase(phases[i], {
  text: goodText, durationMs: 25_000, pauses: [{ inicioMs: 3500, duracionMs: 800 }],
}, "VOZ"));
check(hard.hardSimulationVerdict(well, 95).kind === "success", "El reto no puede superarse con evidencia suficiente");
const view = read("frontend/src/components/vue/ScenarioSequence.vue");
check(view.includes("assessHardPhase") && view.includes("phaseDiagnostics"), "La vista no conecta análisis por fase");
check(view.includes("hardSimulationVerdict") && view.includes("shownVerdict"), "No muestra resultado exigente");
check(view.includes("No se analizan expresiones faciales") && view.includes("se calcula localmente"), "Falta información sobre límites y almacenamiento");
check(view.includes("<VoiceCapture") && view.includes("finishText") && view.includes("assembleSequence"), "Se perdió voz, texto o consolidación");
const dashboard = read("frontend/src/components/vue/VoiceAnalyticsDashboard.vue");
check(dashboard.includes("hardVoiceOnly") && dashboard.includes("point.escenario.nivel.codigo"), "El dashboard no filtra dificultad real");
check(dashboard.includes("repeticiones") || dashboard.includes("Repeticiones"), "No aparecen repeticiones en el dashboard");
check(read("scripts/generar_docs_vue.mjs").includes("ScenarioSequence:"), "No están integradas las fichas de Vue");
check(JSON.parse(read("package.json")).version === "0.16.4", "El parche cambió la versión principal");
console.log(`Dale hard:check OK (${tests} pruebas): nivel Difícil, indicios de respuesta, pausas, voz y resultados.`);
