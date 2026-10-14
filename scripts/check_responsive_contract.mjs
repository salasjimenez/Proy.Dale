#!/usr/bin/env node
/** Dale v0.16.3: verificacion estatica de los puntos de adaptacion. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const failures = [];
function check(ok, message) { if (!ok) failures.push(message); }
function includes(file, ...needles) {
  const source = read(file);
  for (const needle of needles) check(source.includes(needle), `${file}: falta ${needle}`);
}

const version = JSON.parse(read('package.json')).version;
check(version === '0.16.3', `Version raiz incorrecta: ${version}`);
for (const p of ['frontend/package.json', 'backend/package.json']) {
  check(JSON.parse(read(p)).version === version, `Desalineado: ${p}`);
}
check(read('backend/src/version.ts').includes('APP_VERSION = "0.16.3"'), 'La version de salud del backend no coincide');

includes('frontend/src/layouts/BaseLayout.astro',
  'responsive.css', 'dale-header-inner', 'dale-primary-nav', 'dale-mobile-menu-panel', 'Navegación móvil',
  'matchMedia', 'pointerdown', 'Escape', 'AccessibilityControls client:load');
includes('frontend/src/pages/index.astro',
  'dale-hero-layout', 'dale-hero-art', 'dale-grid-categories', 'dale-grid-featured',
  'dale-grid-steps', '<TrainingPlanner client:load />', '<ScenarioCatalog client:load />');
includes('frontend/src/components/vue/TrainingPlanner.vue',
  'dale-plan-grid', 'dale-goal-options', 'dale-stage-options', 'dale-plan-summary',
  'trainingHref(', 'shortSession');
includes('frontend/src/components/vue/ScenarioCatalog.vue',
  'dale-catalog-filters', 'dale-catalog-grid', 'dale-scenario-dialog', 'dale-dialog-stages',
  'aria-modal="true"', 'handleDialogKeydown');
includes('frontend/src/components/vue/PracticeSimulator.vue',
  'dale-practice-steps', 'dale-practice-grid', 'dale-practice-metrics',
  'dale-practice-actions', 'finishVoicePractice', 'finishTextPractice');
for (const p of ['ProgressDashboard.vue', 'ScenarioMapDashboard.vue']) {
  includes(`frontend/src/components/vue/${p}`, 'dale-chart-scroll', 'tabindex="0"', 'role="region"', 'overflow-x-auto');
}
const css = read('frontend/src/styles/responsive.css');
for (const required of [
  '.dale-grid-categories', '.dale-grid-featured', '.dale-stage-options', '.dale-catalog-grid',
  '.dale-practice-metrics', '.dale-chart-scroll:focus-visible',
  '@media (max-width: 48rem)', '@media (max-width: 30rem)',
  '(orientation: landscape)', '(min-width: 80rem)', 'prefers-reduced-motion',
  'forced-colors: active', 'data-dale-contrast="high"',
]) check(css.includes(required), `CSS responsive incompleto: ${required}`);
check(!/\b(?:html|body)\s*\{[^}]*overflow-x\s*:\s*hidden/i.test(css),
  'No se debe ocultar el desbordamiento horizontal del documento');

if (failures.length) {
  console.error(`Dale responsive:check FALLO (${failures.length} hallazgos)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log('Dale responsive:check OK: cabecera, portada, planificador, catalogo, simulador, graficos, zoom y orientacion.');
  console.log('Pendiente comprobacion visual: 320/360/390/480/768/1024/1280/1440/1920 px y zoom 200 %.');
}
