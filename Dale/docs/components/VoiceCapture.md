# `VoiceCapture.vue`

Componente Vue reutilizable para capturar una práctica por voz. Solicita el micrófono, transcribe con Web Speech API, estima pausas con Web Audio API y emite únicamente transcripción, duración y marcas de pausa.

## Uso

```vue
<script setup lang="ts">
import VoiceCapture, { type VoiceCaptureResult } from "./VoiceCapture.vue";

function onComplete(result: VoiceCaptureResult) {
  console.log(result.transcripcion, result.duracionMs, result.pausasDetalle);
}

function onError(message: string) {
  console.error(message);
}
</script>

<template>
  <VoiceCapture @complete="onComplete" @error="onError" />
</template>
```

## Código completo

```vue
<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";

export type VoicePause = {
  inicioMs: number;
  duracionMs: number;
};

export type VoiceCaptureResult = {
  transcripcion: string;
  duracionMs: number;
  pausasDetalle: VoicePause[];
};

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: { transcript: string };
};

type SpeechRecognitionEventLike = Event & {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionErrorEventLike = Event & {
  error: string;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type WindowWithSpeechRecognition = Window &
  typeof globalThis & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

const emit = defineEmits<{
  complete: [payload: VoiceCaptureResult];
  error: [message: string];
}>();

const isRecording = ref(false);
const isPreparing = ref(false);
const finalTranscript = ref("");
const interimTranscript = ref("");
const elapsedMs = ref(0);
const pauseCount = ref(0);
const inputLevel = ref(0);

let recognition: SpeechRecognitionLike | null = null;
let stream: MediaStream | null = null;
let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let animationFrameId: number | null = null;
let timerId: number | null = null;
let startedAt = 0;
let shouldListen = false;
let heardVoice = false;
let silenceStartedAt: number | null = null;
let pauses: VoicePause[] = [];
let sampleBuffer: Uint8Array<ArrayBuffer> | null = null;

const transcript = computed(() => [finalTranscript.value, interimTranscript.value].filter(Boolean).join(" ").trim());
const formattedTime = computed(() => {
  const totalSeconds = Math.floor(elapsedMs.value / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
});

function recognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const speechWindow = window as WindowWithSpeechRecognition;
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

function isSupported(): boolean {
  return Boolean(recognitionConstructor() && navigator.mediaDevices?.getUserMedia);
}

function stopMediaResources(): void {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  if (timerId !== null) {
    window.clearInterval(timerId);
    timerId = null;
  }

  if (recognition) {
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    try {
      recognition.stop();
    } catch {
      // Puede estar detenida por el propio navegador.
    }
    recognition = null;
  }

  stream?.getTracks().forEach((track) => track.stop());
  stream = null;

  if (audioContext) {
    void audioContext.close().catch(() => undefined);
  }
  audioContext = null;
  analyser = null;
  sampleBuffer = null;
  inputLevel.value = 0;
}

function monitorAudio(): void {
  if (!analyser || !sampleBuffer || !isRecording.value) return;

  analyser.getByteTimeDomainData(sampleBuffer);

  let sumSquares = 0;
  for (const sample of sampleBuffer) {
    const normalized = (sample - 128) / 128;
    sumSquares += normalized * normalized;
  }

  const rms = Math.sqrt(sumSquares / sampleBuffer.length);
  inputLevel.value = Math.min(1, rms * 12);

  const now = performance.now();
  const relativeNow = Math.max(0, Math.round(now - startedAt));
  const voiceDetected = rms >= 0.035;

  if (voiceDetected) {
    if (heardVoice && silenceStartedAt !== null) {
      const pauseDuration = Math.round(now - silenceStartedAt);
      if (pauseDuration >= 600 && pauseDuration <= 30_000) {
        pauses.push({
          inicioMs: Math.max(0, Math.round(silenceStartedAt - startedAt)),
          duracionMs: pauseDuration,
        });
        pauseCount.value = pauses.length;
      }
    }

    heardVoice = true;
    silenceStartedAt = null;
  } else if (heardVoice && silenceStartedAt === null) {
    silenceStartedAt = now;
  }

  if (relativeNow >= 7_200_000) {
    void finishCapture();
    return;
  }

  animationFrameId = requestAnimationFrame(monitorAudio);
}

function configureRecognition(): SpeechRecognitionLike {
  const Constructor = recognitionConstructor();
  if (!Constructor) throw new Error("SpeechRecognition unavailable");

  const instance = new Constructor();
  instance.continuous = true;
  instance.interimResults = true;
  instance.lang = "es-PE";
  instance.maxAlternatives = 1;

  instance.onresult = (event) => {
    let interim = "";

    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index];
      const text = result[0]?.transcript?.trim() ?? "";
      if (!text) continue;

      if (result.isFinal) {
        finalTranscript.value = `${finalTranscript.value} ${text}`.trim();
      } else {
        interim = `${interim} ${text}`.trim();
      }
    }

    interimTranscript.value = interim;
  };

  instance.onerror = (event) => {
    if (!shouldListen || event.error === "aborted") return;

    if (event.error === "no-speech") return;

    const message = event.error === "not-allowed" || event.error === "service-not-allowed"
      ? "El navegador bloqueó el acceso al micrófono o al reconocimiento de voz. Revisa los permisos del sitio."
      : "El reconocimiento de voz se interrumpió. Puedes volver a intentarlo.";

    emit("error", message);
  };

  instance.onend = () => {
    if (!shouldListen || !isRecording.value) return;
    window.setTimeout(() => {
      if (!shouldListen || !recognition || !isRecording.value) return;
      try {
        recognition.start();
      } catch {
        // Algunos navegadores reinician automáticamente el reconocimiento continuo.
      }
    }, 120);
  };

  return instance;
}

async function startCapture(): Promise<void> {
  if (isRecording.value || isPreparing.value) return;

  if (!isSupported()) {
    emit("error", "La práctica por voz necesita Web Speech API y acceso al micrófono. Usa una versión actual de Chrome o Edge, o practica por texto.");
    return;
  }

  isPreparing.value = true;
  finalTranscript.value = "";
  interimTranscript.value = "";
  elapsedMs.value = 0;
  pauseCount.value = 0;
  pauses = [];
  heardVoice = false;
  silenceStartedAt = null;

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.2;
    source.connect(analyser);
    sampleBuffer = new Uint8Array(analyser.fftSize) as Uint8Array<ArrayBuffer>;

    recognition = configureRecognition();
    shouldListen = true;
    startedAt = performance.now();
    isRecording.value = true;
    recognition.start();

    timerId = window.setInterval(() => {
      elapsedMs.value = Math.max(0, Math.round(performance.now() - startedAt));
    }, 200);

    monitorAudio();
  } catch (error) {
    shouldListen = false;
    isRecording.value = false;
    stopMediaResources();

    if (error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "SecurityError")) {
      emit("error", "No se pudo acceder al micrófono. Habilita el permiso para este sitio y vuelve a intentarlo.");
    } else {
      emit("error", "No pudimos iniciar el micrófono. Verifica que esté disponible y vuelve a intentarlo.");
    }
  } finally {
    isPreparing.value = false;
  }
}

async function finishCapture(): Promise<void> {
  if (!isRecording.value) return;

  elapsedMs.value = Math.max(0, Math.round(performance.now() - startedAt));
  const cleanTranscript = transcript.value.trim();
  shouldListen = false;
  isRecording.value = false;
  interimTranscript.value = "";
  stopMediaResources();
  if (cleanTranscript.length < 3) {
    emit("error", "No se obtuvo una transcripción suficiente. Habla más cerca del micrófono y vuelve a intentarlo.");
    return;
  }

  emit("complete", {
    transcripcion: cleanTranscript,
    duracionMs: elapsedMs.value,
    pausasDetalle: pauses,
  });
}

onBeforeUnmount(() => {
  shouldListen = false;
  isRecording.value = false;
  stopMediaResources();
});
</script>

<template>
  <div class="space-y-5">
    <div class="rounded-2xl border border-blue-200 bg-blue-50 p-5">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Micrófono</p>
          <h3 class="mt-1 text-xl font-black text-slate-950">
            {{ isRecording ? "Estamos escuchando" : "Listo para comenzar" }}
          </h3>
        </div>
        <div class="flex items-center gap-3">
          <span class="rounded-full bg-white px-3 py-1 text-sm font-black text-slate-700 shadow-sm">{{ formattedTime }}</span>
          <span v-if="isRecording" class="inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-rose-700">
            <span class="h-2 w-2 animate-pulse rounded-full bg-rose-600"></span>
            Grabando métricas
          </span>
        </div>
      </div>

      <div class="mt-4 h-2 overflow-hidden rounded-full bg-white">
        <div class="h-full rounded-full bg-blue-600 transition-[width] duration-100" :style="{ width: `${Math.max(2, Math.round(inputLevel * 100))}%` }"></div>
      </div>
      <p class="mt-2 text-xs leading-5 text-slate-600">La barra indica actividad del micrófono. Dale no guarda el archivo de audio.</p>
    </div>

    <div class="rounded-2xl border border-slate-200 bg-white p-5">
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm font-black text-slate-950">Transcripción en vivo</p>
        <span class="text-xs font-bold text-slate-500">{{ pauseCount }} pausas detectadas</span>
      </div>
      <p v-if="transcript" class="mt-3 min-h-28 whitespace-pre-wrap leading-7 text-slate-700">{{ transcript }}</p>
      <p v-else class="mt-3 min-h-28 leading-7 text-slate-400">Cuando empieces a hablar, la transcripción aparecerá aquí.</p>
    </div>

    <div class="flex flex-col gap-3 sm:flex-row">
      <button
        v-if="!isRecording"
        type="button"
        :disabled="isPreparing"
        class="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-950 px-6 py-3 font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        @click="startCapture"
      >
        {{ isPreparing ? "Preparando micrófono..." : "Activar micrófono y hablar" }}
      </button>

      <button
        v-else
        type="button"
        class="inline-flex min-h-12 items-center justify-center rounded-xl bg-rose-600 px-6 py-3 font-black text-white transition hover:bg-rose-700"
        @click="finishCapture"
      >
        Terminar y analizar
      </button>
    </div>

    <p class="text-xs leading-5 text-slate-500">
      El reconocimiento de voz depende del navegador. En algunos navegadores el motor de Web Speech puede procesar audio mediante servicios del proveedor del navegador. Dale no recibe ni almacena el audio.
    </p>
  </div>
</template>

```
