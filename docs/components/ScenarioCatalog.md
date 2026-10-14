---
layout: default
title: "ScenarioCatalog.vue | Dale"
---

# ScenarioCatalog.vue

Catalogo agrupado por situacion con busqueda, filtro por categoria y tres formas de entrenamiento.

**Archivo fuente:** `frontend/src/components/vue/ScenarioCatalog.vue`  
**Interfaz:** Sin props publicas. Obtiene datos de GET /api/escenarios.

## Requisitos y dependencias

- [`frontend/src/lib/api.ts`](../codigo/lib-api.html)
- [`frontend/src/lib/scenarioVisuals.ts`](../codigo/lib-scenarioVisuals.html)
- [ScenarioCard.vue](ScenarioCard.html)
- [`frontend/src/types/scenario.ts`](../codigo/types-scenario.html)

En Dale se usa Astro + Vue + Tailwind CSS. Los imports relativos del codigo completo suponen la estructura original `frontend/src`; copia tambien las dependencias indicadas o adapta esas rutas a tu proyecto. Para las islas Astro, `client:load` habilita la interaccion en el navegador.

## Ejemplos de uso

### Inicio: seccion escenarios (Astro)

{% raw %}

```astro
---
import ScenarioCatalog from "../components/vue/ScenarioCatalog.vue";
---

<ScenarioCatalog client:load />
```

{% endraw %}

## Codigo fuente completo — v0.16.4

El siguiente bloque reproduce el archivo Vue actual sin omisiones funcionales. Puedes copiarlo sobre `ScenarioCatalog.vue`.

{% raw %}

