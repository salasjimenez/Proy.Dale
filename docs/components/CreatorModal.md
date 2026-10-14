---
layout: default
title: "CreatorModal.vue | Dale"
---

# CreatorModal.vue

Modal accesible del creador con avatar ilustrado, nombre Jhonn Pether y enlace a Instagram @pitx29.

**Archivo fuente:** `frontend/src/components/vue/CreatorModal.vue`  
**Interfaz:** Sin props ni eventos. Se abre con el boton Creador del pie de pagina.

## Requisitos y dependencias

No utiliza archivos locales adicionales.

En Dale se usa Astro + Vue + Tailwind CSS. Los imports relativos del codigo completo suponen la estructura original `frontend/src`; copia tambien las dependencias indicadas o adapta esas rutas a tu proyecto. Para las islas Astro, `client:load` habilita la interaccion en el navegador.

## Ejemplos de uso

### Pie de pagina (Astro)

{% raw %}

```astro
---
import CreatorModal from "../components/vue/CreatorModal.vue";
---

<CreatorModal client:load />
```

{% endraw %}

## Codigo fuente completo — v0.16.4

El siguiente bloque reproduce el archivo Vue actual sin omisiones funcionales. Puedes copiarlo sobre `CreatorModal.vue`.

{% raw %}

```vue
<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from "vue";

const open = ref(false);
const trigger = ref<HTMLButtonElement | null>(null);
const dialog = ref<HTMLElement | null>(null);
let previousFocus: HTMLElement | null = null;

async function show(): Promise<void> {
  previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : trigger.value;
  open.value = true;
  await nextTick();
  dialog.value?.focus();
}
async function close(): Promise<void> {
  open.value = false;
  await nextTick();
  if (previousFocus?.isConnected) previousFocus.focus();
  else trigger.value?.focus();
}
function onKeydown(event: KeyboardEvent): void {
  if (event.key === "Escape") { event.preventDefault(); void close(); return; }
  if (event.key !== "Tab" || !dialog.value) return;
  const buttons = [...dialog.value.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')];
  if (!buttons.length) return;
  const first = buttons[0]!;
  const last = buttons.at(-1)!;
  if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.value)) {
    event.preventDefault(); last.focus();
  } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog.value)) {
    event.preventDefault(); first.focus();
  }
}
onBeforeUnmount(() => { open.value = false; });
</script>

<template>
  <div class="inline-flex items-center">
    <button ref="trigger" type="button" class="min-h-11 rounded-lg px-2 py-2 font-semibold text-slate-700 underline underline-offset-4 hover:text-blue-800" @click="show">Creador</button>
    <div v-if="open" class="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/80 p-4" @click.self="close">
      <section ref="dialog" role="dialog" aria-modal="true" aria-labelledby="dale-creator-heading" aria-describedby="dale-creator-description" tabindex="-1" class="w-full max-w-sm rounded-3xl border border-slate-300 bg-white p-6 text-center text-slate-950 shadow-2xl outline-none sm:p-8" @keydown="onKeydown">
        <div class="flex justify-end"><button type="button" class="min-h-11 rounded-lg border border-slate-400 px-4 py-2 text-sm font-bold" @click="close">Cerrar</button></div>
        <img src="/creator-avatar.svg" alt="Avatar ilustrado de Jhonn Pether" width="144" height="144" class="mx-auto mt-2 h-36 w-36 rounded-full border-4 border-blue-100 object-cover shadow-md" />
        <p class="mt-5 text-xs font-bold uppercase tracking-widest text-blue-800">Creador de Dale</p>
        <h2 id="dale-creator-heading" class="mt-2 text-3xl font-black tracking-tight text-slate-950">Jhonn Pether</h2>
        <p id="dale-creator-description" class="mt-3 text-sm leading-6 text-slate-700">Conoce al creador y sigue el proyecto en Instagram.</p>
        <a href="https://www.instagram.com/pitx29/" target="_blank" rel="noopener noreferrer" class="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-700 px-5 py-3 font-black text-white hover:bg-blue-800">Instagram · @pitx29 <span class="sr-only">(se abre en otra pestaña)</span></a>
      </section>
    </div>
  </div>
</template>
```

{% endraw %}

## Consideraciones

- El avatar es una ilustracion local, no una fotografia verificada.
- El enlace a Instagram abre una pestaña nueva.

Consulta [todos los componentes](index.html) y el [codigo auxiliar reutilizable](../codigo/index.html).
