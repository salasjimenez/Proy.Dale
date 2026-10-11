---
layout: default
title: "ScenarioCard.vue | Dale"
---

# ScenarioCard.vue

Tarjeta reutilizable de escenario con categoria, nivel, descripcion y boton de seleccion.

**Archivo fuente:** `frontend/src/components/vue/ScenarioCard.vue`  
**Interfaz:** Prop obligatoria: scenario: ScenarioCardData. Evento: select(scenario: ScenarioCardData).

## Requisitos y dependencias

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

## Codigo fuente completo — v0.15.0

El siguiente bloque reproduce el archivo Vue actual sin omisiones funcionales. Puedes copiarlo sobre `ScenarioCard.vue`.

{% raw %}

```vue
<script setup lang="ts">
import type { ScenarioCardData } from "../../types/scenario";

defineProps<{
  scenario: ScenarioCardData;
}>();

const emit = defineEmits<{
  select: [scenario: ScenarioCardData];
}>();

function levelClass(level: string): string {
  if (level === "BASICO") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (level === "INTERMEDIO") return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-rose-50 text-rose-700 ring-rose-200";
}
</script>

<template>
  <article
    class="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
  >
    <div class="mb-4 flex flex-wrap items-center gap-2">
      <span class="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-inset ring-blue-200">
        {{ scenario.categoria.nombre }}
      </span>
      <span
        class="rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset"
        :class="levelClass(scenario.nivel.codigo)"
      >
        {{ scenario.nivel.nombre }}
      </span>
    </div>

    <h3 class="text-lg font-black leading-snug text-slate-950">
      {{ scenario.titulo }}
    </h3>
    <p class="mt-2 text-sm leading-6 text-slate-600">
      {{ scenario.descripcion }}
    </p>

    <div class="mt-5 rounded-xl bg-slate-50 p-4">
      <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Situación</p>
      <p class="mt-1 text-sm leading-6 text-slate-700">{{ scenario.situacion }}</p>
    </div>

    <button
      type="button"
      class="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 focus-visible:outline-blue-600"
      @click="emit('select', scenario)"
    >
      Ver cómo practicar
    </button>
  </article>
</template>
```

{% endraw %}

## Consideraciones

- Para el uso real conectado con GET /api/escenarios, consulta ScenarioCatalog.vue.

Consulta [todos los componentes](index.html) y el [codigo auxiliar reutilizable](../codigo/index.html).