```vue
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { apiGet } from "../../lib/api";
import { scenarioBase } from "../../lib/scenarioVisuals";
import ScenarioCard from "./ScenarioCard.vue";
import type { ScenarioCardData } from "../../types/scenario";

type ScenarioResponse = {
  data: ScenarioCardData[];
  meta: { total: number };
};

type TrainingStage = "BASICO" | "INTERMEDIO" | "DIFICIL";

const categories = [
  { value: "", label: "Todos los ámbitos" },
  { value: "LABORAL", label: "Trabajo y entrevistas" },
  { value: "TRAMITES_CALLE", label: "Trámites y vida diaria" },
  { value: "SOCIAL", label: "Conversaciones sociales" },
  { value: "JOVENES_ESTUDIANTES", label: "Estudios y exposiciones" },
];

/** Los códigos del backend permanecen iguales; solo cambia su presentación. */
const trainingStages: ReadonlyArray<{ code: TrainingStage; title: string; description: string }> = [
  { code: "BASICO", title: "Preparación", description: "Explora cómo iniciar esta conversación." },
  { code: "INTERMEDIO", title: "Práctica guiada", description: "Entrena una situación con más intercambio." },
  { code: "DIFICIL", title: "Simulación real", description: "Ensaya una conversación más exigente." },
];

const scenarios = ref<ScenarioCardData[]>([]);
const category = ref("");
const search = ref("");
const loading = ref(true);
const error = ref("");
const selected = ref<ScenarioCardData | null>(null);
const selectedStage = ref<TrainingStage>("BASICO");
const dialogRef = ref<HTMLElement | null>(null);
let previousFocus: HTMLElement | null = null;
let controller: AbortController | null = null;
let debounceId: ReturnType<typeof setTimeout> | null = null;

/** Una tarjeta por situación, en lugar de repetirla por las tres variantes. */
const groupedScenarios = computed(() => {
  const grouped = new Map<string, ScenarioCardData[]>();
  for (const scenario of scenarios.value) {
    const key = scenarioBase(scenario.slug);
    const group = grouped.get(key) ?? [];
    group.push(scenario);
    grouped.set(key, group);
  }
  return [...grouped.values()].map((variants) =>
    variants.find((item) => item.nivel.codigo === "BASICO") ?? variants[0]!,
  );
});

const resultLabel = computed(() => {
  if (loading.value) return "Cargando situaciones…";
  if (error.value) return "No se pudieron cargar las situaciones";
  const count = groupedScenarios.value.length;
  return `${count} situación${count === 1 ? "" : "es"} disponible${count === 1 ? "" : "s"}`;
});

const selectedVariants = computed(() => {
  if (!selected.value) return [];
  const base = scenarioBase(selected.value.slug);
  return scenarios.value.filter((item) => scenarioBase(item.slug) === base);
});

const selectedTraining = computed(() =>
  selectedVariants.value.find((item) => item.nivel.codigo === selectedStage.value) ??
  selectedVariants.value[0] ?? null,
);

function buildQuery(): string {
  const params = new URLSearchParams();
  if (category.value) params.set("categoria", category.value);
  if (search.value.trim()) params.set("q", search.value.trim());
  const query = params.toString();
  return query ? `?${query}` : "";
}

async function loadScenarios(): Promise<void> {
  controller?.abort();
  const currentController = new AbortController();
  controller = currentController;
  loading.value = true;
  error.value = "";
  try {
    const response = await apiGet<ScenarioResponse>(`/api/escenarios${buildQuery()}`, currentController.signal);
    if (controller === currentController) scenarios.value = response.data;
  } catch (caught) {
    if (currentController.signal.aborted) return;
    if (controller === currentController) {
      error.value = "No pudimos cargar los escenarios. Comprueba la conexión y vuelve a intentarlo.";
      scenarios.value = [];
    }
  } finally {
    if (controller === currentController) loading.value = false;
  }
}

function resetFilters(): void {
  category.value = "";
  search.value = "";
}

function openScenario(scenario: ScenarioCardData): void {
  previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  selected.value = scenario;
  selectedStage.value = selectedVariants.value.find((item) => item.nivel.codigo === "BASICO")
    ? "BASICO" : (selectedVariants.value[0]?.nivel.codigo as TrainingStage) ?? "BASICO";
  void nextTick(() => dialogRef.value?.focus());
}

function closeScenario(): void {
  selected.value = null;
  void nextTick(() => {
    if (previousFocus?.isConnected) previousFocus.focus();
    previousFocus = null;
  });
}

function handleDialogKeydown(event: KeyboardEvent): void {
  if (event.key === "Escape") {
    event.preventDefault();
    closeScenario();
    return;
  }
  if (event.key !== "Tab" || !dialogRef.value) return;
  const focusable = [...dialogRef.value.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )];
  const first = focusable[0];
  const last = focusable.at(-1);
  if (!first || !last) return;
  if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.value)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.value)) {
    event.preventDefault();
    first.focus();
  }
}

watch(category, () => void loadScenarios());
watch(search, () => {
  if (debounceId) clearTimeout(debounceId);
  debounceId = setTimeout(() => void loadScenarios(), 300);
});

onMounted(() => {
  const requested = new URLSearchParams(window.location.search).get("categoria") ?? "";
  if (requested && categories.some((item) => item.value === requested)) {
    category.value = requested; // El watcher realiza la primera consulta con el filtro.
  } else {
    void loadScenarios();
  }
});

onBeforeUnmount(() => {
  controller?.abort();
  if (debounceId) clearTimeout(debounceId);
});
</script>

<template>
  <section aria-labelledby="catalog-title">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div class="max-w-2xl">
        <p class="text-sm font-black uppercase tracking-[0.16em] text-blue-700">Catálogo completo</p>
        <h2 id="catalog-title" class="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
          Elige tu escenario de entrenamiento
        </h2>
        <p class="mt-3 text-base leading-7 text-slate-600">
          Busca una conversación real. Dentro de cada situación podrás elegir cómo entrenarla.
        </p>
      </div>
      <p class="text-sm font-bold text-slate-600" aria-live="polite" aria-atomic="true">{{ resultLabel }}</p>
    </div>

    <div class="dale-catalog-filters mt-7 grid gap-4 rounded-3xl border border-slate-200 bg-[#f4f8fd] p-4 shadow-sm sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,240px)_auto] lg:items-end">
      <label class="block min-w-0">
        <span class="mb-2 block text-sm font-black text-slate-800">¿Qué te gustaría practicar?</span>
        <input
          v-model="search"
          type="search"
          maxlength="100"
          placeholder="Ej.: entrevista, reclamo, exposición"
          class="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </label>
      <label class="block min-w-0">
        <span class="mb-2 block text-sm font-black text-slate-800">Ámbito</span>
        <select
          v-model="category"
          class="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option v-for="option in categories" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
      </label>
      <button type="button" class="min-h-12 rounded-xl border border-slate-400 bg-white px-5 py-3 font-bold text-slate-800 transition hover:bg-slate-100" @click="resetFilters">
        Limpiar filtros
      </button>
    </div>

    <div v-if="loading" class="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label="Cargando escenarios">
      <div v-for="index in 6" :key="index" class="h-80 animate-pulse rounded-3xl border border-slate-200 bg-slate-100"></div>
    </div>
    <div v-else-if="error" class="mt-7 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900" role="alert">
      <p class="font-black">No pudimos cargar el catálogo.</p>
      <p class="mt-2 text-sm">{{ error }}</p>
      <button type="button" class="mt-4 min-h-11 rounded-xl bg-red-900 px-5 py-2 font-bold text-white" @click="loadScenarios">Reintentar</button>
    </div>
    <div v-else-if="groupedScenarios.length === 0" class="mt-7 rounded-2xl border border-slate-200 bg-white p-8 text-center">
      <p class="font-black text-slate-950">No encontramos situaciones con esos filtros.</p>
      <p class="mt-2 text-sm text-slate-600">Prueba con otra palabra o categoría.</p>
      <button type="button" class="mt-4 min-h-11 rounded-xl bg-slate-950 px-5 py-2 font-bold text-white" @click="resetFilters">Ver todas</button>
    </div>
    <div v-else class="dale-catalog-grid dale-fluid-grid mt-7 grid gap-5">
      <ScenarioCard
        v-for="scenario in groupedScenarios"
        :key="scenario.id"
        :scenario="scenario"
        @select="openScenario"
      />
    </div>

    <div v-if="selected" class="dale-scenario-overlay fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/75 p-0 sm:items-center sm:p-5" @click.self="closeScenario">
      <section
        ref="dialogRef"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scenario-dialog-title"
        aria-describedby="scenario-dialog-description"
        class="dale-scenario-dialog max-h-[95dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 text-slate-950 shadow-2xl outline-none sm:max-w-2xl sm:rounded-3xl sm:p-7"
        @keydown="handleDialogKeydown"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-black uppercase tracking-wider text-blue-700">{{ selected.categoria.nombre }}</p>
            <h3 id="scenario-dialog-title" class="mt-2 text-2xl font-black leading-snug text-slate-950">{{ selected.titulo }}</h3>
          </div>
          <button type="button" class="min-h-11 shrink-0 rounded-xl border border-slate-300 px-4 py-2 font-black text-slate-800 hover:bg-slate-100" aria-label="Cerrar detalles del escenario" @click="closeScenario">Cerrar</button>
        </div>

        <p id="scenario-dialog-description" class="mt-3 text-sm leading-6 text-slate-700">
          Una misma situación, tres formas de entrenarla. Selecciona la experiencia que prefieras.
        </p>
        <fieldset class="mt-6">
          <legend class="text-sm font-black text-slate-950">¿Cómo quieres entrenar?</legend>
          <div class="dale-dialog-stages grid gap-3">
            <button
              v-for="stage in trainingStages"
              :key="stage.code"
              type="button"
              :disabled="!selectedVariants.some((item) => item.nivel.codigo === stage.code)"
              :aria-pressed="selectedStage === stage.code"
              class="min-h-24 rounded-2xl border-2 px-4 py-3 text-left transition focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
              :class="selectedStage === stage.code ? 'border-blue-700 bg-blue-50 text-blue-950' : 'border-slate-300 bg-white text-slate-800 hover:border-blue-400'"
              @click="selectedStage = stage.code"
            >
              <span class="block text-sm font-black">{{ stage.title }}</span>
              <span class="mt-1 block text-xs leading-5">{{ stage.description }}</span>
            </button>
          </div>
        </fieldset>
        <div v-if="selectedTraining" class="mt-6 rounded-2xl bg-slate-50 p-5">
          <p class="text-xs font-black uppercase tracking-wide text-blue-700">Situación que practicarás</p>
          <p class="mt-2 text-sm leading-6 text-slate-800">{{ selectedTraining.situacion }}</p>
          <p class="mt-4 text-xs font-black uppercase tracking-wide text-blue-700">Tu objetivo</p>
          <p class="mt-2 text-sm leading-6 text-slate-800">{{ selectedTraining.instrucciones }}</p>
        </div>
        <p class="mt-4 text-xs leading-5 text-slate-600">Voz es la opción recomendada; texto continúa disponible. Para guardar tu progreso necesitas iniciar sesión.</p>
        <a
          v-if="selectedTraining"
          :href="`/simulacion?escenario=${encodeURIComponent(selectedTraining.slug)}&modalidad=VOZ`"
          class="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-700 px-5 py-3 text-center font-black text-white hover:bg-blue-800"
        >
          Empezar este entrenamiento <span class="ml-2" aria-hidden="true">→</span>
        </a>
      </section>
    </div>
  </section>
</template>
```

{% endraw %}

## Consideraciones

- Depende de ScenarioCard.vue. El backend maneja filtros de categoria, nivel y texto.

Consulta [todos los componentes](index.html) y el [codigo auxiliar reutilizable](../codigo/index.html).
