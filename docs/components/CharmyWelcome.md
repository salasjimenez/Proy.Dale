---
layout: default
title: "CharmyWelcome.vue | Dale"
---

# CharmyWelcome.vue

Presentación animada de Charmy en la portada con síntesis de voz opcional al hacer clic.

**Archivo fuente:** `frontend/src/components/vue/CharmyWelcome.vue`  
**Interfaz:** Sin props ni eventos. Controles de inicio y parada de voz.

## Requisitos y dependencias

No utiliza archivos locales adicionales.

En Dale se usa Astro + Vue + Tailwind CSS. Los imports relativos del codigo completo suponen la estructura original `frontend/src`; copia tambien las dependencias indicadas o adapta esas rutas a tu proyecto. Para las islas Astro, `client:load` habilita la interaccion en el navegador.

## Ejemplos de uso

### Portada (Astro)

{% raw %}

```astro
---
import CharmyWelcome from "../components/vue/CharmyWelcome.vue";
---

<CharmyWelcome client:load />
```

{% endraw %}

## Codigo fuente completo — v0.16.5

El siguiente bloque reproduce el archivo Vue actual sin omisiones funcionales. Puedes copiarlo sobre `CharmyWelcome.vue`.

{% raw %}

```vue
<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';

const talking = ref(false);
const message = ref('¡Hola! Soy Charmy. Elige un caso y te acompañaré a practicar, paso a paso.');
let utterance: SpeechSynthesisUtterance | null = null;

function greet(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    message.value = 'Tu navegador no permite reproducir voz, pero puedes comenzar la prueba guiada.';
    return;
  }
  window.speechSynthesis.cancel();
  const phrase = '¡Hola! Soy Charmy, tu guía de Dale. Primero eliges un caso de la vida real. Después conversamos durante una prueba gratuita de hasta cinco minutos. ¿Empezamos?';
  message.value = phrase;
  const speech = new SpeechSynthesisUtterance(phrase);
  const voices = window.speechSynthesis.getVoices();
  speech.voice = voices.find((v) => v.lang.toLowerCase() === 'es-pe') ?? voices.find((v) => v.lang.toLowerCase().startsWith('es')) ?? null;
  speech.lang = speech.voice?.lang ?? 'es-PE';
  speech.rate = 0.95;
  speech.pitch = 1.08;
  speech.onstart = () => { if (utterance === speech) talking.value = true; };
  speech.onend = () => { if (utterance === speech) talking.value = false; };
  speech.onerror = () => { if (utterance === speech) talking.value = false; };
  utterance = speech;
  window.speechSynthesis.speak(speech);
}

function stop(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
  talking.value = false;
}
onBeforeUnmount(stop);
</script>

<template>
  <div class="charmy-home-guide" :class="{ 'is-speaking': talking }">
    <div class="charmy-home-speech" aria-live="polite">
      <span class="charmy-speech-overline">TU GUÍA PERSONAL</span>
      <p>{{ message }}</p>
      <button type="button" class="charmy-listen-button" @click="talking ? stop() : greet()">{{ talking ? '■ Detener voz' : '▶ Escuchar a Charmy' }}</button>
    </div>
    <div class="charmy-avatar-orbit" aria-hidden="true"></div>
    <picture><source media="(prefers-reduced-motion: reduce)" srcset="/charmy/charmy-static.webp" /><img src="/charmy/charmy-talk.webp" alt="Charmy, mascota animada de Dale, con alas blancas, rostro turquesa y cuerpo azul" width="414" height="623" decoding="async" fetchpriority="high" /></picture>
    <span class="charmy-orbit-star charm-star-one" aria-hidden="true">✦</span>
    <span class="charmy-orbit-star charm-star-two" aria-hidden="true">✧</span>
    <span class="charmy-home-status"><span aria-hidden="true">●</span> {{ talking ? 'Charmy está hablando' : 'Lista para conversar contigo' }}</span>
  </div>
</template>
```

{% endraw %}

## Consideraciones

- La reproducción de voz requiere interacción del usuario.
- Usa una imagen alternativa estática con prefers-reduced-motion.

Consulta [todos los componentes](index.html) y el [codigo auxiliar reutilizable](../codigo/index.html).
