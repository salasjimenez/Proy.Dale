#!/usr/bin/env node
/* P2 static guard: fails if key QA remediations are accidentally removed. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const get = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const errors = [];
const check = (ok, label) => { if (!ok) errors.push(label); };
const pkg = JSON.parse(get('package.json'));
const back = JSON.parse(get('backend/package.json'));
const cfg = get('backend/vitest.config.ts');
const app = get('backend/src/app.ts');
const frontend = get('frontend/src/lib/api.ts');
const voice = get('frontend/src/components/vue/VoiceCapture.vue');
const layout = get('frontend/src/layouts/BaseLayout.astro');
const css = get('frontend/src/styles/responsive.css');
const production = get('scripts/check_production_readiness.mjs');

check(pkg.version === '0.16.4', 'P2 must not change the stable semantic version');
check(pkg.scripts['qa:p2']?.includes('check_qa_p2.mjs'), 'Missing qa:p2 script');
check(pkg.scripts['production:check']?.includes('check_production_readiness.mjs'), 'Missing production:check script');
check(pkg.scripts['security:audit']?.includes('npm audit'), 'Missing audited-dependency gate');
check(back.scripts.pretest?.includes('prisma:generate'), 'Prisma Client not generated before local tests');
check(cfg.includes('setupFiles'), 'Vitest has no test-only environment setup');
check(fs.existsSync(path.join(root, 'backend/tests/setup-env.ts')), 'Missing test environment fixtures');
check(fs.existsSync(path.join(root, 'backend/tests/origin-guard.routes.test.ts')), 'Missing origin guard tests');
check(app.includes('requireTrustedOrigin') && app.includes('app.use(requireTrustedOrigin)'), 'Missing origin guard');
check(frontend.includes('NETWORK_UNAVAILABLE') && frontend.includes('AbortError'), 'Network failures or cancellations are not handled');
check(!frontend.includes('|| "http://localhost:3000"'), 'Production still defaults directly to localhost');
check(voice.includes('selectedDialect') && voice.includes('instance.lang = selectedDialect.value'), 'Voice dialect is not configurable');
// The trigger is defined inside CreatorModal.vue; BaseLayout only mounts the island.
// Looking for the label in the layout causes a false negative on the real app.
const creatorPath = path.join(root, 'frontend/src/components/vue/CreatorModal.vue');
const creator = fs.existsSync(creatorPath) ? fs.readFileSync(creatorPath, 'utf8') : '';
check(layout.includes('dale-mobile-menu-panel'), 'Missing mobile navigation');
check(layout.includes('<CreatorModal client:load />') && creator.includes('>Creador</button>'), 'CreatorModal is not mounted or its trigger is missing');
check(creator.includes('www.instagram.com/pitx29/'), 'Missing creator Instagram link');
check(css.includes('Dale P2:') && css.includes('dale-site-footer'), 'Responsive QA fixes missing');
check(production.includes('AUTH_COOKIE_SECURE') && production.includes('DATABASE_URL') && production.includes('PUBLIC_API_URL'), 'Missing production environment checks');
check(get('README.md').includes('## Estado actual') && get('README.md').includes(pkg.version), 'README must show the current stable version');
check(get('docs/index.md').includes('etapa-16-4-parche-qa-p2.html'), 'QA documentation is not indexed');

if (errors.length) {
  console.error(`QA P2: FAILED (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log('QA P2: OK - environment, security, frontend, voice, navigation, documentation and production gates');
}
