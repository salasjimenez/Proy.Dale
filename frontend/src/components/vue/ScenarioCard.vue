<script setup lang="ts">
import { computed } from "vue";
import { scenarioVisual } from "../../lib/scenarioVisuals";
import type { ScenarioCardData } from "../../types/scenario";

const props = defineProps<{
  scenario: ScenarioCardData;
}>();

const emit = defineEmits<{
  select: [scenario: ScenarioCardData];
}>();

const visual = computed(() => scenarioVisual(props.scenario.slug));
</script>

<template>
  <article class="group flex min-w-0 h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg">
    <img
      :src="visual.src"
      :alt="visual.alt"
      width="660"
      height="324"
      loading="lazy"
      decoding="async"
      class="aspect-[2/1] w-full object-cover"
    />
    <div class="flex flex-1 flex-col p-5">
      <span class="text-xs font-extrabold uppercase tracking-wide text-blue-700">{{ scenario.categoria.nombre }}</span>
      <h3 :id="`scenario-${scenario.id}`" class="mt-2 text-lg font-black leading-snug text-slate-950">
        {{ scenario.titulo }}
      </h3>
      <p class="mt-2 flex-1 text-sm leading-6 text-slate-600">{{ scenario.descripcion }}</p>
      <button
        type="button"
        class="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-blue-800 focus-visible:outline-blue-600"
        :aria-describedby="`scenario-${scenario.id}`"
        @click="emit('select', scenario)"
      >
        Elegir entrenamiento <span class="ml-2" aria-hidden="true">→</span>
      </button>
    </div>
  </article>
</template>
