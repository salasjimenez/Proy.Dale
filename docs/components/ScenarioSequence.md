---
layout: default
title: "ScenarioSequence.vue | Dale"
---

# ScenarioSequence.vue

Entrenador de tres fases, voz preferida y texto alternativo. Reutiliza las sesiones actuales.

**Archivo fuente:** `frontend/src/components/vue/ScenarioSequence.vue`  
**Interfaz:** Sin props. Lee el slug del query string en /simulacion.

## Requisitos y dependencias

- [`frontend/src/lib/api.ts`](../codigo/lib-api.html)
- [`frontend/src/types/auth.ts`](../codigo/types-auth.html)
- [`frontend/src/types/scenario.ts`](../codigo/types-scenario.html)
- [`frontend/src/types/session.ts`](../codigo/types-session.html)
- [`frontend/src/lib/training.ts`](../codigo/lib-training.html)
- [`frontend/src/lib/sequence.ts`](../codigo/lib-sequence.html)
- [VoiceCapture.vue](VoiceCapture.html)

En Dale se usa Astro + Vue + Tailwind CSS. Los imports relativos del codigo completo suponen la estructura original `frontend/src`; copia tambien las dependencias indicadas o adapta esas rutas a tu proyecto. Para las islas Astro, `client:load` habilita la interaccion en el navegador.

## Ejemplos de uso

### Ruta /simulacion (Astro)

{% raw %}

```astro
---
import ScenarioSequence from "../components/vue/ScenarioSequence.vue";
---

<ScenarioSequence client:load />
```

{% endraw %}

## Codigo fuente completo — v0.16.4

El siguiente bloque reproduce el archivo Vue actual sin omisiones funcionales. Puedes copiarlo sobre `ScenarioSequence.vue`.

{% raw %}

