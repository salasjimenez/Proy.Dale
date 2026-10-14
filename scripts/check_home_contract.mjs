#!/usr/bin/env node
/* Comprobacion estatica de integridad del rediseño de la portada. Sin dependencias nuevas. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const errors = [];
const assert = (condition, message) => {
  if (!condition) errors.push(message);
};

const visualCode = read("frontend/src/lib/scenarioVisuals.ts");
const home = read("frontend/src/pages/index.astro");
const catalog = read("frontend/src/components/vue/ScenarioCatalog.vue");
const card = read("frontend/src/components/vue/ScenarioCard.vue");
const seed = read("backend/prisma/seed.ts");
const availableTemplates = new Set([...seed.matchAll(/^\s*slug:\s*"([a-z-]+)"/gm)].map((item) => item[1]));
const featured = [...visualCode.matchAll(/slug:\s*"([a-z-]+-basico)"/g)].map((match) => match[1]);
assert(featured.length === 6, `Se esperaban 6 situaciones destacadas, encontradas ${featured.length}.`);
assert(new Set(featured).size === featured.length, "Hay slugs destacados duplicados.");
for (const slug of featured) {
  const base = slug.replace(/-basico$/, "");
  assert(availableTemplates.has(base), `El escenario destacado no existe en el seed: ${slug}`);
}

const images = new Set([
  ...[...visualCode.matchAll(/src:\s*"(\/landing\/[a-z-]+\.webp)"/g)].map((match) => match[1]),
  ...[...home.matchAll(/"(\/landing\/[a-z-]+\.webp)"/g)].map((match) => match[1]),
]);
assert(images.size >= 7, "Faltan ilustraciones locales para la portada y el catálogo.");
for (const image of images) {
  const file = path.join(root, "frontend", "public-assets", image.slice(1));
  assert(fs.existsSync(file) && fs.statSync(file).size > 1000, `No se encuentra la imagen local: ${image}`);
}
assert(home.includes("<ScenarioCatalog client:load />"), "No se encuentra el catálogo interactivo en la portada.");
assert(home.includes("<OnboardingGuide client:load />"), "No se conserva la guía de onboarding.");
assert(home.includes("FEATURED_SCENARIOS.map"), "Falta la sección de entrenamientos destacados.");
assert(catalog.includes("groupedScenarios") && catalog.includes("scenarioBase"), "El catálogo debe agrupar las variantes por situación.");
assert(catalog.includes("selectedTraining.slug"), "El enlace de práctica no utiliza la opción escogida por el usuario.");
assert(catalog.includes('get("categoria")'), "El catálogo no lee el filtro desde la URL.");
assert(card.includes("scenarioVisual(props.scenario.slug)"), "Las tarjetas no resuelven sus imágenes locales.");

const rootVersion = JSON.parse(read("package.json")).version;
assert(rootVersion === "0.16.4", `Versión raíz inesperada: ${rootVersion}`);

if (errors.length > 0) {
  console.error("Dale home:check: FALLÓ");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Dale home:check: OK (${featured.length} situaciones destacadas, ${images.size} ilustraciones locales).`);
