<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ApiError, apiGet } from "../../lib/api";
import type {
  ProgressMetricKey,
  ProgressMode,
  ProgressPoint,
  ProgressResponse,
  ProgressSummary,
} from "../../types/progress";

const loading = ref(true);
const error = ref("");
const authenticated = ref(true);
const mode = ref<ProgressMode>("TODAS");
const metric = ref<ProgressMetricKey>("puntajeGeneral");
const points = ref<ProgressPoint[]>([]);
const summary = ref<ProgressSummary | null>(null);

const modeOptions: Array<{ key: ProgressMode; label: string }> = [
  { key: "TODAS", label: "Todas" },
  { key: "VOZ", label: "Voz" },
  { key: "TEXTO", label: "Texto" },
];

const metricOptions: Array<{ key: ProgressMetricKey; label: string; voiceOnly: boolean }> = [
  { key: "puntajeGeneral", label: "Puntaje general", voiceOnly: false },
  { key: "puntajeRitmo", label: "Ritmo", voiceOnly: true },
  { key: "puntajePausas", label: "Pausas", voiceOnly: true },
  { key: "puntajeMuletillas", label: "Muletillas", voiceOnly: false },
];

const chartWidth = 760;
const chartHeight = 280;
const padding = { top: 22, right: 22, bottom: 42, left: 48 };

const selectedMetricLabel = computed(
  () => metricOptions.find((option) => option.key === metric.value)?.label ?? "Puntaje",
);

const chartPoints = computed(() => {
  const available = points.value
    .map((point) => ({ point, value: point.metricas[metric.value] }))
    .filter((item): item is { point: ProgressPoint; value: number } => typeof item.value === "number");

  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  return available.map((item, index) => {
    const x =
      available.length <= 1
        ? padding.left + innerWidth / 2
        : padding.left + (index / (available.length - 1)) * innerWidth;
    const y = padding.top + ((100 - item.value) / 100) * innerHeight;
    return { ...item, x, y };
  });
});

const linePath = computed(() =>
  chartPoints.value
    .map((item, index) => `${index === 0 ? "M" : "L"} ${item.x.toFixed(2)} ${item.y.toFixed(2)}`)
    .join(" "),
);

const areaPath = computed(() => {
  if (chartPoints.value.length === 0) return "";
  const first = chartPoints.value[0];
  const last = chartPoints.value.at(-1)!;
  const baseY = chartHeight - padding.bottom;
  return `${linePath.value} L ${last.x.toFixed(2)} ${baseY} L ${first.x.toFixed(2)} ${baseY} Z`;
});

const yTicks = [100, 75, 50, 25, 0];

function formatDate(value: string, short = false): string {
  const options: Intl.DateTimeFormatOptions = short
    ? { day: "2-digit", month: "short" }
    : { dateStyle: "medium" };
  return new Intl.DateTimeFormat("es-PE", options).format(new Date(value));
}

function formatScore(value: number | null): string {
  return value === null ? "—" : `${Math.round(value)}`;
}

function formatChange(value: number | null): string {
  if (value === null) return "Sin comparación";
  if (value === 0) return "0 puntos";
  return `${value > 0 ? "+" : ""}${value} puntos`;
}

function changeClass(value: number | null): string {
  if (value === null || value === 0) return "text-slate-700";
  return value > 0 ? "text-emerald-700" : "text-amber-700";
}

async function loadProgress() {
  loading.value = true;
  error.value = "";

  try {
    const response = await apiGet<ProgressResponse>(
      `/api/progreso?modalidad=${encodeURIComponent(mode.value)}&limit=30`,
    );
    summary.value = response.data.resumen;
    points.value = response.data.serie;

    const selected = metricOptions.find((option) => option.key === metric.value);
    if (selected?.voiceOnly && mode.value === "TEXTO") {
      metric.value = "puntajeGeneral";
    }
  } catch (caught) {
    if (caught instanceof ApiError && caught.status === 401) {
      authenticated.value = false;
      error.value = "Necesitas iniciar sesión para ver tu progreso.";
    } else {
      error.value = "No pudimos cargar tu progreso en este momento.";
    }
  } finally {
    loading.value = false;
  }
}

async function setMode(nextMode: ProgressMode) {
  if (mode.value === nextMode) return;
  mode.value = nextMode;
  await loadProgress();
}

onMounted(loadProgress);
</script>

