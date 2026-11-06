<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import {
  accountUrl,
  CHARMY_CASES,
  CHARMY_TRIAL_SECONDS,
  findCharmyCase,
  formatTrialClock,
  guestObservation,
  type CharmyCaseId,
} from '../../lib/charmyTrial';

type TrialStep = 'select' | 'intro' | 'chat' | 'done';
type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type RecognitionEvent = { results: ArrayLike<RecognitionResult> };
type RecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type RecognitionConstructor = new () => RecognitionLike;

const step = ref<TrialStep>('select');
const selectedCaseId = ref<CharmyCaseId | null>(null);
const selectedCase = computed(() => findCharmyCase(selectedCaseId.value));
const promptIndex = ref(0);
const spoken = ref(false);
const voiceEnabled = ref(true);
const voiceSupported = ref(false);
const listening = ref(false);
const answer = ref('');
const answeredCount = ref(0);
const lastObservation = ref('');
const error = ref('');
const elapsed = ref(0);
const timedOut = ref(false);
const summary = ref('');
const remaining = computed(() => formatTrialClock(elapsed.value));
const currentPrompt = computed(() => selectedCase.value?.prompts[promptIndex.value] ?? '');
const progress = computed(() => selectedCase.value ? Math.round((answeredCount.value / selectedCase.value.prompts.length) * 100) : 0);
const loginHref = computed(() => selectedCaseId.value ? accountUrl('login', selectedCaseId.value) : '/login');
const registerHref = computed(() => selectedCaseId.value ? accountUrl('registro', selectedCaseId.value) : '/registro');

let timer: number | undefined;
let beganAt = 0;
let recognition: RecognitionLike | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;

function stopSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  activeUtterance = null;
  spoken.value = false;
}

