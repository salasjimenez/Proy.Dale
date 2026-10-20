#!/usr/bin/env node
/**
 * Dale P2: release guard. Run with production env vars in a controlled shell.
 * Prints only variable names/errors, never secrets.
 * This is not a replacement for HTTP end-to-end, legal review or npm audit.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const warnings = [];
const requireValue = (name) => {
  const value = process.env[name]?.trim() || '';
  if (!value) failures.push(`${name} no está definida`);
  return value;
};
const checkUrl = (name, val, type = 'https') => {
  if (!val) return null;
  try {
    const url = new URL(val);
    if (url.protocol !== `${type}:`) failures.push(`${name} debe usar ${type.toUpperCase()}`);
    if (url.hostname === 'localhost' || /^127\./.test(url.hostname) || url.hostname.endsWith('.local')) {
      failures.push(`${name} utiliza un host local`);
    }
    if (url.username || url.password) failures.push(`${name} no debe incluir credenciales en su URL`);
    return url;
  } catch {
    failures.push(`${name} tiene una URL inválida`);
    return null;
  }
};

if (process.env.NODE_ENV !== 'production') failures.push('NODE_ENV debe ser production');
const apiUrl = checkUrl('PUBLIC_API_URL', requireValue('PUBLIC_API_URL'));
const frontRaw = requireValue('FRONTEND_URL');
const frontUrls = frontRaw.split(',').map(v => v.trim()).filter(Boolean).map(v => checkUrl('FRONTEND_URL', v));
const database = requireValue('DATABASE_URL');
if (database) {
  if (!/^postgres(ql)?:\/\//.test(database)) failures.push('DATABASE_URL debe ser PostgreSQL');
  try {
    const parsed = new URL(database);
    if (parsed.hostname === 'localhost' || /^127\./.test(parsed.hostname)) failures.push('DATABASE_URL apunta a PostgreSQL local');
  } catch { failures.push('DATABASE_URL es inválida'); }
}
const jwtSecret = requireValue('JWT_SECRET');
if (jwtSecret && (jwtSecret.length < 32 || jwtSecret.toLowerCase().includes('change_me') || jwtSecret.includes('ci-only'))) {
  failures.push('JWT_SECRET debe ser único y de al menos 32 caracteres');
}
if (process.env.AUTH_COOKIE_SECURE !== 'true') failures.push('AUTH_COOKIE_SECURE debe ser true');
const sameSite = (process.env.AUTH_COOKIE_SAME_SITE || 'lax').toLowerCase();
if (!['lax','strict','none'].includes(sameSite)) failures.push('AUTH_COOKIE_SAME_SITE inválido');
if (sameSite === 'none' && process.env.AUTH_COOKIE_SECURE !== 'true') failures.push('SameSite=None requiere cookies Secure');
// Approximation for common domains. A browser end-to-end test is still required.
function siteKey(hostname) {
  const parts = hostname.toLowerCase().split('.');
  const end = parts.slice(-2).join('.');
  if (['vercel.app', 'onrender.com', 'netlify.app', 'pages.dev', 'github.io'].includes(end)) {
    return parts.slice(-3).join('.');
  }
  return end;
}
if (apiUrl && frontUrls[0]) {
  const crossSite = apiUrl.protocol !== frontUrls[0].protocol ||
    siteKey(apiUrl.hostname) !== siteKey(frontUrls[0].hostname);
  if (crossSite && sameSite !== 'none') {
    failures.push('Frontend y API parecen cross-site: cookies SameSite=Lax/Strict no funcionarán en fetch con credenciales');
  }
  if (crossSite && sameSite === 'none') {
    warnings.push('Las cookies cross-site pueden ser bloqueadas por el navegador; preferir mismo sitio o reverse proxy');
  }
}
if (Number(process.env.DALE_BACKEND_REPLICAS || '1') > 1) {
  failures.push('Rate limiting en memoria no es distribuido: configurar un límite compartido antes de usar múltiples réplicas');
}
if (!fs.existsSync(path.join(root,'backend/prisma/schema.prisma'))) failures.push('Falta el esquema Prisma');
console.log('Dale production preflight (sin imprimir secretos):');
for (const warning of warnings) console.warn(`ADVERTENCIA: ${warning}`);
if (failures.length) {
  failures.forEach(x => console.error(`BLOQUEO: ${x}`));
  process.exit(1);
}
console.log('Configuración esencial: OK. Faltan pruebas E2E, auditoría npm, backups y revisión legal.');