<template>
  <section class="mx-auto max-w-6xl">
    <div v-if="loading" class="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <p class="text-sm font-semibold text-slate-500">Calculando tu progreso...</p>
    </div>

    <div v-else-if="!authenticated" class="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <p class="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Mi voz, mi progreso</p>
      <h1 class="mt-3 text-3xl font-black tracking-tight text-slate-950">Inicia sesión para ver tu evolución</h1>
      <p class="mx-auto mt-3 max-w-xl text-slate-600">{{ error }}</p>
      <div class="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <a href="/login?next=/progreso" class="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-950 px-5 py-3 font-black text-white hover:bg-blue-700">Iniciar sesión</a>
        <a href="/registro?next=/progreso" class="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 hover:bg-slate-50">Crear cuenta</a>
      </div>
    </div>

    <div v-else>
      <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Dashboard personal</p>
          <h1 class="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Mi voz, mi progreso</h1>
          <p class="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Compara tus prácticas completadas y observa cómo cambian tus puntajes con el tiempo.
          </p>
        </div>

        <div class="inline-flex w-full rounded-2xl border border-slate-200 bg-white p-1 shadow-sm sm:w-auto" aria-label="Filtrar por modalidad">
          <button
            v-for="option in modeOptions"
            :key="option.key"
            type="button"
            class="min-h-11 flex-1 rounded-xl px-4 text-sm font-black transition sm:flex-none"
            :class="mode === option.key ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'"
            @click="setMode(option.key)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <p v-if="error" class="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{{ error }}</p>

      <div v-if="summary" class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-xs font-black uppercase tracking-wide text-slate-500">Prácticas completadas</p>
          <strong class="mt-2 block text-3xl font-black text-slate-950">{{ summary.totalCompletadas }}</strong>
          <p class="mt-1 text-sm text-slate-500">Según el filtro actual.</p>
        </article>
        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-xs font-black uppercase tracking-wide text-slate-500">Puntaje promedio</p>
          <strong class="mt-2 block text-3xl font-black text-slate-950">{{ formatScore(summary.puntajePromedio) }}<span v-if="summary.puntajePromedio !== null" class="text-base text-slate-400">/100</span></strong>
          <p class="mt-1 text-sm text-slate-500">Promedio de los intentos mostrados.</p>
        </article>
        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-xs font-black uppercase tracking-wide text-slate-500">Último puntaje</p>
          <strong class="mt-2 block text-3xl font-black text-slate-950">{{ formatScore(summary.puntajeActual) }}<span v-if="summary.puntajeActual !== null" class="text-base text-slate-400">/100</span></strong>
          <p class="mt-1 text-sm text-slate-500">Tu práctica completada más reciente.</p>
        </article>
        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-xs font-black uppercase tracking-wide text-slate-500">Cambio en el período</p>
          <strong class="mt-2 block text-xl font-black" :class="changeClass(summary.cambioDesdePrimera)">{{ formatChange(summary.cambioDesdePrimera) }}</strong>
          <p class="mt-1 text-sm text-slate-500">Último puntaje frente al primero visible.</p>
        </article>
      </div>

      <div v-if="points.length === 0" class="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
        <h2 class="text-2xl font-black text-slate-950">Aún no hay datos para este filtro</h2>
        <p class="mx-auto mt-3 max-w-xl text-slate-600">Completa una práctica para empezar a construir una serie de progreso comparable.</p>
        <a href="/#escenarios" class="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-950 px-5 py-3 font-black text-white hover:bg-blue-700">Practicar ahora</a>
      </div>

      <template v-else>
        <article class="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Evolución</p>
              <h2 class="mt-2 text-2xl font-black text-slate-950">{{ selectedMetricLabel }}</h2>
              <p class="mt-2 text-sm text-slate-600">Cada punto corresponde a una práctica completada. La escala de puntajes va de 0 a 100.</p>
            </div>
            <label class="text-sm font-bold text-slate-700">
              Métrica
              <select v-model="metric" class="mt-1 block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 sm:min-w-52">
                <option
                  v-for="option in metricOptions"
                  :key="option.key"
                  :value="option.key"
                  :disabled="option.voiceOnly && mode === 'TEXTO'"
                >
                  {{ option.label }}{{ option.voiceOnly ? " · voz" : "" }}
                </option>
              </select>
            </label>
          </div>

          <div v-if="chartPoints.length === 0" class="mt-6 rounded-2xl bg-slate-50 p-6 text-center text-sm font-semibold text-slate-600">
            Esta métrica no está disponible en las prácticas seleccionadas.
          </div>

          <div v-else class="mt-6 overflow-x-auto">
            <svg
              class="min-w-[680px]"
              :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
              role="img"
              :aria-label="`Gráfico de evolución de ${selectedMetricLabel.toLowerCase()}`"
            >
              <defs>
                <linearGradient id="daleProgressArea" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stop-color="#2563eb" stop-opacity="0.22" />
                  <stop offset="100%" stop-color="#2563eb" stop-opacity="0.02" />
                </linearGradient>
              </defs>

              <g v-for="tick in yTicks" :key="tick">
                <line
                  :x1="padding.left"
                  :x2="chartWidth - padding.right"
                  :y1="padding.top + ((100 - tick) / 100) * (chartHeight - padding.top - padding.bottom)"
                  :y2="padding.top + ((100 - tick) / 100) * (chartHeight - padding.top - padding.bottom)"
                  stroke="#e2e8f0"
                  stroke-width="1"
                />
                <text
                  :x="padding.left - 10"
                  :y="padding.top + ((100 - tick) / 100) * (chartHeight - padding.top - padding.bottom) + 4"
                  text-anchor="end"
                  font-size="11"
                  fill="#64748b"
                >{{ tick }}</text>
              </g>

              <path v-if="chartPoints.length > 1" :d="areaPath" fill="url(#daleProgressArea)" />
              <path v-if="chartPoints.length > 1" :d="linePath" fill="none" stroke="#2563eb" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />

              <g v-for="item in chartPoints" :key="item.point.id">
                <circle :cx="item.x" :cy="item.y" r="5" fill="#ffffff" stroke="#1d4ed8" stroke-width="3">
                  <title>{{ `${item.point.escenario.titulo}: ${item.value}/100 · ${formatDate(item.point.fecha)}` }}</title>
                </circle>
              </g>

              <text
                v-if="chartPoints.length > 0"
                :x="chartPoints[0].x"
                :y="chartHeight - 15"
                text-anchor="start"
                font-size="11"
                fill="#64748b"
              >{{ formatDate(chartPoints[0].point.fecha, true) }}</text>
              <text
                v-if="chartPoints.length > 1"
                :x="chartPoints.at(-1)?.x"
                :y="chartHeight - 15"
                text-anchor="end"
                font-size="11"
                fill="#64748b"
              >{{ formatDate(chartPoints.at(-1)!.point.fecha, true) }}</text>
            </svg>
          </div>
        </article>

        <div class="mt-8 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <article class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p class="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Lectura rápida</p>
            <h2 class="mt-2 text-2xl font-black text-slate-950">Indicadores del período</h2>
            <dl class="mt-5 space-y-4">
              <div class="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <dt class="text-sm font-semibold text-slate-600">Mejor puntaje</dt>
                <dd class="font-black text-slate-950">{{ formatScore(summary?.mejorPuntaje ?? null) }}<span v-if="summary?.mejorPuntaje !== null">/100</span></dd>
              </div>
              <div class="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <dt class="text-sm font-semibold text-slate-600">Prácticas de voz visibles</dt>
                <dd class="font-black text-slate-950">{{ summary?.practicasVoz ?? 0 }}</dd>
              </div>
              <div class="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <dt class="text-sm font-semibold text-slate-600">Prácticas de texto visibles</dt>
                <dd class="font-black text-slate-950">{{ summary?.practicasTexto ?? 0 }}</dd>
              </div>
              <div class="flex items-center justify-between gap-4">
                <dt class="text-sm font-semibold text-slate-600">Promedio de palabras/min</dt>
                <dd class="font-black text-slate-950">{{ summary?.promedioPalabrasPorMinuto ?? "—" }}</dd>
              </div>
            </dl>
            <p class="mt-5 rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">
              Las métricas de ritmo y pausas solo existen en prácticas de voz. Dale muestra tendencias de práctica, no diagnósticos personales.
            </p>
          </article>

          <article class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div class="flex items-end justify-between gap-4">
              <div>
                <p class="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Detalle</p>
                <h2 class="mt-2 text-2xl font-black text-slate-950">Últimos puntos de la serie</h2>
              </div>
              <span class="text-xs font-bold text-slate-500">Hasta 30 intentos</span>
            </div>

            <div class="mt-5 space-y-3">
              <article
                v-for="item in [...points].reverse().slice(0, 6)"
                :key="item.id"
                class="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">{{ item.modalidad === "VOZ" ? "Voz" : "Texto" }}</span>
                    <span class="text-xs font-semibold text-slate-500">{{ item.escenario.categoria.nombre }} · {{ item.escenario.nivel.nombre }}</span>
                  </div>
                  <h3 class="mt-2 truncate font-black text-slate-950">{{ item.escenario.titulo }}</h3>
                  <p class="mt-1 text-xs text-slate-500">{{ formatDate(item.fecha) }}</p>
                </div>
                <div class="shrink-0 rounded-xl bg-slate-50 px-4 py-2 text-center">
                  <span class="block text-[11px] font-black uppercase tracking-wide text-slate-500">General</span>
                  <strong class="text-xl font-black text-slate-950">{{ item.metricas.puntajeGeneral ?? "—" }}</strong>
                  <span v-if="item.metricas.puntajeGeneral !== null" class="text-xs text-slate-500">/100</span>
                </div>
              </article>
            </div>
          </article>
        </div>
      </template>
    </div>
  </section>
</template>
