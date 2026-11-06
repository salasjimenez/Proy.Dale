#!/usr/bin/env node
/** Dale 0.16.5: portada Charmy primero, casos reales sin banners empresariales. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const errors = [];
function check(ok, message) { if (!ok) errors.push(message); }
const home = read('frontend/src/pages/index.astro');
const cases = read('frontend/src/lib/charmyTrial.ts');
const catalog = read('frontend/src/components/vue/ScenarioCatalog.vue');
const card = read('frontend/src/components/vue/ScenarioCard.vue');
check(home.includes('CharmyWelcome client:load'), 'Falta el avatar animado Charmy en inicio');
check(home.includes('CHARMY_CASES.map') && home.includes('charmy-case-card'), 'Faltan los casos seleccionables');
check(home.includes('href="/probar"'), 'Falta la introducción sin registro');
check(home.includes('charmy-preview-analytics') && home.includes('Vista ilustrativa'), 'Falta aviso sobre vista de métricas ilustrativa');
check(fs.existsSync(path.join(root,'frontend/src/pages/probar.astro')), 'Falta /probar');
check(fs.existsSync(path.join(root,'frontend/src/pages/escenarios.astro')), 'Falta catálogo completo');
check(cases.includes('entrevista-trabajo') && cases.includes('iniciar-conversacion'), 'No se conservan escenarios reales');
check(catalog.includes('groupedScenarios') && catalog.includes('scenarioBase'), 'Se perdió agrupación de escenarios');
check(card.includes('scenarioVisual(props.scenario.slug)'), 'Las tarjetas ya no usan imágenes existentes');
check(JSON.parse(read('package.json')).version === '0.16.5', 'Versión raíz inesperada');
if (errors.length) { console.error('Dale home:check FALLÓ'); errors.forEach((e)=>console.error('- '+e)); process.exitCode=1; }
else console.log('Dale home:check OK: portada Charmy, selección real de casos, catálogos y métricas honestas.');