```vue
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { ApiError, apiDelete, apiGet, apiPost } from "../../lib/api";
import type { AuthResponse, AuthUser } from "../../types/auth";
import type { ScenarioCardData } from "../../types/scenario";
import type { PracticeSession, PracticeSessionResponse } from "../../types/session";
import { focusSuggestion, recommendNextStage, remainingTimeLabel, trainingStageName, type TrainingStage } from "../../lib/training";
import { answerReady, answerWordCount, assembleSequence, sequencePhases, sequenceVerdict, type PhaseAnswer, type SequenceMode } from "../../lib/sequence";
import VoiceCapture, { type VoiceCaptureResult } from "./VoiceCapture.vue";

const scenario = ref<ScenarioCardData | null>(null);
const user = ref<AuthUser | null>(null);
const session = ref<PracticeSession | null>(null);
const answers = ref<PhaseAnswer[]>([]);
const phaseIndex = ref(0);
const currentText = ref("");
const mode = ref<SequenceMode>("VOZ");
const supportsVoice = ref(false);
const loading = ref(true);
const starting = ref(false);
const saving = ref(false);
const cancelling = ref(false);
const cancelled = ref(false);
const authRequired = ref(false);
const error = ref("");
const slug = ref("");
const short = ref(false);
const elapsedSeconds = ref(0);
const captureKey = ref(0);
let overallStartedAt = 0;
let phaseStartedAt = 0;
let timer: number | undefined;

const phases = computed(() => scenario.value ? sequencePhases(scenario.value) : []);
const phase = computed(() => phases.value[phaseIndex.value]);
const completed = computed(() => session.value?.estado === "COMPLETADA");
const verdict = computed(() => sequenceVerdict(session.value?.metrica?.puntajeGeneral ?? null, completed.value));
const next = computed(() => scenario.value && completed.value
  ? recommendNextStage(scenario.value.slug, session.value?.metrica?.puntajeGeneral ?? null)
  : null);
const nextUrl = computed(() => `/simulacion?escenario=${encodeURIComponent(slug.value)}&modalidad=${mode.value}${short.value ? "&rapido=1" : ""}`);
const loginUrl = computed(() => `/login?next=${encodeURIComponent(nextUrl.value)}`);
const registerUrl = computed(() => `/registro?next=${encodeURIComponent(nextUrl.value)}`);
const progressLabel = computed(() => `Fase ${Math.min(phaseIndex.value + 1, 3)} de 3`);
const suggestedFocus = computed(() => {
  const metric = session.value?.metrica;
  if (!metric) return "Repite la práctica para obtener más evidencia de tu avance.";
  return focusSuggestion(metric, session.value?.modalidad ?? mode.value);
});

function stopTimer(): void {
  if (timer !== undefined) window.clearInterval(timer);
  timer = undefined;
}

function resetRecording(): void {
  captureKey.value += 1;
}

async function initialize(): Promise<void> {
  const query = new URLSearchParams(window.location.search);
  slug.value = query.get("escenario")?.trim() ?? "";
  short.value = query.get("rapido") === "1";
  supportsVoice.value = Boolean(("SpeechRecognition" in window || "webkitSpeechRecognition" in window) && navigator.mediaDevices?.getUserMedia);
  mode.value = query.get("modalidad") === "TEXTO" || !supportsVoice.value ? "TEXTO" : "VOZ";
  if (!slug.value) {
    error.value = "Selecciona un escenario desde el catálogo o el planificador.";
    loading.value = false;
    return;
  }
  try {
    const response = await apiGet<{ data: ScenarioCardData }>(`/api/escenarios/${encodeURIComponent(slug.value)}`);
    scenario.value = response.data;
  } catch (caught) {
    error.value = caught instanceof ApiError && caught.status === 404
      ? "El escenario solicitado no existe o no está disponible."
      : "No pudimos cargar el escenario; revisa la conexión con el backend.";
    loading.value = false;
    return;
  }
  try {
    const response = await apiGet<AuthResponse>("/api/auth/me");
    user.value = response.data.user;
  } catch (caught) {
    authRequired.value = caught instanceof ApiError && caught.status === 401;
    if (!authRequired.value) error.value = "No fue posible verificar tu sesión. Reintenta cuando el backend esté disponible.";
  } finally {
    loading.value = false;
  }
}

async function begin(): Promise<void> {
  if (!scenario.value || starting.value) return;
  if (mode.value === "VOZ" && !supportsVoice.value) {
    error.value = "Este navegador no permite reconocer voz. Usa Chrome o Edge con permiso de micrófono o practica por texto.";
    return;
  }
  starting.value = true;
  error.value = "";
  try {
    const response = await apiPost<PracticeSessionResponse>("/api/sesiones", {
      escenarioSlug: scenario.value.slug, modalidad: mode.value,
    });
    session.value = response.data.session;
    answers.value = [];
    phaseIndex.value = 0;
    currentText.value = "";
    overallStartedAt = Date.now();
    phaseStartedAt = overallStartedAt;
    elapsedSeconds.value = 0;
    stopTimer();
    timer = window.setInterval(() => { elapsedSeconds.value = Math.floor((Date.now() - overallStartedAt) / 1000); }, 1000);
  } catch (caught) {
    if (caught instanceof ApiError && caught.status === 401) authRequired.value = true;
    error.value = caught instanceof ApiError ? caught.message : "No se pudo iniciar la simulación.";
  } finally {
    starting.value = false;
  }
}

async function saveAll(allAnswers: PhaseAnswer[]): Promise<void> {
  if (!session.value || saving.value) return;
  saving.value = true;
  error.value = "";
  try {
    const payload = assembleSequence(allAnswers, mode.value);
    const response = await apiPost<PracticeSessionResponse>(`/api/sesiones/${session.value.id}/completar`, payload);
    session.value = response.data.session;
    stopTimer();
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : "No fue posible guardar el resultado. Puedes reintentarlo.";
  } finally {
    saving.value = false;
  }
}

async function registerAnswer(answer: PhaseAnswer): Promise<void> {
  if (!phase.value || saving.value || cancelled.value) return;
  if (answers.value.length === 3) { await saveAll(answers.value); return; }
  if (!answerReady(answer.text, phase.value)) {
    error.value = `Para continuar, responde con al menos ${phase.value.minimumWords} palabras. Puedes repetir la fase.`;
    if (mode.value === "VOZ") resetRecording();
    return;
  }
  error.value = "";
  const nextAnswers = [...answers.value, answer];
  answers.value = nextAnswers;
  if (phaseIndex.value < phases.value.length - 1) {
    phaseIndex.value += 1;
    currentText.value = "";
    phaseStartedAt = Date.now();
    resetRecording();
  } else {
    await saveAll(nextAnswers);
  }
}

async function finishText(): Promise<void> {
  const answer = { text: currentText.value.trim(), durationMs: Math.max(0, Date.now() - phaseStartedAt), pauses: [] };
  await registerAnswer(answer);
}

async function finishVoice(payload: VoiceCaptureResult): Promise<void> {
  await registerAnswer({ text: payload.transcripcion, durationMs: payload.duracionMs, pauses: payload.pausasDetalle });
}

function voiceError(message: string): void {
  error.value = message;
}

async function cancel(): Promise<void> {
  if (!session.value || saving.value || cancelling.value) return;
  if (!window.confirm("¿Descartar esta simulación? No se guardarán respuestas ni métricas.")) return;
  cancelling.value = true;
  error.value = "";
  try {
    await apiDelete<{ message: string }>(`/api/sesiones/${session.value.id}`);
    stopTimer();
    cancelled.value = true;
    session.value = null;
    answers.value = [];
  } catch (caught) {
    error.value = caught instanceof ApiError ? caught.message : "No se pudo descartar; vuelve a intentarlo.";
  } finally {
    cancelling.value = false;
  }
}

function formatMetric(value: number | null | undefined): string {
  return value === null || value === undefined ? "Sin datos" : String(value);
}

onMounted(() => void initialize());
onBeforeUnmount(stopTimer);
</script>

<template>
  <section class="mx-auto w-full max-w-6xl min-w-0 space-y-6" aria-labelledby="sequence-heading">
    <a href="/entrenar" class="inline-flex min-h-11 items-center text-sm font-bold text-blue-800 underline underline-offset-4">← Cambiar entrenamiento</a>
    <div v-if="loading" class="rounded-3xl border border-slate-200 bg-white p-8" aria-live="polite">Preparando la simulación…</div>
    <div v-else-if="!scenario" class="rounded-3xl border border-rose-200 bg-rose-50 p-6" role="alert">
      <h1 id="sequence-heading" class="text-2xl font-black">No pudimos abrir la simulación</h1>
      <p class="mt-2">{{ error }}</p>
      <a href="/entrenar" class="mt-4 inline-flex font-bold underline">Elegir escenario</a>
    </div>
    <template v-else>
      <header class="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 sm:p-8">
        <p class="text-xs font-black uppercase tracking-[0.16em] text-blue-800">Simulador de conversaciones · v0.16.4</p>
        <h1 id="sequence-heading" class="mt-2 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">{{ scenario.titulo }}</h1>
        <p class="mt-3 max-w-3xl text-sm leading-7 text-slate-700">Tres retos consecutivos para practicar cómo actuar cuando cambia una conversación.</p>
        <div class="mt-4 flex flex-wrap gap-2 text-xs font-bold">
          <span class="rounded-full border border-blue-300 bg-white px-3 py-2 text-blue-900">{{ scenario.categoria.nombre }}</span>
          <span class="rounded-full border border-blue-300 bg-white px-3 py-2 text-blue-900">{{ trainingStageName(scenario.nivel.codigo as TrainingStage) }}</span>
          <span class="rounded-full border border-blue-300 bg-white px-3 py-2 text-blue-900">{{ mode === 'VOZ' ? 'Voz principal' : 'Texto alternativo' }}</span>
        </div>
      </header>

      <div v-if="authRequired" class="rounded-2xl border border-amber-300 bg-amber-50 p-6">
        <h2 class="text-xl font-black text-slate-950">Inicia sesión para guardar una simulación</h2>
        <p class="mt-2 text-sm text-slate-700">Tus respuestas y métricas pertenecen a tu cuenta. Puedes crearla gratis.</p>
        <div class="mt-5 flex flex-wrap gap-3">
          <a :href="loginUrl" class="rounded-xl bg-slate-950 px-5 py-3 font-bold text-white">Iniciar sesión</a>
          <a :href="registerUrl" class="rounded-xl border border-slate-500 bg-white px-5 py-3 font-bold">Crear cuenta</a>
        </div>
      </div>
      <div v-else-if="error && !user" role="alert" class="rounded-xl border border-rose-300 bg-rose-50 p-5">{{ error }}</div>
      <div v-else-if="cancelled" class="rounded-3xl border border-slate-300 bg-white p-8" role="status">
        <h2 class="text-2xl font-black">Simulación no completada</h2>
        <p class="mt-3 text-slate-700">Cancelaste la práctica y descartamos la sesión iniciada. No hay una calificación final.</p>
        <a :href="nextUrl" class="mt-5 inline-flex min-h-11 items-center rounded-xl bg-blue-700 px-5 py-3 font-bold text-white">Volver a empezar</a>
      </div>
      <template v-else-if="user">
        <div v-if="!session" class="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <article class="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 class="text-xl font-black text-slate-950">Antes de empezar</h2>
            <p class="mt-3 leading-7 text-slate-700">{{ scenario.situacion }}</p>
            <p class="mt-4 rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-950"><strong>Tu objetivo:</strong> {{ scenario.instrucciones }}</p>
            <p class="mt-5 text-sm font-black">¿Cómo responderás?</p>
            <div class="mt-3 grid gap-3 sm:grid-cols-2" role="group" aria-label="Modalidad de la simulación">
              <button type="button" :aria-pressed="mode === 'VOZ'" :disabled="!supportsVoice" class="min-h-16 rounded-xl border-2 p-3 text-left font-bold disabled:opacity-50" :class="mode === 'VOZ' ? 'border-blue-700 bg-blue-50' : 'border-slate-300'" @click="mode = 'VOZ'">Voz · Recomendada <span class="block text-xs font-normal">Ritmo, pausas y muletillas</span></button>
              <button type="button" :aria-pressed="mode === 'TEXTO'" class="min-h-16 rounded-xl border-2 p-3 text-left font-bold" :class="mode === 'TEXTO' ? 'border-blue-700 bg-blue-50' : 'border-slate-300'" @click="mode = 'TEXTO'">Texto · Alternativa <span class="block text-xs font-normal">Sin usar micrófono</span></button>
            </div>
            <p v-if="!supportsVoice" class="mt-3 text-sm text-amber-800">La voz no está disponible en este navegador; texto permanece accesible.</p>
            <p class="mt-4 text-sm text-slate-600">{{ short ? 'Práctica breve: contador orientativo de 5 minutos, sin envío automático.' : 'Puedes practicar a tu ritmo.' }}</p>
            <p v-if="error" class="mt-4 text-sm font-bold text-rose-800" role="alert">{{ error }}</p>
            <button type="button" :disabled="starting" class="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-700 px-5 py-3 font-black text-white disabled:opacity-60 sm:w-auto" @click="begin">{{ starting ? 'Creando sesión…' : 'Comenzar simulación' }}</button>
          </article>
          <aside class="rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-7">
            <h2 class="text-lg font-black">Tus tres retos</h2>
            <ol class="mt-4 space-y-3">
              <li v-for="step in phases" :key="step.id" class="rounded-xl border border-slate-200 bg-white p-4">
                <span class="font-black">{{ step.title }}</span>
                <span class="mt-1 block text-xs text-slate-600">Presión {{ step.intensity.toLowerCase() }}</span>
              </li>
            </ol>
            <p class="mt-4 text-xs leading-5 text-slate-600">Guion estructurado, no conversación con una IA. El sistema no interpreta emociones ni video.</p>
          </aside>
        </div>

        <section v-else-if="!completed" class="space-y-5" aria-live="polite">
          <div class="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h2 class="text-xl font-black text-slate-950">{{ progressLabel }}</h2>
              <span v-if="short" class="rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-blue-800">{{ remainingTimeLabel(elapsedSeconds) }} <span v-if="elapsedSeconds >= 300">· tiempo sugerido agotado</span></span>
            </div>
            <ol class="mt-4 grid grid-cols-3 gap-2 text-xs font-semibold sm:text-sm" aria-label="Progreso por fases">
              <li v-for="(step, index) in phases" :key="step.id" class="min-w-0 rounded-lg px-2 py-3 text-center" :class="index < phaseIndex ? 'bg-emerald-100 text-emerald-900' : index === phaseIndex ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'" :aria-current="index === phaseIndex ? 'step' : undefined">{{ index < phaseIndex ? '✓ ' : '' }}{{ step.id === 'apertura' ? 'Apertura' : step.id === 'objecion' ? 'Objeción' : 'Presión' }}</li>
            </ol>
          </div>
          <div v-if="phase" class="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <aside class="min-w-0 rounded-3xl border border-blue-200 bg-blue-50 p-5 sm:p-7">
              <p class="text-xs font-black uppercase tracking-wide text-blue-800">{{ phase.title }} · Presión {{ phase.intensity.toLowerCase() }}</p>
              <h3 class="mt-4 text-lg font-black text-slate-950">La situación cambia</h3>
              <p class="mt-3 text-base leading-8 text-slate-800">{{ phase.interaction }}</p>
              <div class="mt-5 rounded-2xl border border-blue-200 bg-white p-4 text-sm leading-6 text-slate-700"><strong>Tu reto:</strong> {{ phase.hint }}</div>
              <p class="mt-4 text-xs text-blue-900">No hay respuestas automáticas de un personaje. Tú avanzas cuando completas cada fase.</p>
            </aside>
            <article class="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <h3 class="text-lg font-black text-slate-950">Tu respuesta {{ mode === 'VOZ' ? 'por voz' : 'por texto' }}</h3>
              <p class="mt-2 text-sm leading-6 text-slate-600">Usa al menos {{ phase.minimumWords }} palabras para disponer de una muestra de práctica. Puedes repetir la captura si lo necesitas.</p>
              <template v-if="mode === 'VOZ'">
                <VoiceCapture :key="captureKey" @complete="finishVoice" @error="voiceError" />
                <p class="mt-3 text-xs text-slate-600">El audio no se guarda en Dale. El reconocimiento puede utilizar servicios del proveedor de tu navegador.</p>
              </template>
              <template v-else>
                <label :for="`phase-answer-${phaseIndex}`" class="mt-5 block text-sm font-bold text-slate-700">Escribe lo que responderías</label>
                <textarea :id="`phase-answer-${phaseIndex}`" v-model="currentText" rows="8" maxlength="4500" class="mt-2 w-full min-w-0 rounded-xl border border-slate-300 bg-white p-4 text-slate-950 focus-visible:outline-blue-700" placeholder="Responde con tus propias palabras…"></textarea>
                <p class="mt-2 text-xs text-slate-600">{{ answerWordCount(currentText) }} palabras · {{ currentText.length }}/4500 caracteres</p>
                <button type="button" :disabled="saving || answers.length === 3" class="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-700 px-5 py-3 font-bold text-white disabled:opacity-50 sm:w-auto" @click="finishText">{{ phaseIndex === 2 ? 'Finalizar y ver resultado' : 'Guardar respuesta y continuar' }}</button>
              </template>
              <div v-if="error" role="alert" class="mt-4 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm font-bold text-rose-900">{{ error }}</div>
              <div v-if="answers.length === 3 && !completed" class="mt-4">
                <button type="button" :disabled="saving" class="min-h-11 rounded-xl border border-slate-400 px-5 py-3 font-bold" @click="saveAll(answers)">{{ saving ? 'Guardando…' : 'Reintentar guardado de las tres fases' }}</button>
              </div>
            </article>
          </div>
          <button type="button" :disabled="cancelling || saving" class="min-h-11 rounded-lg px-3 text-sm font-semibold text-rose-800 underline underline-offset-4" @click="cancel">{{ cancelling ? 'Descartando…' : 'Abandonar y descartar la simulación' }}</button>
        </section>

        <section v-else-if="session?.metrica" class="space-y-5" aria-label="Resultado final">
          <div class="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8" role="status">
            <p class="text-xs font-black uppercase tracking-[0.16em] text-emerald-900">Tres fases completadas</p>
            <div class="mt-3 flex flex-wrap items-center justify-between gap-4">
              <div class="min-w-0"><h2 class="text-2xl font-black text-slate-950 sm:text-3xl">{{ verdict.label }}</h2><p class="mt-2 max-w-2xl text-sm leading-6 text-slate-700">{{ verdict.description }}</p></div>
              <div class="rounded-xl bg-white px-6 py-3 text-center"><span class="block text-xs font-bold text-slate-700">Puntaje orientativo</span><strong class="text-4xl font-black text-slate-950">{{ formatMetric(session.metrica.puntajeGeneral) }}</strong><span class="text-xs">/100</span></div>
            </div>
          </div>
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <article class="rounded-xl border border-slate-200 bg-white p-5"><p class="text-xs text-slate-600">Palabras</p><strong class="mt-2 block text-3xl">{{ session.metrica.palabras }}</strong></article>
            <article class="rounded-xl border border-slate-200 bg-white p-5"><p class="text-xs text-slate-600">Palabras por minuto</p><strong class="mt-2 block text-3xl">{{ formatMetric(session.metrica.palabrasPorMinuto) }}</strong></article>
            <article class="rounded-xl border border-slate-200 bg-white p-5"><p class="text-xs text-slate-600">Pausas estimadas</p><strong class="mt-2 block text-3xl">{{ session.metrica.cantidadPausas }}</strong></article>
            <article class="rounded-xl border border-slate-200 bg-white p-5"><p class="text-xs text-slate-600">Muletillas</p><strong class="mt-2 block text-3xl">{{ session.metrica.muletillasTotal }}</strong></article>
          </div>
          <div class="grid gap-5 lg:grid-cols-2">
            <article class="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 class="text-xl font-black">Resumen de las tres fases</h3>
              <ol class="mt-4 space-y-3 text-sm leading-6"><li v-for="(answer, index) in answers" :key="index" class="rounded-xl bg-slate-50 p-4"><strong class="block text-slate-950">{{ phases[index]?.title }}</strong><p class="mt-2 whitespace-pre-wrap text-slate-700">{{ answer.text }}</p></li></ol>
              <p class="mt-3 text-xs text-slate-600">Las fases se muestran durante esta visita. La API guarda una transcripción consolidada, no puntuaciones independientes por fase.</p>
            </article>
            <article class="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 class="text-xl font-black">Qué mejorar después</h3>
              <p class="mt-3 rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-900">{{ suggestedFocus }}</p>
              <ul v-if="session.feedback?.suggestions?.length" class="mt-4 list-inside list-disc space-y-2 text-sm text-slate-700"><li v-for="item in session.feedback.suggestions" :key="item">{{ item }}</li></ul>
              <p class="mt-4 text-xs text-slate-600">No se analizan expresiones faciales, emociones ni lenguaje corporal.</p>
            </article>
          </div>
          <div class="flex flex-wrap gap-3">
            <a :href="nextUrl" class="inline-flex min-h-12 items-center rounded-xl bg-blue-700 px-5 py-3 font-bold text-white">Repetir simulación</a>
            <a v-if="next" :href="`/simulacion?escenario=${encodeURIComponent(next.slug)}&modalidad=${mode}`" class="inline-flex min-h-12 items-center rounded-xl border border-blue-300 bg-white px-5 py-3 font-bold text-blue-900">{{ next.title }}</a>
            <a href="/analisis-voz" class="inline-flex min-h-12 items-center rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-900">Analizar mi voz</a>
            <a href="/progreso" class="inline-flex min-h-12 items-center rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-900">Ver evolución</a>
          </div>
        </section>
      </template>
    </template>
  </section>
</template>
```

{% endraw %}

## Consideraciones

- Fases locales y transcript consolidado: no se almacenan métricas individuales por fase.
- No realiza inferencia emocional ni facial; el reconocimiento de voz depende del navegador.

Consulta [todos los componentes](index.html) y el [codigo auxiliar reutilizable](../codigo/index.html).
