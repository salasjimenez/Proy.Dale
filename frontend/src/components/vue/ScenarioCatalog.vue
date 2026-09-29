<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { apiGet } from "../../lib/api";
import ScenarioCard from "./ScenarioCard.vue";
import type { ScenarioCardData } from "../../types/scenario";

type ScenarioResponse = {
  data: ScenarioCardData[];
  meta: {
    total: number;
  };
};

const categories = [
  { value: "", label: "Todas las categorías" },
  { value: "LABORAL", label: "Laboral" },
  { value: "TRAMITES_CALLE", label: "Trámites y calle" },
  { value: "SOCIAL", label: "Social" },
  { value: "JOVENES_ESTUDIANTES", label: "Jóvenes y estudiantes" },
];

const levels = [
  { value: "", label: "Todos los niveles" },
  { value: "BASICO", label: "Básico" },
  { value: "INTERMEDIO", label: "Intermedio" },
  { value: "DIFICIL", label: "Difícil" },
];

const scenarios = ref<ScenarioCardData[]>([]);
const category = ref("");
const level = ref("");
const search = ref("");
const loading = ref(true);
const error = ref("");
const selected = ref<ScenarioCardData | null>(null);
let controller: AbortController | null = null;
let debounceId: ReturnType<typeof setTimeout> | null = null;

const resultLabel = computed(() => {
  if (loading.value) return "Cargando escenarios…";
  if (error.value) return "No se pudieron cargar los escenarios";
  return `${scenarios.value.length} escenario${scenarios.value.length === 1 ? "" : "s"}`;
});

function buildQuery(): string {
  const params = new URLSearchParams();
  if (category.value) params.set("categoria", category.value);
  if (level.value) params.set("nivel", level.value);
  if (search.value.trim()) params.set("q", search.value.trim());
  const query = params.toString();
  return query ? `?${query}` : "";
}

async function loadScenarios(): Promise<void> {
  controller?.abort();
  controller = new AbortController();
  loading.value = true;
  error.value = "";

  try {
    const response = await apiGet<ScenarioResponse>(`/api/escenarios${buildQuery()}`, controller.signal);
    scenarios.value = response.data;
  } catch (requestError) {
    if (requestError instanceof DOMException && requestError.name === "AbortError") return;
    error.value = "No pudimos conectar con Dale. Verifica que el backend esté ejecutándose en localhost:3000.";
    scenarios.value = [];
  } finally {
    loading.value = false;
  }
}

function resetFilters(): void {
  category.value = "";
  level.value = "";
  search.value = "";
}

function openScenario(scenario: ScenarioCardData): void {
  selected.value = scenario;
}

function closeScenario(): void {
  selected.value = null;
}

watch([category, level], () => void loadScenarios());
watch(search, () => {
  if (debounceId) clearTimeout(debounceId);
  debounceId = setTimeout(() => void loadScenarios(), 300);
});

onMounted(() => void loadScenarios());
onBeforeUnmount(() => {
  controller?.abort();
  if (debounceId) clearTimeout(debounceId);
});
</script>

<template>
  <section aria-labelledby="catalog-title">
    <div class="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <p class="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">Catálogo de práctica</p>
        <h2 id="catalog-title" class="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
          Elige una situación real
        </h2>
        <p class="mt-2 max-w-2xl text-base leading-7 text-slate-600">
          Empieza por una situación que te resulte familiar. Puedes cambiar de nivel cuando quieras.
        </p>
      </div>
      <p class="text-sm font-semibold text-slate-500" aria-live="polite">{{ resultLabel }}</p>
    </div>

    <div class="mb-7 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_220px_220px_auto] md:items-end">
      <label class="block">
        <span class="mb-1.5 block text-sm font-bold text-slate-700">Buscar</span>
        <input
          v-model="search"
          type="search"
          maxlength="100"
          placeholder="Ej. entrevista, reclamo, exposición…"
          class="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </label>

      <label class="block">
        <span class="mb-1.5 block text-sm font-bold text-slate-700">Categoría</span>
        <select
          v-model="category"
          class="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option v-for="item in categories" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>

      <label class="block">
        <span class="mb-1.5 block text-sm font-bold text-slate-700">Nivel</span>
        <select
          v-model="level"
          class="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option v-for="item in levels" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>

      <button
        type="button"
        class="min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        @click="resetFilters"
      >
        Limpiar
      </button>
    </div>

    <div v-if="loading" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Cargando escenarios">
      <div v-for="index in 6" :key="index" class="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
        <div class="h-5 w-24 rounded bg-slate-200"></div>
        <div class="mt-5 h-6 w-3/4 rounded bg-slate-200"></div>
        <div class="mt-3 h-4 w-full rounded bg-slate-100"></div>
        <div class="mt-2 h-4 w-5/6 rounded bg-slate-100"></div>
        <div class="mt-7 h-24 rounded-xl bg-slate-100"></div>
      </div>
    </div>

    <div v-else-if="error" class="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900" role="alert">
      <p class="font-black">No se pudo cargar el catálogo.</p>
      <p class="mt-1 text-sm leading-6">{{ error }}</p>
      <button type="button" class="mt-4 rounded-xl bg-rose-900 px-4 py-2 text-sm font-bold text-white" @click="loadScenarios">
        Reintentar
      </button>
    </div>

    <div v-else-if="scenarios.length === 0" class="rounded-2xl border border-slate-200 bg-white p-8 text-center">
      <p class="text-lg font-black text-slate-950">No encontramos escenarios con esos filtros.</p>
      <p class="mt-2 text-sm text-slate-600">Prueba otra categoría, nivel o palabra de búsqueda.</p>
      <button type="button" class="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white" @click="resetFilters">
        Ver todos
      </button>
    </div>

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <ScenarioCard
        v-for="scenario in scenarios"
        :key="scenario.id"
        :scenario="scenario"
        @select="openScenario"
      />
    </div>

    <div
      v-if="selected"
      class="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/55 p-0 sm:items-center sm:p-6"
      role="presentation"
      @click.self="closeScenario"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="scenario-dialog-title"
        class="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:max-w-xl sm:rounded-3xl"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-bold text-blue-700">{{ selected.categoria.nombre }} · {{ selected.nivel.nombre }}</p>
            <h3 id="scenario-dialog-title" class="mt-1 text-2xl font-black text-slate-950">{{ selected.titulo }}</h3>
          </div>
          <button
            type="button"
            class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-xl font-bold text-slate-700 hover:bg-slate-200"
            aria-label="Cerrar detalle"
            @click="closeScenario"
          >
            ×
          </button>
        </div>

        <div class="mt-6 space-y-5">
          <div>
            <p class="text-xs font-black uppercase tracking-wide text-slate-500">Situación</p>
            <p class="mt-1 leading-7 text-slate-700">{{ selected.situacion }}</p>
          </div>
          <div>
            <p class="text-xs font-black uppercase tracking-wide text-slate-500">Tu objetivo</p>
            <p class="mt-1 leading-7 text-slate-700">{{ selected.instrucciones }}</p>
          </div>
        </div>

        <div class="mt-7 rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-blue-950">
          En la siguiente etapa conectaremos este escenario con el simulador de práctica por texto y voz.
        </div>
      </section>
    </div>
  </section>
</template>
