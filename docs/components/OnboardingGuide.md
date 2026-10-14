---
layout: default
title: "OnboardingGuide.vue | Dale"
---

# OnboardingGuide.vue

Guia voluntaria de cuatro pasos, con dialogo accesible y estado local.

**Archivo fuente:** `frontend/src/components/vue/OnboardingGuide.vue`  
**Interfaz:** Sin props ni eventos publicos. Puede abrirse desde /?guia=1.

## Requisitos y dependencias

- [`frontend/src/lib/accessibility.ts`](../codigo/lib-accessibility.html)

En Dale se usa Astro + Vue + Tailwind CSS. Los imports relativos del codigo completo suponen la estructura original `frontend/src`; copia tambien las dependencias indicadas o adapta esas rutas a tu proyecto. Para las islas Astro, `client:load` habilita la interaccion en el navegador.

## Ejemplos de uso

### Montaje en portada (Astro)

{% raw %}

```astro
---
import OnboardingGuide from "../components/vue/OnboardingGuide.vue";
---

<OnboardingGuide client:load />
```

{% endraw %}

## Codigo fuente completo — v0.16.4

El siguiente bloque reproduce el archivo Vue actual sin omisiones funcionales. Puedes copiarlo sobre `OnboardingGuide.vue`.

{% raw %}

```vue
<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { ONBOARDING_KEY, ONBOARDING_STEPS } from "../../lib/accessibility";

const dialogOpen = ref(false);
const stepIndex = ref(0);
const completed = ref(false);
const dialog = ref<HTMLElement | null>(null);
const trigger = ref<HTMLButtonElement | null>(null);
let lastFocused: HTMLElement | null = null;
const stepCount = ONBOARDING_STEPS.length;

function rememberCompletion(): void {
  completed.value = true;
  try {
    window.localStorage.setItem(ONBOARDING_KEY, "true");
  } catch {
    // El recorrido funciona sin almacenamiento local.
  }
}

async function openGuide(): Promise<void> {
  lastFocused = document.activeElement instanceof HTMLElement && document.activeElement !== document.body
    ? document.activeElement
    : trigger.value;
  stepIndex.value = 0;
  dialogOpen.value = true;
  await nextTick();
  dialog.value?.focus();
}

async function closeGuide(markComplete = false): Promise<void> {
  if (markComplete) rememberCompletion();
  dialogOpen.value = false;
  await nextTick();
  if (lastFocused?.isConnected) lastFocused.focus();
  else trigger.value?.focus();
}

async function advance(): Promise<void> {
  if (stepIndex.value >= stepCount - 1) {
    await closeGuide(true);
    return;
  }
  stepIndex.value += 1;
  await nextTick();
  dialog.value?.focus();
}

async function back(): Promise<void> {
  stepIndex.value = Math.max(0, stepIndex.value - 1);
  await nextTick();
  dialog.value?.focus();
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === "Escape") {
    event.preventDefault();
    void closeGuide(false);
    return;
  }
  if (event.key !== "Tab" || !dialog.value) return;
  const focusable = [...dialog.value.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')];
  const first = focusable[0];
  const last = focusable.at(-1);
  if (!first || !last) return;
  if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.value)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog.value)) {
    event.preventDefault();
    first.focus();
  }
}

onMounted(() => {
  try {
    completed.value = window.localStorage.getItem(ONBOARDING_KEY) === "true";
  } catch {
    completed.value = false;
  }
  if (new URLSearchParams(window.location.search).get("guia") === "1") {
    void openGuide();
  }
});

onBeforeUnmount(() => {
  dialogOpen.value = false;
});
</script>

<template>
  <div class="mt-6 max-w-xl rounded-2xl border border-slate-300 bg-white p-4 text-slate-900">
    <p class="text-sm font-semibold">{{ completed ? '¿Quieres repasar cómo funciona Dale?' : '¿Es tu primera vez en Dale?' }}</p>
    <div class="mt-2 flex flex-wrap items-center gap-3">
      <button ref="trigger" type="button" class="min-h-11 rounded-xl bg-blue-700 px-4 py-2 text-sm font-black text-white hover:bg-blue-800" @click="openGuide">
        {{ completed ? 'Volver a ver la guía' : 'Comenzar guía de 4 pasos' }}
      </button>
      <span class="text-xs text-slate-600">Opcional. No necesitas registrarte.</span>
    </div>

    <div v-if="dialogOpen" class="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 p-3 sm:p-6" @click.self="closeGuide(false)">
      <section
        ref="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dale-guide-title"
        aria-describedby="dale-guide-description"
        tabindex="-1"
        class="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 text-slate-950 shadow-2xl outline-none sm:p-7"
        @keydown="handleKeydown"
      >
        <div class="flex items-start justify-between gap-3">
          <p class="text-sm font-bold text-blue-800">Paso {{ stepIndex + 1 }} de {{ stepCount }}</p>
          <button type="button" class="min-h-11 rounded-lg border border-slate-400 px-3 py-2 text-sm font-bold" aria-label="Cerrar guía" @click="closeGuide(false)">Cerrar</button>
        </div>

        <div aria-live="polite" aria-atomic="true" class="mt-4">
          <h2 id="dale-guide-title" class="text-2xl font-black leading-snug">{{ ONBOARDING_STEPS[stepIndex]?.title }}</h2>
          <p id="dale-guide-description" class="mt-3 text-base leading-7 text-slate-700">{{ ONBOARDING_STEPS[stepIndex]?.description }}</p>
        </div>

        <a :href="ONBOARDING_STEPS[stepIndex]?.href" class="mt-4 inline-flex min-h-11 items-center font-bold text-blue-800 underline underline-offset-4">
          {{ ONBOARDING_STEPS[stepIndex]?.linkLabel }}
        </a>

        <div class="mt-6 flex flex-wrap gap-2">
          <button type="button" class="min-h-11 rounded-xl border border-slate-500 px-4 py-2 font-bold disabled:opacity-50" :disabled="stepIndex === 0" @click="back">Anterior</button>
          <button type="button" class="min-h-11 flex-1 rounded-xl bg-slate-950 px-4 py-2 font-black text-white" @click="advance">
            {{ stepIndex === stepCount - 1 ? 'Finalizar guía' : 'Siguiente paso' }}
          </button>
          <button type="button" class="min-h-11 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 underline" @click="closeGuide(true)">Omitir</button>
        </div>
      </section>
    </div>
  </div>
</template>
```

{% endraw %}

## Consideraciones

- No requiere cuenta ni permisos de microfono.
- El dialogo conserva y devuelve el foco; Tab, Shift+Tab y Escape permiten operarlo por teclado.

Consulta [todos los componentes](index.html) y el [codigo auxiliar reutilizable](../codigo/index.html).
