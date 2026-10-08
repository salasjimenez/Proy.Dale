---
layout: default
title: "ScenarioMapDashboard.vue"
---

{% raw %}


# ScenarioMapDashboard.vue

Dashboard reutilizable que representa el desempeño por categoría mediante un radar SVG y tarjetas de detalle.

## Uso

```astro
---
import ScenarioMapDashboard from "../components/vue/ScenarioMapDashboard.vue";
---

<ScenarioMapDashboard client:load />
```

El componente consume `GET /api/mapa` usando la sesión autenticada del navegador.

## Código completo

```vue
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ApiError, apiGet } from "../../lib/api";
import type { ScenarioMapMode, ScenarioMapResponse } from "../../types/map";

const loading = ref(true);
const error = ref("");
const mode = ref<ScenarioMapMode>("TODAS");
const response = ref<ScenarioMapResponse | null>(null);

const width = 520;
const height = 430;
const centerX = 260;
const centerY = 205;
const radius = 138;
const gridLevels = [25, 50, 75, 100];
const modeOptions = [
  ["TODAS", "Todas"],
  ["VOZ", "Voz"],
  ["TEXTO", "Texto"],
] as const;

const categories = computed(() => response.value?.data.categorias ?? []);
const summary = computed(() => response.value?.data.resumen ?? null);
const categoriesWithData = computed(() =>
  categories.value.filter((category) => category.puntajePromedio !== null),
);
const hasData = computed(() => categoriesWithData.value.length > 0);

function polarPoint(index: number, total: number, scale: number) {
  const angle = -Math.PI / 2 + (index * Math.PI * 2) / total;
  return {
    x: centerX + Math.cos(angle) * radius * scale,
    y: centerY + Math.sin(angle) * radius * scale,
  };
}

function polygonForScale(scale: number): string {
  const total = Math.max(categories.value.length, 4);
  return Array.from({ length: total }, (_, index) => {
    const point = polarPoint(index, total, scale);
    return `${point.x},${point.y}`;
  }).join(" ");
}

const radarPoints = computed(() => {
  const total = categories.value.length;
  if (total === 0) return [];

  return categories.value.map((category, index) => {
    const score = category.puntajePromedio;
    const point = polarPoint(index, total, score === null ? 0 : score / 100);
    const axis = polarPoint(index, total, 1);
    const label = polarPoint(index, total, 1.22);
    return { category, point, axis, label };
  });
});

const dataPolygon = computed(() =>
  radarPoints.value.map((item) => `${item.point.x},${item.point.y}`).join(" "),
);

function formatScore(value: number | null): string {
  return value === null ? "—" : String(Math.round(value));
}

function formatDate(value: string | null): string {
  if (!value) return "Sin prácticas";
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "medium" }).format(new Date(value));
}

async function loadMap(nextMode: ScenarioMapMode = mode.value) {
  loading.value = true;
  error.value = "";

  try {
    const result = await apiGet<ScenarioMapResponse>(`/api/mapa?modalidad=${nextMode}`);
    response.value = result;
    mode.value = nextMode;
  } catch (caught) {
    if (caught instanceof ApiError && caught.status === 401) {
      error.value = "Necesitas iniciar sesión para ver tu mapa de escenarios.";
    } else {
      error.value = "No pudimos construir tu mapa en este momento.";
    }
  } finally {
    loading.value = false;
  }
}

onMounted(() => void loadMap());
</script>

<template>
  <section>
    <div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <span class="inline-flex rounded-full bg-cyan-50 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-cyan-800">Segundo dashboard</span>
        <h1 class="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Mapa de escenarios</h1>
        <p class="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Compara tu desempeño promedio entre las cuatro categorías de Dale. El objetivo es detectar dónde ya tienes evidencia de práctica y qué área conviene trabajar después.
        </p>
      </div>

      <div class="inline-flex w-full rounded-2xl border border-slate-200 bg-white p-1 shadow-sm sm:w-auto" aria-label="Filtrar por modalidad">
        <button
          v-for="item in modeOptions"
          :key="item[0]"
          type="button"
          class="min-h-11 flex-1 rounded-xl px-4 text-sm font-black transition sm:flex-none"
          :class="mode === item[0] ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-50'"
          :disabled="loading"
          @click="loadMap(item[0])"
        >
          {{ item[1] }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="mt-8 rounded-3xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500 shadow-sm">
      Construyendo tu mapa de escenarios...
    </div>

    <div v-else-if="error" class="mt-8 rounded-3xl border border-rose-200 bg-rose-50 p-8">
      <h2 class="text-xl font-black text-rose-950">No pudimos cargar el mapa</h2>
      <p class="mt-2 text-sm leading-6 text-rose-800">{{ error }}</p>
      <div class="mt-5 flex flex-wrap gap-3">
        <a href="/login?returnTo=/mapa" class="inline-flex min-h-11 items-center rounded-xl bg-slate-950 px-4 py-2 font-black text-white">Iniciar sesión</a>
        <button type="button" class="min-h-11 rounded-xl border border-rose-300 px-4 py-2 font-black text-rose-900" @click="loadMap()">Reintentar</button>
      </div>
    </div>

    <div v-else-if="response" class="mt-8">
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Categorías practicadas</p>
          <strong class="mt-2 block text-3xl font-black text-slate-950">{{ summary?.categoriasConDatos ?? 0 }}/{{ summary?.categoriasTotales ?? 4 }}</strong>
          <p class="mt-1 text-sm text-slate-600">Cobertura {{ summary?.coberturaPorcentaje ?? 0 }}%</p>
        </article>
        <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Promedio global</p>
          <strong class="mt-2 block text-3xl font-black text-slate-950">{{ formatScore(summary?.puntajePromedioGlobal ?? null) }}<span v-if="summary?.puntajePromedioGlobal !== null" class="text-base text-slate-500">/100</span></strong>
          <p class="mt-1 text-sm text-slate-600">Promedio de categorías con datos.</p>
        </article>
        <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Fortaleza actual</p>
          <strong class="mt-2 block text-xl font-black text-slate-950">{{ summary?.fortalezaActual?.nombre ?? "Sin datos" }}</strong>
          <p class="mt-1 text-sm text-slate-600">{{ summary?.fortalezaActual ? `${formatScore(summary.fortalezaActual.puntaje)}/100` : 'Completa una práctica.' }}</p>
        </article>
        <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Siguiente foco</p>
          <strong class="mt-2 block text-xl font-black text-slate-950">{{ summary?.siguienteCategoriaSugerida?.nombre ?? "Sin datos" }}</strong>
          <p class="mt-1 text-sm text-slate-600">
            {{ summary?.siguienteCategoriaSugerida?.tieneDatos ? 'Es el promedio más bajo entre tus categorías practicadas.' : 'Todavía no tienes una práctica completada aquí.' }}
          </p>
        </article>
      </div>

      <div v-if="!hasData" class="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
        <h2 class="text-2xl font-black text-slate-950">Tu radar necesita prácticas completadas</h2>
        <p class="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Completa al menos una práctica con puntaje. El mapa usa únicamente resultados reales de tu cuenta; una categoría sin datos no se interpreta como un puntaje bajo.
        </p>
        <a href="/#escenarios" class="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-700 px-5 py-3 font-black text-white hover:bg-blue-800">Elegir escenario</a>
      </div>

      <template v-else>
        <div class="mt-8 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
          <article class="overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p class="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Radar</p>
                <h2 class="mt-2 text-2xl font-black text-slate-950">Fortalezas por categoría</h2>
              </div>
              <span class="text-xs font-bold text-slate-500">Escala 0–100</span>
            </div>

            <div class="mt-5 overflow-x-auto">
              <svg
                class="mx-auto h-auto min-w-[430px] max-w-[620px]"
                :viewBox="`0 0 ${width} ${height}`"
                role="img"
                aria-label="Gráfico radar del desempeño promedio por categoría"
              >
                <g v-for="level in gridLevels" :key="level">
                  <polygon
                    :points="polygonForScale(level / 100)"
                    fill="none"
                    stroke="#e2e8f0"
                    stroke-width="1.5"
                  />
                  <text :x="centerX + 5" :y="centerY - radius * (level / 100) + 13" font-size="10" fill="#94a3b8">{{ level }}</text>
                </g>

                <g v-for="item in radarPoints" :key="item.category.codigo">
                  <line :x1="centerX" :y1="centerY" :x2="item.axis.x" :y2="item.axis.y" stroke="#cbd5e1" stroke-width="1.5" />
                  <text
                    :x="item.label.x"
                    :y="item.label.y"
                    text-anchor="middle"
                    dominant-baseline="middle"
                    font-size="12"
                    font-weight="700"
                    fill="#334155"
                  >
                    <tspan :x="item.label.x">{{ item.category.nombre }}</tspan>
                    <tspan :x="item.label.x" dy="16" font-size="11" font-weight="600" fill="#64748b">{{ item.category.puntajePromedio === null ? 'Sin datos' : `${formatScore(item.category.puntajePromedio)}/100` }}</tspan>
                  </text>
                  <circle
                    v-if="item.category.puntajePromedio !== null"
                    :cx="item.point.x"
                    :cy="item.point.y"
                    r="5"
                    fill="#ffffff"
                    stroke="#1d4ed8"
                    stroke-width="3"
                  >
                    <title>{{ `${item.category.nombre}: ${formatScore(item.category.puntajePromedio)}/100` }}</title>
                  </circle>
                </g>

                <polygon
                  v-if="categoriesWithData.length >= 2"
                  :points="dataPolygon"
                  fill="rgba(37, 99, 235, 0.16)"
                  stroke="#2563eb"
                  stroke-width="3"
                  stroke-linejoin="round"
                />
              </svg>
            </div>

            <p class="mt-3 rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">
              Una categoría sin prácticas aparece como “Sin datos”. Su posición central solo permite dibujar el radar y no representa una calificación de 0.
            </p>
          </article>

          <article class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p class="text-xs font-black uppercase tracking-[0.16em] text-cyan-800">Lectura del mapa</p>
            <h2 class="mt-2 text-2xl font-black text-slate-950">Qué trabajar después</h2>

            <div class="mt-5 space-y-4">
              <div v-if="summary?.fortalezaActual" class="rounded-2xl bg-emerald-50 p-4">
                <p class="text-xs font-black uppercase tracking-wide text-emerald-700">Fortaleza observada</p>
                <p class="mt-1 font-black text-emerald-950">{{ summary.fortalezaActual.nombre }} · {{ formatScore(summary.fortalezaActual.puntaje) }}/100</p>
              </div>

              <div v-if="summary?.areaMenorPromedio" class="rounded-2xl bg-amber-50 p-4">
                <p class="text-xs font-black uppercase tracking-wide text-amber-700">Menor promedio con evidencia</p>
                <p class="mt-1 font-black text-amber-950">{{ summary.areaMenorPromedio.nombre }} · {{ formatScore(summary.areaMenorPromedio.puntaje) }}/100</p>
              </div>

              <div v-else class="rounded-2xl bg-slate-50 p-4">
                <p class="text-xs font-black uppercase tracking-wide text-slate-500">Comparación pendiente</p>
                <p class="mt-1 text-sm font-semibold leading-6 text-slate-700">Practica al menos dos categorías para comparar una fortaleza con un área de menor promedio.</p>
              </div>

              <div v-if="summary?.siguienteCategoriaSugerida" class="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <p class="text-xs font-black uppercase tracking-wide text-blue-700">Siguiente práctica sugerida</p>
                <p class="mt-1 font-black text-blue-950">{{ summary.siguienteCategoriaSugerida.nombre }}</p>
                <p class="mt-1 text-sm leading-6 text-blue-800">
                  {{ summary.siguienteCategoriaSugerida.tieneDatos ? 'Refuerza esta categoría para equilibrar tu mapa.' : 'Explora esta categoría para completar tu cobertura.' }}
                </p>
              </div>
            </div>

            <a href="/#escenarios" class="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-950 px-5 py-3 font-black text-white hover:bg-blue-700">Ir a escenarios</a>
          </article>
        </div>

        <div class="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article
            v-for="category in categories"
            :key="category.codigo"
            class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Categoría</p>
                <h3 class="mt-1 text-lg font-black text-slate-950">{{ category.nombre }}</h3>
              </div>
              <span class="rounded-full px-2.5 py-1 text-xs font-black" :class="category.intentos > 0 ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'">
                {{ category.intentos }} {{ category.intentos === 1 ? 'intento' : 'intentos' }}
              </span>
            </div>

            <strong class="mt-5 block text-3xl font-black text-slate-950">{{ formatScore(category.puntajePromedio) }}<span v-if="category.puntajePromedio !== null" class="text-base text-slate-500">/100</span></strong>
            <p class="mt-1 text-sm text-slate-600">Promedio general</p>

            <dl class="mt-5 space-y-3 border-t border-slate-100 pt-4 text-sm">
              <div class="flex justify-between gap-4">
                <dt class="font-semibold text-slate-500">Mejor puntaje</dt>
                <dd class="font-black text-slate-900">{{ formatScore(category.mejorPuntaje) }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="font-semibold text-slate-500">Niveles practicados</dt>
                <dd class="font-black text-slate-900">{{ category.nivelesPracticados }}/3</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="font-semibold text-slate-500">Última práctica</dt>
                <dd class="text-right font-black text-slate-900">{{ formatDate(category.ultimaPractica) }}</dd>
              </div>
            </dl>
          </article>
        </div>
      </template>
    </div>
  </section>
</template>

```

{% endraw %}
