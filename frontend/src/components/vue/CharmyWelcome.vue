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
