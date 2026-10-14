<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  TRAINING_GOALS,
  TRAINING_STAGES,
  trainingHref,
  toTrainingSlug,
  type TrainingGoalId,
  type TrainingMode,
  type TrainingStage,
} from "../../lib/training";

const goalId = ref<TrainingGoalId>("entrevista");
const stage = ref<TrainingStage>("BASICO");
const mode = ref<TrainingMode>("TEXTO");
const shortSession = ref(false);
const modeOptions: ReadonlyArray<{ value: TrainingMode; label: string }> = [
  { value: "TEXTO", label: "Por texto" },
  { value: "VOZ", label: "Por voz" },
];

const chosenGoal = computed(() => TRAINING_GOALS.find((goal) => goal.id === goalId.value) ?? TRAINING_GOALS[0]);
const selectedSlug = computed(() => toTrainingSlug(chosenGoal.value.baseSlug, stage.value));
const selectedHref = computed(() => trainingHref(chosenGoal.value.baseSlug, stage.value, mode.value, shortSession.value));

onMounted(() => {
  const query = new URLSearchParams(window.location.search);
  const requestedGoal = query.get("objetivo");
  if (TRAINING_GOALS.some((goal) => goal.id === requestedGoal)) {
    goalId.value = requestedGoal as TrainingGoalId;
  }
  shortSession.value = query.get("rapido") === "1";
});
</script>

<template>
  <div class="grid min-w-0 gap-6 lg:grid-cols-[1.15fr_0.85fr]">
    <div class="min-w-0 space-y-7">
      <fieldset>
        <legend class="text-lg font-black text-slate-950">1. ¿Qué quieres mejorar hoy?</legend>
        <p class="mt-2 text-sm leading-6 text-slate-600">Elige un objetivo. La recomendación utiliza situaciones que ya existen en Dale.</p>
        <div class="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            v-for="goal in TRAINING_GOALS"
            :key="goal.id"
            type="button"
            :aria-pressed="goalId === goal.id"
            class="min-h-24 rounded-2xl border-2 p-4 text-left transition focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            :class="goalId === goal.id ? 'border-blue-700 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-400'"
            @click="goalId = goal.id"
          >
            <span class="block text-sm font-black text-slate-950">{{ goal.title }}</span>
            <span class="mt-1 block text-xs leading-5 text-slate-700">{{ goal.description }}</span>
          </button>
        </div>
      </fieldset>

      <fieldset>
        <legend class="text-lg font-black text-slate-950">2. Elige tu forma de entrenamiento</legend>
        <div class="mt-3 grid gap-2 sm:grid-cols-3">
          <button
            v-for="option in TRAINING_STAGES"
            :key="option.code"
            type="button"
            :aria-pressed="stage === option.code"
            class="min-h-20 rounded-xl border-2 px-4 py-3 text-left transition focus-visible:outline focus-visible:outline-4 focus-visible:outline-blue-700"
            :class="stage === option.code ? 'border-blue-700 bg-blue-50 text-blue-950' : 'border-slate-300 bg-white text-slate-800'"
            @click="stage = option.code"
          >
            <span class="block text-sm font-black">{{ option.title }}</span>
            <span class="mt-1 block text-xs leading-5">{{ option.description }}</span>
          </button>
        </div>
      </fieldset>

      <fieldset>
        <legend class="text-lg font-black text-slate-950">3. ¿Cómo responderás?</legend>
        <div class="mt-3 grid grid-cols-2 gap-3">
          <button
            v-for="option in modeOptions"
            :key="option.value"
            type="button"
            :aria-pressed="mode === option.value"
            class="min-h-12 rounded-xl border-2 px-4 py-3 text-sm font-bold focus-visible:outline focus-visible:outline-4 focus-visible:outline-blue-700"
            :class="mode === option.value ? 'border-blue-700 bg-blue-50 text-blue-950' : 'border-slate-300 bg-white text-slate-800'"
            @click="mode = option.value"
          >{{ option.label }}</button>
        </div>
        <p class="mt-2 text-xs leading-5 text-slate-600">La voz necesita un navegador compatible y acceso al micrófono. Puedes cambiar de modalidad antes de empezar.</p>
      </fieldset>

      <label class="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-300 bg-white p-4">
        <input v-model="shortSession" type="checkbox" class="mt-1 h-5 w-5 shrink-0 accent-blue-700" />
        <span>
          <strong class="block text-sm text-slate-950">Entrenamiento breve: 5 minutos</strong>
          <span class="mt-1 block text-xs leading-5 text-slate-600">Activa un temporizador orientativo. Nunca se termina ni guarda la sesión automáticamente.</span>
        </span>
      </label>
    </div>

    <aside class="min-w-0 self-start overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-md" aria-live="polite" aria-atomic="true">
      <img :src="chosenGoal.image" alt="" loading="lazy" decoding="async" width="660" height="324" class="aspect-[2/1] w-full object-cover" />
      <div class="p-5 sm:p-7">
        <p class="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Tu próxima práctica</p>
        <h3 class="mt-2 text-2xl font-black leading-tight text-slate-950">{{ chosenGoal.title }}</h3>
        <p class="mt-3 text-sm leading-6 text-slate-700">{{ chosenGoal.description }}</p>
        <dl class="mt-5 space-y-3 border-t border-slate-200 pt-5 text-sm">
          <div class="flex flex-wrap justify-between gap-2"><dt class="font-semibold text-slate-600">Etapa</dt><dd class="font-black text-slate-950">{{ TRAINING_STAGES.find(item => item.code === stage)?.title }}</dd></div>
          <div class="flex flex-wrap justify-between gap-2"><dt class="font-semibold text-slate-600">Modalidad</dt><dd class="font-black text-slate-950">{{ mode === 'VOZ' ? 'Voz' : 'Texto' }}</dd></div>
          <div class="flex flex-wrap justify-between gap-2"><dt class="font-semibold text-slate-600">Duración</dt><dd class="font-black text-slate-950">{{ shortSession ? '5 min orientativos' : 'A tu ritmo' }}</dd></div>
        </dl>
        <a :href="selectedHref" class="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-700 px-5 py-3 text-center text-sm font-black text-white hover:bg-blue-800 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-blue-700">
          Comenzar este entrenamiento <span aria-hidden="true" class="ml-2">→</span>
        </a>
        <p class="mt-3 text-xs leading-5 text-slate-600">Para guardar el progreso necesitarás iniciar sesión. El escenario elegido es <code class="break-all">{{ selectedSlug }}</code>.</p>
      </div>
    </aside>
  </div>
</template>
