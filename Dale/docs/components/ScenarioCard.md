# ScenarioCard.vue

Tarjeta reutilizable para presentar un escenario de práctica. Recibe un objeto `scenario` y emite `select` cuando el usuario desea revisar cómo practicar ese escenario.

## Código completo

```vue
<script setup lang="ts">
import type { ScenarioCardData } from "../../types/scenario";

defineProps<{ scenario: ScenarioCardData }>();

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
  <article class="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div class="mb-4 flex flex-wrap items-center gap-2">
      <span class="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-inset ring-blue-200">
        {{ scenario.categoria.nombre }}
      </span>
      <span class="rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset" :class="levelClass(scenario.nivel.codigo)">
        {{ scenario.nivel.nombre }}
      </span>
    </div>

    <h3 class="text-lg font-black text-slate-950">{{ scenario.titulo }}</h3>
    <p class="mt-2 text-sm leading-6 text-slate-600">{{ scenario.descripcion }}</p>

    <button type="button" class="mt-5 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white" @click="emit('select', scenario)">
      Ver cómo practicar
    </button>
  </article>
</template>
```

## Ejemplo de uso

```vue
<script setup lang="ts">
import ScenarioCard from "./ScenarioCard.vue";
import type { ScenarioCardData } from "../../types/scenario";

const scenario: ScenarioCardData = {
  id: "demo-1",
  slug: "entrevista-trabajo-basico",
  titulo: "Entrevista de trabajo",
  descripcion: "Practica una presentación breve ante una persona reclutadora.",
  situacion: "Te preguntan quién eres y por qué te interesa el puesto.",
  instrucciones: "Responde en uno o dos minutos con una idea principal clara.",
  categoria: { codigo: "LABORAL", nombre: "Laboral" },
  nivel: { codigo: "BASICO", nombre: "Básico" },
};

function handleSelect(selected: ScenarioCardData) {
  console.log(selected.slug);
}
</script>

<template>
  <ScenarioCard :scenario="scenario" @select="handleSelect" />
</template>
```