function speak(message: string): void {
  stopSpeech();
  if (!voiceEnabled.value || typeof window === 'undefined' || !window.speechSynthesis) return;
  if (listening.value) stopListening();
  const utterance = new SpeechSynthesisUtterance(message);
  const voices = window.speechSynthesis.getVoices();
  utterance.voice = voices.find((v) => v.lang.toLowerCase() === 'es-pe')
    ?? voices.find((v) => v.lang.toLowerCase().startsWith('es')) ?? null;
  utterance.lang = utterance.voice?.lang ?? 'es-PE';
  utterance.rate = 0.94;
  utterance.pitch = 1.08;
  utterance.onstart = () => { if (activeUtterance === utterance) spoken.value = true; };
  utterance.onend = () => { if (activeUtterance === utterance) spoken.value = false; };
  utterance.onerror = () => { if (activeUtterance === utterance) spoken.value = false; };
  activeUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

function toggleVoice(): void {
  voiceEnabled.value = !voiceEnabled.value;
  if (!voiceEnabled.value) stopSpeech();
  else if (step.value === 'intro') speak(`Hola, soy Charmy. ${selectedCase.value?.intro ?? ''} Te acompañaré durante una prueba guiada de hasta cinco minutos.`);
  else if (step.value === 'chat') speak(currentPrompt.value);
}

function recognitionClass(): RecognitionConstructor | null {
  const win = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
  return win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null;
}

function stopListening(): void {
  if (recognition) {
    const instance = recognition;
    recognition = null;
    instance.onend = null;
    instance.onerror = null;
    instance.onresult = null;
    try { instance.stop(); } catch { /* Puede haberse detenido. */ }
  }
  listening.value = false;
}

function startListening(): void {
  if (step.value !== 'chat' || listening.value) return;
  const Constructor = recognitionClass();
  if (!Constructor) {
    error.value = 'Este navegador no dispone de reconocimiento de voz. Puedes responder por escrito en esta prueba.';
    return;
  }
  stopSpeech();
  error.value = '';
  try {
    const instance = new Constructor();
    recognition = instance;
    instance.lang = navigator.language?.startsWith('es') ? navigator.language : 'es-PE';
    instance.continuous = false;
    instance.interimResults = true;
    const originalText = answer.value.trim();
    instance.onresult = (event) => {
      const parts: string[] = [];
      for (let i = 0; i < event.results.length; i += 1) {
        const part = event.results[i]?.[0]?.transcript?.trim();
        if (part) parts.push(part);
      }
      answer.value = [originalText, parts.join(' ')].filter(Boolean).join(' ').trim();
    };
    instance.onerror = (event) => {
      error.value = event.error === 'not-allowed' || event.error === 'service-not-allowed'
        ? 'El navegador no permitió usar el micrófono. Revisa los permisos o escribe tu respuesta.'
        : 'El reconocimiento se interrumpió. Puedes reintentarlo o escribir tu respuesta.';
      listening.value = false;
    };
    instance.onend = () => { listening.value = false; recognition = null; };
    instance.start();
    listening.value = true;
  } catch {
    recognition = null;
    listening.value = false;
    error.value = 'No se pudo iniciar el reconocimiento de voz. Usa la respuesta escrita si lo necesitas.';
  }
}

function endTrial(byTime: boolean): void {
  if (timer !== undefined) window.clearInterval(timer);
  timer = undefined;
  stopSpeech();
  stopListening();
  timedOut.value = byTime;
  summary.value = byTime
    ? `Se completaron los cinco minutos de prueba. Respondiste ${answeredCount.value} de ${selectedCase.value?.prompts.length ?? 0} preguntas.`
    : `Terminaste ${answeredCount.value} preguntas en esta introducción guiada.`;
  step.value = 'done';
}

function startTrial(): void {
  if (!selectedCase.value) return;
  answeredCount.value = 0;
  promptIndex.value = 0;
  answer.value = '';
  lastObservation.value = '';
  error.value = '';
  elapsed.value = 0;
  timedOut.value = false;
  step.value = 'chat';
  beganAt = Date.now();
  timer = window.setInterval(() => {
    elapsed.value = Math.max(0, Math.floor((Date.now() - beganAt) / 1000));
    if (elapsed.value >= CHARMY_TRIAL_SECONDS) endTrial(true);
  }, 500);
  speak(currentPrompt.value);
}

function sendAnswer(): void {
  if (step.value !== 'chat') return;
  stopListening();
  const text = answer.value.trim();
  if (text.length < 3) {
    error.value = 'Responde con algunas palabras antes de continuar.';
    return;
  }
  error.value = '';
  lastObservation.value = guestObservation(text);
  answeredCount.value += 1;
  answer.value = '';
  if (selectedCase.value && answeredCount.value >= selectedCase.value.prompts.length) {
    endTrial(false);
    return;
  }
  promptIndex.value += 1;
  speak(`${lastObservation.value} Siguiente pregunta. ${currentPrompt.value}`);
}

function reset(): void {
  if (timer !== undefined) window.clearInterval(timer);
  timer = undefined;
  stopSpeech();
  stopListening();
  step.value = 'select';
  selectedCaseId.value = null;
  answeredCount.value = 0;
  error.value = '';
  elapsed.value = 0;
}

onMounted(() => {
  const id = new URLSearchParams(window.location.search).get('caso');
  selectedCaseId.value = findCharmyCase(id)?.id ?? null;
  voiceSupported.value = Boolean(recognitionClass());
});
onBeforeUnmount(() => {
  if (timer !== undefined) window.clearInterval(timer);
  stopSpeech();
  stopListening();
});
</script>

<template>
  <section class="charmy-trial" aria-labelledby="trial-heading">
    <div class="charmy-trial-heading">
      <a href="/" class="charmy-back">← Volver al inicio</a>
      <span class="charmy-eyebrow">CONOCE A TU GUÍA</span>
      <h1 id="trial-heading">Practica con <span>Charmy</span></h1>
      <p>Elige una situación real y conversa con Charmy en una introducción guiada de <strong>hasta cinco minutos</strong>, sin crear una cuenta.</p>
    </div>

    <div class="charmy-trial-grid">
      <div class="charmy-trial-panel" aria-live="polite">
        <template v-if="step === 'select'">
          <span class="charmy-stage-label">PASO 1 DE 3 · ELIGE UN CASO</span>
          <h2>¿Qué quieres practicar hoy?</h2>
          <p class="charmy-subcopy">Tú eliges el contexto. No necesitas registrarte para probar la introducción.</p>
          <fieldset class="charmy-case-options">
            <legend class="sr-only">Selecciona un caso para la prueba con Charmy</legend>
            <button v-for="item in CHARMY_CASES" :key="item.id" type="button" :aria-pressed="selectedCaseId === item.id" class="charmy-option" :class="{ 'is-selected': selectedCaseId === item.id }" @click="selectedCaseId = item.id">
              <img :src="item.image" alt="" width="88" height="72" loading="lazy" />
              <span><strong>{{ item.label }}</strong><small>{{ item.area }}</small></span>
              <span class="charmy-option-check" aria-hidden="true">{{ selectedCaseId === item.id ? '✓' : '→' }}</span>
            </button>
          </fieldset>
          <button class="charmy-action" type="button" :disabled="!selectedCase" @click="step = 'intro'">Continuar con el caso elegido <span aria-hidden="true">→</span></button>
        </template>

        <template v-else-if="step === 'intro'">
          <span class="charmy-stage-label">PASO 2 DE 3 · CONOCE LA DINÁMICA</span>
          <h2>¡Hola! Soy Charmy.</h2>
          <p class="charmy-subcopy">{{ selectedCase?.intro }} Te haré cinco preguntas. Puedes responder hablando o escribiendo, y terminar cuando quieras.</p>
          <div class="charmy-speech-card">
            <strong>Tu primera práctica será:</strong>
            <p>{{ selectedCase?.label }}</p>
            <span>Sin cuenta · Sin guardar respuestas · Máximo 5 min</span>
          </div>
          <div class="charmy-trial-actions">
            <button type="button" class="charmy-secondary" @click="toggleVoice">{{ voiceEnabled ? 'Silenciar voz' : 'Activar voz' }}</button>
            <button type="button" class="charmy-secondary" @click="speak(`Hola, soy Charmy. ${selectedCase?.intro ?? ''} Vamos a conversar durante una prueba guiada de hasta cinco minutos.`)">Escuchar presentación</button>
          </div>
          <button type="button" class="charmy-action" @click="startTrial">Iniciar conversación <span aria-hidden="true">▶</span></button>
          <button type="button" class="charmy-text-button" @click="step = 'select'">Elegir otro caso</button>
        </template>

        <template v-else-if="step === 'chat'">
          <div class="charmy-timer-row">
            <span class="charmy-stage-label">PASO 3 DE 3 · PRUEBA GUIADA</span>
            <span class="charmy-timer" aria-label="Tiempo restante">{{ remaining }}</span>
          </div>
          <div class="charmy-meter" role="progressbar" :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="100" aria-label="Preguntas completadas"><span :style="{ width: `${progress}%` }"></span></div>
          <h2>{{ selectedCase?.label }}</h2>
          <p class="charmy-subcopy">Pregunta {{ promptIndex + 1 }} de {{ selectedCase?.prompts.length }}. Charmy te acompaña paso a paso.</p>
          <div class="charmy-prompt"><span>CHARMY PREGUNTA</span><p>{{ currentPrompt }}</p></div>
          <div v-if="lastObservation" class="charmy-observation"><strong>Última sugerencia</strong><p>{{ lastObservation }}</p></div>
          <label for="charmy-answer" class="charmy-input-label">Tu respuesta</label>
          <textarea id="charmy-answer" v-model="answer" rows="4" maxlength="1600" placeholder="Habla con el micrófono o escribe aquí tu respuesta..."></textarea>
          <div class="charmy-trial-actions">
            <button type="button" class="charmy-secondary" @click="speak(currentPrompt)">Escuchar pregunta</button>
            <button type="button" class="charmy-secondary" @click="toggleVoice">{{ voiceEnabled ? 'Silenciar Charmy' : 'Activar voz' }}</button>
            <button v-if="voiceSupported" type="button" class="charmy-secondary" :aria-pressed="listening" @click="listening ? stopListening() : startListening()">{{ listening ? 'Detener micrófono' : 'Responder por voz' }}</button>
          </div>
          <p v-if="!voiceSupported" class="charmy-hint">El reconocimiento de voz no está disponible en este navegador; puedes continuar escribiendo.</p>
          <p v-if="error" class="charmy-error" role="alert">{{ error }}</p>
          <button type="button" class="charmy-action" @click="sendAnswer">Enviar respuesta <span aria-hidden="true">→</span></button>
          <button type="button" class="charmy-text-button" @click="endTrial(false)">Terminar la prueba antes</button>
        </template>

        <template v-else>
          <span class="charmy-stage-label">INTRODUCCIÓN COMPLETADA</span>
          <h2>{{ timedOut ? '¡Terminó el tiempo!' : '¡Buen entrenamiento!' }}</h2>
          <p class="charmy-subcopy">{{ summary }} Para practicar escenarios completos y guardar resultados, necesitas iniciar sesión o crear una cuenta.</p>
          <div class="charmy-speech-card"><strong>Lo que sigue</strong><p>Continúa con {{ selectedCase?.label?.toLowerCase() }} y accede a las simulaciones reales de Dale.</p><span>La prueba de invitado no se almacena ni se transferirá a tu cuenta.</span></div>
          <div class="charmy-finish-actions"><a class="charmy-action" :href="registerHref">Crear cuenta y continuar <span aria-hidden="true">→</span></a><a class="charmy-secondary" :href="loginHref">Ya tengo cuenta</a></div>
          <button type="button" class="charmy-text-button" @click="reset">Probar otro caso</button>
        </template>
      </div>

      <aside class="charmy-trial-mascot" :class="{ 'is-speaking': spoken }" aria-label="Charmy, tu guía de entrenamiento">
        <span class="charmy-sparkle" aria-hidden="true">✦</span>
        <div class="charmy-trial-bubble"><strong>Charmy</strong><p>{{ step === 'select' ? '¡Tú eliges la conversación!' : step === 'intro' ? 'Te ayudaré en cada paso.' : step === 'chat' ? 'Te escucho. Tómate tu tiempo.' : '¡Nos vemos en tu próximo entrenamiento!' }}</p></div>
        <picture><source media="(prefers-reduced-motion: reduce)" srcset="/charmy/charmy-static.webp" /><img src="/charmy/charmy-talk.webp" alt="Charmy, la mascota ilustrada de Dale, con su pico en movimiento" width="414" height="623" /></picture>
        <div class="charmy-trial-mascot-status"><span class="charmy-status-dot" aria-hidden="true"></span>{{ spoken ? 'Charmy está hablando' : listening ? 'Te estamos escuchando' : 'Tu guía de conversación' }}</div>
      </aside>
    </div>

    <p class="charmy-trial-privacy"><strong>Privacidad:</strong> esta prueba no envía ni guarda respuestas en el backend de Dale. Si usas reconocimiento de voz, el navegador podría transmitir audio a su proveedor. <a href="/privacidad">Consulta la política de privacidad</a>.</p>
  </section>
</template>
