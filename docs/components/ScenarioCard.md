---
layout: default
title: "ScenarioCard.vue | Dale"
---

# ScenarioCard.vue

Tarjeta ilustrada de situacion real con categoria y boton para elegir entrenamiento.

**Archivo fuente:** `frontend/src/components/vue/ScenarioCard.vue`  
**Interfaz:** Prop obligatoria: scenario: ScenarioCardData. Evento: select(scenario: ScenarioCardData).

## Requisitos y dependencias

- [`frontend/src/lib/scenarioVisuals.ts`](../codigo/lib-scenarioVisuals.html)
- [`frontend/src/types/scenario.ts`](../codigo/types-scenario.html)

En Dale se usa Astro + Vue + Tailwind CSS. Los imports relativos del codigo completo suponen la estructura original `frontend/src`; copia tambien las dependencias indicadas o adapta esas rutas a tu proyecto. Para las islas Astro, `client:load` habilita la interaccion en el navegador.

## Ejemplos de uso

### Uso dentro de un componente Vue

{% raw %}

```vue
<script setup lang="ts">
import ScenarioCard from "./ScenarioCard.vue";
import type { ScenarioCardData } from "../../types/scenario";

const ejemplo: ScenarioCardData = {
  id: "demo-1",
  slug: "entrevista-trabajo-basico",
  titulo: "Entrevista de trabajo",
  descripcion: "Practica tu presentacion inicial.",
  situacion: "La persona entrevistadora te pide que te presentes.",
  instrucciones: "Responde con claridad durante un minuto.",
  categoria: { codigo: "LABORAL", nombre: "Laboral" },
  nivel: { codigo: "BASICO", nombre: "Basico" },
};

function seleccionar(scenario: ScenarioCardData) {
  console.log("Escenario seleccionado:", scenario.slug);
}
</script>

<template>
  <ScenarioCard :scenario="ejemplo" @select="seleccionar" />
</template>
```

{% endraw %}

## Codigo fuente completo — v0.16.1

El siguiente bloque reproduce el archivo Vue actual sin omisiones funcionales. Puedes copiarlo sobre `ScenarioCard.vue`.

{% raw %}

```vue
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
```

{% endraw %}

## Consideraciones

- Para el uso real conectado con GET /api/escenarios, consulta ScenarioCatalog.vue.

Consulta [todos los componentes](index.html) y el [codigo auxiliar reutilizable](../codigo/index.html).
