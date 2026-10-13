<script setup lang="ts">
import { nextTick, onMounted, ref } from "vue";
import {
  A11Y_CONTRAST_KEY,
  A11Y_TEXT_KEY,
  normalizeContrastMode,
  normalizeTextSize,
  type ContrastMode,
  type TextSize,
} from "../../lib/accessibility";

const expanded = ref(false);
const sizeOptions: Array<{ value: TextSize; label: string }> = [
  { value: "normal", label: "Normal" },
  { value: "large", label: "Grande" },
  { value: "extra", label: "Extra" },
];
const textSize = ref<TextSize>("normal");
const contrast = ref<ContrastMode>("standard");
const trigger = ref<HTMLButtonElement | null>(null);
const panel = ref<HTMLElement | null>(null);

function store(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Navegacion privada o almacenamiento deshabilitado: el ajuste sigue activo.
  }
}

function apply(): void {
  document.documentElement.dataset.daleTextSize = textSize.value;
  document.documentElement.dataset.daleContrast = contrast.value;
}

function changeSize(value: TextSize): void {
  textSize.value = normalizeTextSize(value);
  apply();
  store(A11Y_TEXT_KEY, textSize.value);
}

function changeContrast(value: ContrastMode): void {
  contrast.value = normalizeContrastMode(value);
  apply();
  store(A11Y_CONTRAST_KEY, contrast.value);
}

async function toggle(): Promise<void> {
  expanded.value = !expanded.value;
  if (expanded.value) {
    await nextTick();
    panel.value?.querySelector<HTMLButtonElement>("button")?.focus();
  } else {
    trigger.value?.focus();
  }
}

function close(): void {
  expanded.value = false;
  trigger.value?.focus();
}

onMounted(() => {
  // Los atributos son aplicados en <head> para evitar parpadeo visual.
  textSize.value = normalizeTextSize(document.documentElement.dataset.daleTextSize);
  contrast.value = normalizeContrastMode(document.documentElement.dataset.daleContrast);
});
</script>

<template>
  <div class="dale-access-widget fixed bottom-3 right-3 z-40 max-w-[calc(100vw-1.5rem)] sm:bottom-5 sm:right-5" @keydown.esc.stop="close">
    <section
      v-if="expanded"
      id="dale-accessibility-panel"
      ref="panel"
      aria-labelledby="dale-accessibility-title"
      class="mb-3 w-[min(21rem,calc(100vw-1.5rem))] rounded-2xl border-2 border-slate-700 bg-white p-4 text-slate-950 shadow-2xl"
    >
      <h2 id="dale-accessibility-title" class="text-lg font-black">Accesibilidad</h2>
      <p class="mt-1 text-sm text-slate-700">Ajusta la lectura de este dispositivo.</p>

      <fieldset class="mt-4">
        <legend class="text-sm font-bold">Tamaño del texto</legend>
        <div class="mt-2 grid grid-cols-3 gap-2">
          <button
            v-for="option in sizeOptions"
            :key="option.value"
            type="button"
            :aria-pressed="textSize === option.value"
            class="min-h-11 rounded-lg border border-slate-400 px-2 py-2 text-sm font-bold aria-pressed:bg-slate-950 aria-pressed:text-white"
            @click="changeSize(option.value)"
          >{{ option.label }}</button>
        </div>
      </fieldset>

      <fieldset class="mt-4">
        <legend class="text-sm font-bold">Contraste</legend>
        <div class="mt-2 grid grid-cols-2 gap-2">
          <button type="button" :aria-pressed="contrast === 'standard'" class="min-h-11 rounded-lg border border-slate-400 px-2 py-2 text-sm font-bold aria-pressed:bg-slate-950 aria-pressed:text-white" @click="changeContrast('standard')">Normal</button>
          <button type="button" :aria-pressed="contrast === 'high'" class="min-h-11 rounded-lg border border-slate-400 px-2 py-2 text-sm font-bold aria-pressed:bg-slate-950 aria-pressed:text-white" @click="changeContrast('high')">Alto</button>
        </div>
      </fieldset>

      <p class="mt-3 text-xs leading-5 text-slate-700">Estos ajustes se guardan solo en tu navegador. También puedes usar el zoom del navegador.</p>
      <button type="button" class="mt-3 min-h-11 w-full rounded-lg border border-slate-500 px-4 py-2 font-bold" @click="close">Cerrar ajustes</button>
    </section>

    <button
      ref="trigger"
      type="button"
      :aria-expanded="expanded"
      aria-controls="dale-accessibility-panel"
      class="min-h-12 rounded-full border-2 border-white bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-xl focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
      @click="toggle"
    >
      {{ expanded ? 'Ocultar accesibilidad' : 'Accesibilidad' }}
    </button>
  </div>
</template>
