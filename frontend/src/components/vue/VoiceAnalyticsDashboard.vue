<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ApiError, apiGet } from "../../lib/api";
import type { ProgressPoint, ProgressResponse } from "../../types/progress";

const loading = ref(true);
const error = ref("");
const authRequired = ref(false);
const points = ref<ProgressPoint[]>([]);

function average(values: Array<number | null | undefined>, decimals = 0): number | null {
  const usable = values.filter((n): n is number => typeof n === "number" && Number.isFinite(n));
  if (!usable.length) return null;
  const multiplier = 10 ** decimals;
  return Math.round(usable.reduce((sum, n) => sum + n, 0) / usable.length * multiplier) / multiplier;
}
function metric(value: number | null | undefined, suffix = ""): string {
  return value === null || value === undefined ? "Sin datos" : `${value}${suffix}`;
}
function shortDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "Fecha desconocida" : new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}
const voiceOnly = computed(() => points.value.filter(point => point.modalidad === "VOZ"));
const count = computed(() => voiceOnly.value.length);
const hardVoiceOnly = computed(() => voiceOnly.value.filter(point => point.escenario.nivel.codigo === "DIFICIL"));
const hardAvgScore = computed(() => average(hardVoiceOnly.value.map(point => point.metricas.puntajeGeneral)));
const hardAvgWpm = computed(() => average(hardVoiceOnly.value.map(point => point.metricas.palabrasPorMinuto)));
const avgScore = computed(() => average(voiceOnly.value.map(p => p.metricas.puntajeGeneral)));
const avgWpm = computed(() => average(voiceOnly.value.map(p => p.metricas.palabrasPorMinuto)));
const avgPauses = computed(() => average(voiceOnly.value.map(p => p.metricas.cantidadPausas), 1));
const avgFillers = computed(() => average(voiceOnly.value.map(p => p.metricas.muletillasTotal), 1));
const avgRepetitions = computed(() => average(voiceOnly.value.map(p => p.metricas.repeticiones), 1));
const chartValues = computed(() => voiceOnly.value
  .filter(p => typeof p.metricas.puntajeGeneral === "number")
  .map(p => ({ label: shortDate(p.fecha), value: p.metricas.puntajeGeneral as number })));
const improvement = computed(() => chartValues.value.length >= 2
  ? chartValues.value.at(-1)!.value - chartValues.value[0]!.value : null);
const chartWidth = 720;
const chartHeight = 220;
const chartPoints = computed(() => chartValues.value.map((point, index) => ({
  ...point,
  x: 42 + index * (chartWidth - 75) / Math.max(1, chartValues.value.length - 1),
  y: 20 + (100 - point.value) / 100 * (chartHeight - 58),
})));
const chartLine = computed(() => chartPoints.value.map(p => `${p.x},${p.y}`).join(" "));
const advice = computed(() => {
  if (count.value === 0) return "Completa una simulación por voz para generar indicadores comparables.";
  if (avgWpm.value !== null && avgWpm.value > 165) return "Tu velocidad media fue elevada en esta muestra. Prueba un ritmo más pausado.";
  if (avgWpm.value !== null && avgWpm.value < 105) return "Tu velocidad media fue baja en esta muestra. Ensaya transiciones más continuas.";
  if (avgFillers.value !== null && avgFillers.value >= 3) return "Prueba a reducir las muletillas de la transcripción, sustituyéndolas por pausas breves.";
  if (avgRepetitions.value !== null && avgRepetitions.value >= 2) return "Ensaya frases más directas, evitando repetir palabras consecutivas.";
  return "Continúa entrenando: observa las diferencias entre intentos antes de sacar conclusiones.";
});
async function load(): Promise<void> {
  loading.value = true;
  error.value = "";
  authRequired.value = false;
  try {
    const response = await apiGet<ProgressResponse>("/api/progreso?modalidad=VOZ&limit=30");
    points.value = response.data.serie;
  } catch (caught) {
    if (caught instanceof ApiError && caught.status === 401) authRequired.value = true;
    else error.value = caught instanceof ApiError ? caught.message : "No se pudo cargar la analítica vocal.";
    points.value = [];
  } finally {
    loading.value = false;
  }
}
onMounted(() => void load());
</script>

