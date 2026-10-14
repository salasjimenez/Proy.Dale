#!/usr/bin/env node
/*
 * Dale v0.16.2. Documentacion de componentes Vue generada desde el codigo fuente.
 * Node.js nativo: no agrega dependencias.
 * Uso: node scripts/generar_docs_vue.mjs --write | --check
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = path.join(root, 'frontend', 'src', 'components', 'vue');
const codeDir = path.join(root, 'docs', 'codigo');
const componentDir = path.join(root, 'docs', 'components');
const mode = process.argv[2];

if (mode !== '--write' && mode !== '--check') {
  console.error('Uso: node scripts/generar_docs_vue.mjs --write | --check');
  process.exit(2);
}

function normalize(value) {
  return value.replace(/\r\n?/g, '\n').trimEnd() + '\n';
}
function read(file) {
  return normalize(fs.readFileSync(file, 'utf8'));
}
function relative(file) {
  return path.relative(root, file).split(path.sep).join('/');
}
function fenced(language, source) {
  if (source.includes('```') || source.includes('{% endraw %}')) {
    throw new Error(`Fuente no compatible con delimitadores Markdown/Jekyll (${language}).`);
  }
  return `{% raw %}\n\n\`\`\`${language}\n${source.trimEnd()}\n\`\`\`\n\n{% endraw %}`;
}
function astro(name, markup, client = true) {
  return `---\nimport ${name} from "../components/vue/${name}.vue";\n---\n\n<${name}${client ? ' client:load' : ''}${markup ? ` ${markup}` : ''} />`;
}

const metadata = {
  AccessibilityControls: {
    description: 'Panel flotante de ajustes locales: tamano de texto y contraste, sin servidor ni cookies.',
    interface: 'Sin props ni eventos publicos. Guarda preferencias en localStorage y aplica atributos a html.',
    examples: [{ title: 'Montaje global en BaseLayout (Astro)', language: 'astro', source: astro('AccessibilityControls', '') }],
    notes: ['Requiere el script de inicio de BaseLayout.astro para evitar cambios visuales al cargar.', 'Las preferencias no se comparten entre dispositivos.'],
  },
  OnboardingGuide: {
    description: 'Guia voluntaria de cuatro pasos, con dialogo accesible y estado local.',
    interface: 'Sin props ni eventos publicos. Puede abrirse desde /?guia=1.',
    examples: [{ title: 'Montaje en portada (Astro)', language: 'astro', source: astro('OnboardingGuide', '') }],
    notes: ['No requiere cuenta ni permisos de microfono.', 'El dialogo conserva y devuelve el foco; Tab, Shift+Tab y Escape permiten operarlo por teclado.'],
  },
  AccountPanel: {
    description: 'Panel autenticado de Mi cuenta: historial, exportacion JSON, borrado de practicas y eliminacion de cuenta.',
    interface: 'Sin props ni eventos publicos. Consume las rutas protegidas del backend.',
    examples: [{ title: 'Montaje en /cuenta (Astro)', language: 'astro', source: astro('AccountPanel', '') }],
    notes: ['Requiere iniciar sesion y que el backend este disponible.', 'La eliminacion de cuenta pide la contrasena actual. No traslades esa validacion al frontend.'],
  },
  AuthForm: {
    description: 'Formulario de registro e inicio de sesion. Muestra validaciones por campo y envia la aceptacion legal obligatoria solo en registro.',
    interface: 'Prop obligatoria: mode: "login" | "register". No emite eventos personalizados.',
    examples: [
      { title: 'Registro (Astro)', language: 'astro', source: astro('AuthForm', 'mode="register"') },
      { title: 'Inicio de sesion (Astro)', language: 'astro', source: astro('AuthForm', 'mode="login"') },
    ],
    notes: ['El registro envia aceptaTerminos: true cuando el usuario marca la casilla; el backend la valida y registra fecha y version.', 'Mantiene las redirecciones seguras mediante el parametro next.'],
  },
  AuthNav: {
    description: 'Navegacion de autenticacion: muestra entrada, registro, cuenta o salida segun la sesion.',
    interface: 'Sin props ni eventos publicos; utiliza la cookie HttpOnly mediante el cliente API.',
    examples: [{ title: 'Montaje en el layout global (Astro)', language: 'astro', source: astro('AuthNav', '') }],
    notes: ['El estado de sesion se consulta al backend; no se debe intentar leer la cookie HttpOnly con JavaScript.'],
  },
  PracticeSimulator: {
    description: 'Orquesta practicas de texto y voz, consulta escenarios, crea y completa sesiones y muestra metricas.',
    interface: 'Sin props publicas. Obtiene el escenario desde /practicar?escenario=slug.',
    examples: [{ title: 'Pagina de practica (Astro)', language: 'astro', source: astro('PracticeSimulator', '') }],
    notes: ['Abre /practicar?escenario=entrevista-trabajo-basico para elegir un escenario valido.', 'La modalidad de voz depende de permiso de microfono y Web Speech API; Dale no guarda audio.'],
  },
  ProgressDashboard: {
    description: 'Dashboard de evolucion cronologica de puntajes y metricas; SVG nativo y filtros por modalidad.',
    interface: 'Sin props ni eventos publicos. Consume GET /api/progreso.',
    examples: [{ title: 'Pagina /progreso (Astro)', language: 'astro', source: astro('ProgressDashboard', '') }],
    notes: ['Requiere sesion; las metricas no disponibles no se reemplazan por ceros.'],
  },
  ScenarioCard: {
    description: 'Tarjeta ilustrada de situacion real con categoria y boton para elegir entrenamiento.',
    interface: 'Prop obligatoria: scenario: ScenarioCardData. Evento: select(scenario: ScenarioCardData).',
    examples: [{
      title: 'Uso dentro de un componente Vue', language: 'vue', source: `<script setup lang="ts">\nimport ScenarioCard from "./ScenarioCard.vue";\nimport type { ScenarioCardData } from "../../types/scenario";\n\nconst ejemplo: ScenarioCardData = {\n  id: "demo-1",\n  slug: "entrevista-trabajo-basico",\n  titulo: "Entrevista de trabajo",\n  descripcion: "Practica tu presentacion inicial.",\n  situacion: "La persona entrevistadora te pide que te presentes.",\n  instrucciones: "Responde con claridad durante un minuto.",\n  categoria: { codigo: "LABORAL", nombre: "Laboral" },\n  nivel: { codigo: "BASICO", nombre: "Basico" },\n};\n\nfunction seleccionar(scenario: ScenarioCardData) {\n  console.log("Escenario seleccionado:", scenario.slug);\n}\n</script>\n\n<template>\n  <ScenarioCard :scenario="ejemplo" @select="seleccionar" />\n</template>`,
    }],
    notes: ['Para el uso real conectado con GET /api/escenarios, consulta ScenarioCatalog.vue.'],
  },
  TrainingPlanner: {
    description: 'Selector de objetivos, etapa, modalidad y tiempo orientativo. Todas las sugerencias usan escenarios existentes.',
    interface: 'Sin props ni eventos. Usa datos locales y redirige a /practicar con parámetros seguros.',
    examples: [{ title: 'Selector de entrenamiento (Astro)', language: 'astro', source: astro('TrainingPlanner', '') }],
    notes: ['No necesita iniciar sesión para seleccionar, pero guardar prácticas requiere autenticación.', 'El tiempo de cinco minutos es orientativo y nunca envía una práctica sin decisión del usuario.'],
  },
  ScenarioCatalog: {
    description: 'Catalogo agrupado por situacion con busqueda, filtro por categoria y tres formas de entrenamiento.',
    interface: 'Sin props publicas. Obtiene datos de GET /api/escenarios.',
    examples: [{ title: 'Inicio: seccion escenarios (Astro)', language: 'astro', source: astro('ScenarioCatalog', '') }],
    notes: ['Depende de ScenarioCard.vue. El backend maneja filtros de categoria, nivel y texto.'],
  },
  ScenarioMapDashboard: {
    description: 'Mapa radar SVG de las categorias practicadas, cobertura y sugerencia de siguiente foco.',
    interface: 'Sin props publicas. Consume GET /api/mapa.',
    examples: [{ title: 'Pagina /mapa (Astro)', language: 'astro', source: astro('ScenarioMapDashboard', '') }],
    notes: ['Las categorias sin datos se distinguen de las categorias con puntaje cero.'],
  },
  VoiceCapture: {
    description: 'Captura de voz con Web Speech API y estimacion de pausas con Web Audio API, sin almacenar audio.',
    interface: 'Sin props. Eventos: complete(payload: VoiceCaptureResult) y error(message: string).',
    examples: [{
      title: 'Uso y eventos (Vue)', language: 'vue', source: `<script setup lang="ts">\nimport VoiceCapture, { type VoiceCaptureResult } from "./VoiceCapture.vue";\n\nfunction completar(result: VoiceCaptureResult) {\n  console.log(result.transcripcion, result.duracionMs, result.pausasDetalle);\n}\nfunction manejarError(mensaje: string) {\n  console.error(mensaje);\n}\n</script>\n\n<template>\n  <VoiceCapture @complete="completar" @error="manejarError" />\n</template>`,
    }],
    notes: ['Solicita permiso de microfono; para produccion requiere HTTPS.', 'El navegador puede procesar audio mediante servicios de su proveedor. Dale solo persiste transcripciones y metricas.'],
  },
};

const componentFiles = fs.readdirSync(sourceDir)
  .filter(name => name.endsWith('.vue'))
  .sort((a, b) => a.localeCompare(b, 'en'));
const componentNames = componentFiles.map(name => name.slice(0, -4));
const supportFiles = [
  ...fs.readdirSync(path.join(root, 'frontend', 'src', 'lib'))
    .filter(name => name.endsWith('.ts'))
    .map(name => `frontend/src/lib/${name}`),
  ...fs.readdirSync(path.join(root, 'frontend', 'src', 'types'))
    .filter(name => name.endsWith('.ts'))
    .map(name => `frontend/src/types/${name}`),
].sort();
const expected = new Map();

function supportPage(srcPath) {
  const parts = srcPath.split('/');
  return `${parts.at(-2)}-${parts.at(-1).replace(/\.ts$/, '')}`;
}
function dependenciesOf(componentPath, source) {
  const paths = [...source.matchAll(/\bfrom\s+["']([^"']+)["']/g)]
    .map(match => match[1])
    .filter(imp => imp.startsWith('.'));
  return [...new Set(paths)].map(imp => {
    const resolved = path.resolve(path.dirname(componentPath), imp);
    const target = fs.existsSync(resolved) ? resolved : `${resolved}.ts`;
    if (!fs.existsSync(target)) throw new Error(`Import no encontrado: ${relative(componentPath)} -> ${imp}`);
    const targetRelative = relative(target);
    if (target.endsWith('.vue')) {
      const targetName = path.basename(target, '.vue');
      return `[${targetName}.vue](${targetName}.html)`;
    }
    const slug = supportPage(targetRelative);
    if (!supportFiles.includes(targetRelative)) {
      throw new Error(`Dependencia TS sin documentacion: ${targetRelative}`);
    }
    return `[\`${targetRelative}\`](../codigo/${slug}.html)`;
  });
}

for (const filename of componentFiles) {
  const name = filename.replace(/\.vue$/, '');
  const spec = metadata[name];
  if (!spec) throw new Error(`Falta una ficha descriptiva para ${name}.vue`);
  const file = path.join(sourceDir, filename);
  const source = read(file);
  const links = dependenciesOf(file, source);
  const examples = spec.examples.map(item =>
    `### ${item.title}\n\n${fenced(item.language, item.source)}\n`
  ).join('\n');
  const dependencies = links.length ? links.map(link => `- ${link}`).join('\n') : 'No utiliza archivos locales adicionales.';
  const notes = spec.notes.map(note => `- ${note}`).join('\n');
  const body = `---\nlayout: default\ntitle: "${name}.vue | Dale"\n---\n\n# ${name}.vue\n\n${spec.description}\n\n**Archivo fuente:** \`frontend/src/components/vue/${filename}\`  \n**Interfaz:** ${spec.interface}\n\n## Requisitos y dependencias\n\n${dependencies}\n\nEn Dale se usa Astro + Vue + Tailwind CSS. Los imports relativos del codigo completo suponen la estructura original \`frontend/src\`; copia tambien las dependencias indicadas o adapta esas rutas a tu proyecto. Para las islas Astro, \`client:load\` habilita la interaccion en el navegador.\n\n## Ejemplos de uso\n\n${examples}\n## Codigo fuente completo — v0.16.2\n\nEl siguiente bloque reproduce el archivo Vue actual sin omisiones funcionales. Puedes copiarlo sobre \`${filename}\`.\n\n${fenced('vue', source)}\n\n## Consideraciones\n\n${notes}\n\nConsulta [todos los componentes](index.html) y el [codigo auxiliar reutilizable](../codigo/index.html).\n`;
  expected.set(path.join(componentDir, `${name}.md`), normalize(body));
}

const compList = componentNames.map(name => `- [${name}.vue](${name}.html): ${metadata[name].description}`).join('\n');
expected.set(path.join(componentDir, 'index.md'), normalize(`---\nlayout: default\ntitle: "Catalogo Vue | Dale"\n---\n\n# Catalogo de componentes Vue\n\nDocumentacion de los **${componentNames.length} componentes Vue reales** de Dale v0.16.2, generada directamente desde \`frontend/src/components/vue/\` sin recortar el codigo.\n\n${compList}\n\n## Como copiar e integrar\n\n1. Copia el bloque de codigo completo del componente a \`frontend/src/components/vue/\`.\n2. Copia los archivos TypeScript que aparezcan en **Requisitos y dependencias**, desde [Codigo auxiliar](../codigo/index.html).\n3. En Astro, importa el componente y agrega \`client:load\` cuando necesite interaccion.\n4. Configura \`PUBLIC_API_URL\` para que apunte a tu backend y ejecuta las migraciones si una funcionalidad las necesita.\n5. Comprueba los endpoints del backend y las restricciones de autenticacion.\n\nLos componentes conectados a la API no son demos aisladas: requieren backend Express, sesion y tipos correspondientes. Copiar solo el archivo \`.vue\` no reemplaza esos servicios.\n\n## Evitar desactualizacion\n\n- \`npm run docs:sync\`: regenera las paginas desde el codigo fuente.\n- \`npm run docs:check\`: verifica que los bloques documentados sean identicos al codigo.\n\nNo se agregan paquetes ni servicios externos para documentar los componentes.\n`));

for (const srcPath of supportFiles) {
  const name = supportPage(srcPath);
  const source = read(path.join(root, srcPath));
  expected.set(path.join(codeDir, `${name}.md`), normalize(`---\nlayout: default\ntitle: "${srcPath} | Dale"\n---\n\n# ${srcPath}\n\nArchivo de apoyo utilizado por los componentes de Dale. Copia el bloque completo a la misma ruta dentro de \`frontend/src\`, o ajusta sus imports segun la estructura del proyecto.\n\n${fenced('typescript', source)}\n\n[Volver a codigo auxiliar](index.html) · [Componentes Vue](../components/index.html)\n`));
}
expected.set(path.join(codeDir, 'index.md'), normalize(`---\nlayout: default\ntitle: "Codigo auxiliar | Dale"\n---\n\n# Codigo auxiliar para componentes Vue\n\nArchivos TypeScript que utilizan los componentes. Su contenido se sincroniza directamente con \`frontend/src\`, para que los ejemplos copiables no queden obsoletos.\n\n${supportFiles.map(srcPath => `- [\`${srcPath}\`](${supportPage(srcPath)}.html)`).join('\n')}\n\nLos archivos de tipos describen las estructuras reales; el cliente \`lib/api.ts\` trabaja con \`PUBLIC_API_URL\` y credenciales de sesion mediante cookies. **Nunca incluyas secretos ni archivos \`.env\` en la documentacion.**\n\n[Volver a componentes Vue](../components/index.html).\n`));

let changed = 0;
let missing = 0;
for (const [file, content] of expected) {
  const current = fs.existsSync(file) ? read(file) : null;
  if (current === content) continue;
  if (mode === '--check') {
    console.error(`DESACTUALIZADO: ${relative(file)}`);
    missing += 1;
  } else {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Actualizado: ${relative(file)}`);
    changed += 1;
  }
}

if (mode === '--check' && missing) {
  console.error(`Fallo: ${missing} documentos no coinciden con los fuentes. Ejecuta npm run docs:sync.`);
  process.exit(1);
}
console.log(mode === '--check'
  ? `Documentacion validada: ${componentNames.length} Vue + ${supportFiles.length} auxiliares.`
  : `Documentacion generada: ${componentNames.length} Vue + ${supportFiles.length} auxiliares; ${changed} archivos actualizados.`);
