#!/usr/bin/env node
/** Dale 0.16.5 · Contrato funcional de la prueba sin registro y voz de Charmy. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const errors = [];
let assertions = 0;
function check(ok, message) { assertions++; if (!ok) errors.push(message); }
const mod = read('frontend/src/lib/charmyTrial.ts');
const transpiled = ts.transpileModule(mod, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  reportDiagnostics: true,
});
check(!(transpiled.diagnostics ?? []).some((d) => d.category === ts.DiagnosticCategory.Error), 'charmyTrial.ts has TS transpilation errors');
const trial = await import(`data:text/javascript;base64,${Buffer.from(transpiled.outputText).toString('base64')}`);
check(trial.CHARMY_TRIAL_SECONDS === 300, 'Guest trial duration is not 300 seconds');
check(trial.formatTrialClock(0) === '5:00', 'Guest timer does not start at 5:00');
check(trial.formatTrialClock(299) === '0:01', 'Guest timer does not count down correctly');
check(trial.formatTrialClock(305) === '0:00', 'Guest timer must not go negative');
check(trial.CHARMY_CASES.length === 6, 'Expected six selected guest cases');
const seed = read('backend/prisma/seed.ts');
const available = new Set([...seed.matchAll(/^\s*slug:\s*"([a-z-]+)"/gm)].map((match) => match[1]));
const seen = new Set();
for (const item of trial.CHARMY_CASES) {
  check(!seen.has(item.id), `Repeated case ${item.id}`);
  seen.add(item.id);
  check(available.has(item.id), `Case ${item.id} not found in seeded data`);
  check(item.prompts.length === 5, `Case ${item.id} needs five guided questions`);
  check(item.prompts.every((p) => p.length >= 25), `Case ${item.id} has a prompt without context`);
  check(fs.existsSync(path.join(root, 'frontend/public-assets', item.image.slice(1))), `Image missing: ${item.image}`);
  check(trial.findCharmyCase(item.id)?.id === item.id, 'Case lookup mismatch');
  check(trial.accountUrl('registro', item.id).startsWith('/registro?next=%2Fsimulacion'), 'Registration redirect invalid');
  check(trial.accountUrl('login', item.id).startsWith('/login?next=%2Fsimulacion'), 'Login redirect invalid');
}
check(trial.findCharmyCase('__missing__') === null, 'Invalid guest case accepted');
check(trial.guestObservation('hola').includes('ejemplo'), 'Guest suggestion missing');
const home = read('frontend/src/pages/index.astro');
const page = read('frontend/src/pages/probar.astro');
const catalog = read('frontend/src/pages/escenarios.astro');
const welcome = read('frontend/src/components/vue/CharmyWelcome.vue');
const component = read('frontend/src/components/vue/CharmyTrial.vue');
const layout = read('frontend/src/layouts/BaseLayout.astro');
const styles = read('frontend/src/styles/charmy-v165.css');
check(home.includes('<CharmyWelcome client:load />') && home.includes('CHARMY_CASES.map'), 'Home does not expose mascot and real cases');
check(home.includes('href="/probar"') && home.includes('id="elige-caso"'), 'Guest entry or case selection missing');
check(!home.includes('FEATURED_SCENARIOS.map'), 'Obsolete featured corporate cards remain on home');
check(page.includes('<CharmyTrial client:load />'), 'Guest demo route missing');
check(catalog.includes('<ScenarioCatalog client:load />'), 'Complete catalog route missing');
check(component.includes('speechSynthesis') && component.includes('SpeechSynthesisUtterance'), 'Charmy does not use native speech synthesis');
check(component.includes('recognitionClass()') && component.includes('startListening()'), 'Optional microphone entry missing');
check(component.includes('endTrial(true)') && component.includes('CHARMY_TRIAL_SECONDS'), 'Guest time limit missing');
check(component.includes("step.value = 'done'") && component.includes('registerHref'), 'Guest flow does not lead to registration');
check(!component.includes('apiPost(') && !component.includes('localStorage.setItem'), 'Guest answers must not persist');
check(component.includes('prefers-reduced-motion') && welcome.includes('prefers-reduced-motion'), 'Reduced-motion static images not available');
check(layout.includes('charmy-v165.css') && layout.includes('<CreatorModal client:load />'), 'Global style or creator lost');
check(layout.includes('Navegación móvil') && layout.includes('dale-mobile-menu-panel'), 'Mobile menu lost');
check(styles.includes('@media(max-width: 38rem)') && styles.includes('prefers-reduced-motion'), 'Responsive or motion controls missing');
for (const asset of ['charmy-talk.webp', 'charmy-static.webp', 'charmy-icon.webp']) {
  const location = path.join(root, 'frontend/public-assets/charmy', asset);
  check(fs.existsSync(location) && fs.statSync(location).size > 2000, `Charmy asset missing: ${asset}`);
}
check(JSON.parse(read('package.json')).version === '0.16.5', 'Root version mismatch');
check(JSON.parse(read('backend/package.json')).version === '0.16.5', 'Backend version mismatch');
check(JSON.parse(read('frontend/package.json')).version === '0.16.5', 'Frontend version mismatch');
check(read('backend/src/version.ts').includes('APP_VERSION = "0.16.5"'), 'Backend health version mismatch');
check(read('scripts/generar_docs_vue.mjs').includes('CharmyTrial:') && read('scripts/generar_docs_vue.mjs').includes('CharmyWelcome:'), 'Vue docs metadata missing');
if (errors.length) {
  console.error(`Dale Charmy ux:check FALLÓ (${errors.length}/${assertions}):`);
  errors.forEach((e) => console.error(` - ${e}`));
  process.exitCode = 1;
} else {
  console.log(`Dale Charmy ux:check OK (${assertions} verificaciones): 6 casos, 5 preguntas por caso, voz, temporizador, privacidad, responsive, docs y versiones.`);
}