<template>
  <section class="mx-auto w-full max-w-6xl min-w-0 space-y-6" aria-labelledby="voice-analytics-heading">
    <header class="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6 sm:p-8">
      <p class="text-xs font-black uppercase tracking-widest text-blue-800">Analítica de voz</p>
      <h1 id="voice-analytics-heading" class="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">Tu voz en números, sin inventar datos</h1>
      <p class="mt-3 max-w-3xl text-sm leading-7 text-slate-700">Compara hasta 30 prácticas de voz completadas. Dale estima el ritmo y las pausas y cuenta muletillas y repeticiones en la transcripción. No califica emociones ni expresiones faciales.</p>
    </header>

    <p v-if="loading" class="rounded-2xl bg-white p-6" role="status">Cargando estadísticas…</p>
    <div v-else-if="authRequired" class="rounded-2xl border border-amber-200 bg-amber-50 p-6">
      <h2 class="text-xl font-black">Inicia sesión para ver tu analítica</h2>
      <a href="/login?next=/analisis-voz" class="mt-4 inline-flex min-h-11 items-center rounded-xl bg-slate-950 px-5 py-3 font-bold text-white">Iniciar sesión</a>
    </div>
    <div v-else-if="error" class="rounded-2xl border border-rose-200 bg-rose-50 p-6" role="alert">
      <p class="font-bold">{{ error }}</p><button type="button" class="mt-4 min-h-11 rounded-lg border border-rose-400 px-5 py-2 font-bold" @click="load">Reintentar</button>
    </div>
    <div v-else-if="count === 0" class="rounded-2xl border border-slate-200 bg-white p-8">
      <h2 class="text-xl font-black">Aún no hay prácticas de voz completadas</h2>
      <p class="mt-3 text-slate-700">El tablero no mostrará ceros inventados para sesiones sin evidencia.</p>
      <a href="/entrenar" class="mt-4 inline-flex min-h-11 items-center rounded-xl bg-blue-700 px-5 py-3 font-bold text-white">Iniciar entrenamiento de voz</a>
    </div>
    <template v-else>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Indicadores de voz">
        <article class="rounded-2xl border border-slate-200 bg-white p-5"><p class="text-xs font-bold text-slate-600">Prácticas de voz</p><strong class="mt-2 block text-3xl font-black text-slate-950">{{ count }}</strong></article>
        <article class="rounded-2xl border border-slate-200 bg-white p-5"><p class="text-xs font-bold text-slate-600">Puntaje general medio</p><strong class="mt-2 block text-3xl font-black text-slate-950">{{ metric(avgScore, '/100') }}</strong></article>
        <article class="rounded-2xl border border-slate-200 bg-white p-5"><p class="text-xs font-bold text-slate-600">Palabras por minuto</p><strong class="mt-2 block text-3xl font-black text-slate-950">{{ metric(avgWpm) }}</strong></article>
        <article class="rounded-2xl border border-slate-200 bg-white p-5"><p class="text-xs font-bold text-slate-600">Pausas por práctica (media)</p><strong class="mt-2 block text-3xl font-black text-slate-950">{{ metric(avgPauses) }}</strong></article>
        <article class="rounded-2xl border border-slate-200 bg-white p-5"><p class="text-xs font-bold text-slate-600">Muletillas por práctica (media)</p><strong class="mt-2 block text-3xl font-black text-slate-950">{{ metric(avgFillers) }}</strong></article>
        <article class="rounded-2xl border border-slate-200 bg-white p-5"><p class="text-xs font-bold text-slate-600">Cambio entre primer y último puntaje visible</p><strong class="mt-2 block text-3xl font-black text-slate-950">{{ improvement === null ? 'Sin datos' : `${improvement > 0 ? '+' : ''}${improvement} pts` }}</strong></article>
      </div>
      <section class="rounded-3xl border border-blue-200 bg-white p-5 sm:p-7" aria-labelledby="hard-voice-history-heading">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div><p class="text-xs font-black uppercase tracking-widest text-blue-800">Modo Difícil</p><h2 id="hard-voice-history-heading" class="mt-2 text-xl font-black text-slate-950">Historial de simulaciones exigentes por voz</h2></div>
          <p class="rounded-lg bg-blue-50 px-3 py-2 text-sm font-bold text-blue-900">{{ hardVoiceOnly.length }} de las {{ count }} prácticas visibles</p>
        </div>
        <p class="mt-3 text-sm leading-6 text-slate-700">Solo utiliza intentos de voz en escenarios marcados DIFICIL dentro de los últimos 30 registros disponibles. Las puntuaciones son las consolidadas del backend, no una reconstrucción de las fases.</p>
        <p v-if="hardVoiceOnly.length === 0" class="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">Aún no hay intentos exigentes por voz entre las prácticas visibles.</p>
        <template v-else>
          <div class="mt-5 grid gap-3 sm:grid-cols-3">
            <div class="rounded-xl bg-slate-50 p-4"><span class="block text-xs font-semibold text-slate-600">Intentos</span><strong class="text-2xl font-black text-slate-950">{{ hardVoiceOnly.length }}</strong></div>
            <div class="rounded-xl bg-slate-50 p-4"><span class="block text-xs font-semibold text-slate-600">Puntaje general medio</span><strong class="text-2xl font-black text-slate-950">{{ metric(hardAvgScore) }}</strong></div>
            <div class="rounded-xl bg-slate-50 p-4"><span class="block text-xs font-semibold text-slate-600">Ritmo medio (palabras/min)</span><strong class="text-2xl font-black text-slate-950">{{ metric(hardAvgWpm) }}</strong></div>
          </div>
          <div class="mt-5 overflow-x-auto" tabindex="0" role="region" aria-label="Tabla desplazable de entrenamientos difíciles por voz">
            <table class="w-full min-w-[44rem] text-left text-sm">
              <caption class="mb-2 text-left font-bold text-slate-800">Últimos intentos exigentes por voz (máximo diez)</caption>
              <thead><tr class="border-b border-slate-200"><th scope="col" class="p-2">Fecha</th><th scope="col" class="p-2">Escenario</th><th scope="col" class="p-2">Puntaje</th><th scope="col" class="p-2">Palabras/min</th><th scope="col" class="p-2">Pausas</th><th scope="col" class="p-2">Muletillas</th><th scope="col" class="p-2">Repeticiones</th></tr></thead>
              <tbody><tr v-for="point in [...hardVoiceOnly].reverse().slice(0, 10)" :key="point.id" class="border-b border-slate-100"><td class="p-2">{{ shortDate(point.fecha) }}</td><td class="p-2">{{ point.escenario.titulo }}</td><td class="p-2">{{ metric(point.metricas.puntajeGeneral) }}</td><td class="p-2">{{ metric(point.metricas.palabrasPorMinuto) }}</td><td class="p-2">{{ point.metricas.cantidadPausas }}</td><td class="p-2">{{ point.metricas.muletillasTotal }}</td><td class="p-2">{{ point.metricas.repeticiones }}</td></tr></tbody>
            </table>
          </div>
        </template>
      </section>
      <section class="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7" aria-labelledby="voice-evolution-heading">
        <h2 id="voice-evolution-heading" class="text-xl font-black text-slate-950">Evolución del puntaje general</h2>
        <p class="mt-2 text-xs leading-5 text-slate-600">Puntajes de la API de progreso, no interpretaciones clínicas. La escala va de 0 a 100.</p>
        <div v-if="chartPoints.length" class="mt-5 overflow-x-auto" tabindex="0" role="region" aria-label="Gráfico desplazable de evolución del puntaje por voz">
          <svg :viewBox="`0 0 ${chartWidth} ${chartHeight}`" class="min-w-[600px] w-full max-w-full" role="img" aria-label="Gráfico de línea de puntajes por voz; los valores también figuran en la tabla accesible posterior">
            <line v-for="value in [0,25,50,75,100]" :key="value" x1="40" x2="690" :y1="20 + (100 - value) / 100 * (chartHeight - 58)" :y2="20 + (100 - value) / 100 * (chartHeight - 58)" stroke="#cbd5e1" />
            <text v-for="value in [0,25,50,75,100]" :key="`label-${value}`" x="7" :y="24 + (100 - value) / 100 * (chartHeight - 58)" font-size="12" fill="#334155">{{ value }}</text>
            <polyline v-if="chartPoints.length > 1" :points="chartLine" fill="none" stroke="#1d4ed8" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" />
            <g v-for="(point, index) in chartPoints" :key="index"><circle :cx="point.x" :cy="point.y" r="5" fill="#fff" stroke="#1d4ed8" stroke-width="3"><title>{{ `${point.label}: ${point.value}/100` }}</title></circle></g>
          </svg>
        </div>
        <div class="mt-6 overflow-x-auto">
          <table class="w-full min-w-[36rem] text-left text-sm">
            <caption class="mb-3 text-left font-bold text-slate-800">Detalle accesible de los últimos intentos por voz</caption>
            <thead><tr class="border-b border-slate-200"><th class="px-2 py-3" scope="col">Fecha</th><th class="px-2 py-3" scope="col">Escenario</th><th class="px-2 py-3" scope="col">Puntaje</th><th class="px-2 py-3" scope="col">Palabras/min</th><th class="px-2 py-3" scope="col">Muletillas</th></tr></thead>
            <tbody><tr v-for="point in [...voiceOnly].reverse().slice(0, 10)" :key="point.id" class="border-b border-slate-100"><td class="px-2 py-3">{{ shortDate(point.fecha) }}</td><td class="px-2 py-3">{{ point.escenario.titulo }}</td><td class="px-2 py-3 font-bold">{{ metric(point.metricas.puntajeGeneral) }}</td><td class="px-2 py-3">{{ metric(point.metricas.palabrasPorMinuto) }}</td><td class="px-2 py-3">{{ point.metricas.muletillasTotal }}</td></tr></tbody>
          </table>
        </div>
      </section>
      <section class="rounded-3xl border border-blue-200 bg-blue-50 p-6 sm:p-8">
        <h2 class="text-xl font-black text-slate-950">Tu próximo foco</h2>
        <p class="mt-3 max-w-3xl text-sm leading-7 text-blue-950">{{ advice }}</p>
        <p class="mt-3 text-xs leading-5 text-blue-950">Estos indicadores son aproximaciones basadas en transcripciones y silencios. Una puntuación no describe tu personalidad, persuasión, expresión facial ni estado emocional.</p>
        <div class="mt-5 flex flex-wrap gap-3"><a href="/entrenar" class="inline-flex min-h-11 items-center rounded-xl bg-blue-700 px-5 py-3 font-bold text-white">Volver a entrenar</a><a href="/progreso" class="inline-flex min-h-11 items-center rounded-xl border border-blue-400 bg-white px-5 py-3 font-bold">Ver todas las prácticas</a></div>
      </section>
    </template>
  </section>
</template>
