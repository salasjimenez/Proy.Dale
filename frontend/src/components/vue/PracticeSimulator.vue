<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ApiError, apiGet, apiPost } from "../../lib/api";
import type { AuthResponse, AuthUser } from "../../types/auth";
import type { ScenarioCardData } from "../../types/scenario";
import type { PracticeSession, PracticeSessionResponse } from "../../types/session";

const user = ref<AuthUser | null>(null);
const scenario = ref<ScenarioCardData | null>(null);
const session = ref<PracticeSession | null>(null);
const transcript = ref("");
const loading = ref(true);
const starting = ref(false);
const finishing = ref(false);
const error = ref("");
const authRequired = ref(false);
const startedAt = ref<number | null>(null);

const slug = ref("");

const wordCount = computed(() => {
  const value = transcript.value.trim();
  return value ? value.split(/\s+/).length : 0;
});

const isCompleted = computed(() => session.value?.estado === "COMPLETADA");

const nextUrl = computed(() => `/practicar?escenario=${encodeURIComponent(slug.value)}`);
const loginUrl = computed(() => `/login?next=${encodeURIComponent(nextUrl.value)}`);
const registerUrl = computed(() => `/registro?next=${encodeURIComponent(nextUrl.value)}`);

function categoryLabel(code: string): string {
  return {
    LABORAL: "Laboral",
    TRAMITES_CALLE: "Trámites y calle",
    SOCIAL: "Social",
    JOVENES_ESTUDIANTES: "Jóvenes y estudiantes",
  }[code] || code;
}

function levelLabel(code: string): string {
  return {
    BASICO: "Básico",
    INTERMEDIO: "Intermedio",
    DIFICIL: "Difícil",
  }[code] || code;
}

function formatDuration(durationMs: number | null): string {
  if (!durationMs) return "—";
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

async function initialize(): Promise<void> {
  const params = new URLSearchParams(window.location.search);
  slug.value = params.get("escenario")?.trim() || "";

  if (!slug.value) {
    error.value = "No se indicó un escenario. Vuelve al catálogo y elige uno para practicar.";
    loading.value = false;
    return;
  }

  try {
    const [scenarioResponse, authResponse] = await Promise.all([
      apiGet<{ data: ScenarioCardData }>(`/api/escenarios/${encodeURIComponent(slug.value)}`),
      apiGet<AuthResponse>("/api/auth/me"),
    ]);

    scenario.value = scenarioResponse.data;
    user.value = authResponse.data.user;
  } catch (caught) {
    if (caught instanceof ApiError && caught.status === 401) {
      authRequired.value = true;
      try {
        const scenarioResponse = await apiGet<{ data: ScenarioCardData }>(
          `/api/escenarios/${encodeURIComponent(slug.value)}`,
        );
        scenario.value = scenarioResponse.data;
      } catch {
        error.value = "No pudimos cargar el escenario seleccionado.";
      }
    } else if (caught instanceof ApiError && caught.status === 404) {
      error.value = "El escenario seleccionado no existe o no está disponible.";
    } else {
      error.value = "No pudimos conectar con Dale. Verifica que el backend esté ejecutándose.";
    }
  } finally {
    loading.value = false;
  }
}

async function startPractice(): Promise<void> {
  if (!scenario.value) return;

  starting.value = true;
  error.value = "";

  try {
    const response = await apiPost<PracticeSessionResponse>("/api/sesiones", {
      escenarioSlug: scenario.value.slug,
      modalidad: "TEXTO",
    });
    session.value = response.data.session;
    transcript.value = "";
    startedAt.value = Date.now();
  } catch (caught) {
    if (caught instanceof ApiError && caught.status === 401) {
      authRequired.value = true;
      return;
    }
    error.value = caught instanceof ApiError ? caught.message : "No pudimos iniciar la práctica.";
  } finally {
    starting.value = false;
  }
}

async function finishPractice(): Promise<void> {
  if (!session.value) return;

  if (transcript.value.trim().length < 3) {
    error.value = "Escribe una respuesta antes de finalizar la práctica.";
    return;
  }

  finishing.value = true;
  error.value = "";

  try {
    const durationMs = startedAt.value ? Date.now() - startedAt.value : undefined;
    const response = await apiPost<PracticeSessionResponse>(
      `/api/sesiones/${session.value.id}/completar`,
      {
        transcripcion: transcript.value,
        ...(durationMs !== undefined ? { duracionMs } : {}),
      },
    );
    session.value = response.data.session;
  } catch (caught) {
    error.value = caught instanceof ApiError ? caught.message : "No pudimos guardar el resultado de la práctica.";
  } finally {
    finishing.value = false;
  }
}

function retryPractice(): void {
  session.value = null;
  transcript.value = "";
  startedAt.value = null;
  error.value = "";
}

onMounted(() => void initialize());
</script>

<template>
  <section class="mx-auto max-w-5xl">
    <div v-if="loading" class="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div class="h-5 w-32 animate-pulse rounded bg-slate-200"></div>
      <div class="mt-4 h-9 w-2/3 animate-pulse rounded bg-slate-200"></div>
      <div class="mt-5 h-28 animate-pulse rounded-2xl bg-slate-100"></div>
    </div>

    <div v-else-if="error && !scenario" class="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-rose-950">
      <h1 class="text-2xl font-black">No pudimos abrir esta práctica</h1>
      <p class="mt-3 leading-7">{{ error }}</p>
      <a href="/#escenarios" class="mt-6 inline-flex min-h-12 items-center rounded-xl bg-slate-950 px-5 py-3 font-black text-white">Volver a escenarios</a>
    </div>

    <template v-else-if="scenario">
      <div class="mb-6">
        <a href="/#escenarios" class="text-sm font-bold text-blue-700 hover:text-blue-900">← Volver al catálogo</a>
        <div class="mt-4 flex flex-wrap gap-2">
          <span class="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700 ring-1 ring-inset ring-blue-200">
            {{ scenario.categoria.nombre }}
          </span>
          <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700 ring-1 ring-inset ring-slate-200">
            {{ scenario.nivel.nombre }}
          </span>
          <span class="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700 ring-1 ring-inset ring-violet-200">
            Texto
          </span>
        </div>
        <h1 class="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{{ scenario.titulo }}</h1>
        <p class="mt-3 max-w-3xl leading-7 text-slate-600">{{ scenario.descripcion }}</p>
      </div>

      <div v-if="authRequired" class="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm sm:p-8">
        <p class="text-xs font-black uppercase tracking-[0.16em] text-amber-800">Necesitas una cuenta</p>
        <h2 class="mt-3 text-2xl font-black text-slate-950">Inicia sesión para guardar tu práctica</h2>
        <p class="mt-3 max-w-2xl leading-7 text-slate-700">
          Las sesiones pertenecen a tu cuenta para que tus resultados no se mezclen con los de otras personas.
        </p>
        <div class="mt-6 flex flex-col gap-3 sm:flex-row">
          <a :href="loginUrl" class="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-950 px-5 py-3 font-black text-white hover:bg-blue-700">Iniciar sesión</a>
          <a :href="registerUrl" class="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700 hover:bg-slate-50">Crear cuenta</a>
        </div>
      </div>

      <template v-else-if="user">
        <div v-if="!session" class="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <article class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p class="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Situación</p>
            <p class="mt-3 text-lg leading-8 text-slate-800">{{ scenario.situacion }}</p>

            <div class="mt-7 rounded-2xl bg-blue-50 p-5">
              <p class="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Tu objetivo</p>
              <p class="mt-2 leading-7 text-blue-950">{{ scenario.instrucciones }}</p>
            </div>

            <button
              type="button"
              :disabled="starting"
              class="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-950 px-6 py-3 font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              @click="startPractice"
            >
              {{ starting ? "Preparando práctica..." : "Comenzar práctica por texto" }}
            </button>
          </article>

          <aside class="rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
            <p class="text-sm font-black text-slate-950">Qué mediremos en esta versión</p>
            <ul class="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <li>• Cantidad de palabras.</li>
              <li>• Muletillas escritas detectadas.</li>
              <li>• Repeticiones consecutivas.</li>
              <li>• Puntaje preliminar para comparar intentos.</li>
            </ul>
            <p class="mt-5 text-xs leading-5 text-slate-500">
              Ritmo real, pausas y características acústicas requieren práctica por voz y no se infieren desde texto.
            </p>
          </aside>
        </div>

        <div v-else-if="!isCompleted" class="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
          <aside class="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <p class="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Escenario activo</p>
            <h2 class="mt-2 text-xl font-black text-slate-950">{{ scenario.titulo }}</h2>
            <p class="mt-4 text-sm leading-6 text-slate-700">{{ scenario.situacion }}</p>
            <div class="mt-5 rounded-2xl bg-white p-4 text-sm leading-6 text-slate-700">
              <strong class="block text-slate-950">Objetivo</strong>
              <span>{{ scenario.instrucciones }}</span>
            </div>
          </aside>

          <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p class="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Tu respuesta</p>
                <h2 class="mt-1 text-2xl font-black text-slate-950">Responde como lo harías en la situación real</h2>
              </div>
              <span class="text-sm font-semibold text-slate-500">{{ wordCount }} palabras</span>
            </div>

            <textarea
              v-model="transcript"
              maxlength="5000"
              rows="12"
              autofocus
              placeholder="Escribe aquí lo que dirías..."
              class="mt-6 w-full resize-y rounded-2xl border border-slate-300 bg-white p-4 leading-7 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            ></textarea>
            <div class="mt-2 flex justify-between gap-3 text-xs text-slate-500">
              <span>No busques perfección. Practica una respuesta natural.</span>
              <span>{{ transcript.length }}/5000</span>
            </div>

            <div v-if="error" role="alert" class="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-900">
              {{ error }}
            </div>

            <button
              type="button"
              :disabled="finishing || transcript.trim().length < 3"
              class="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-950 px-6 py-3 font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              @click="finishPractice"
            >
              {{ finishing ? "Analizando..." : "Finalizar y ver resultado" }}
            </button>
          </section>
        </div>

        <section v-else-if="session?.metrica" class="space-y-5">
          <div class="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8">
            <p class="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Práctica guardada</p>
            <div class="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 class="text-3xl font-black text-slate-950">Resultado preliminar</h2>
                <p class="mt-2 text-sm leading-6 text-slate-700">Compara este resultado con tus próximos intentos; no es una evaluación de tu capacidad personal.</p>
              </div>
              <div class="rounded-2xl bg-white px-5 py-3 text-center shadow-sm">
                <span class="block text-xs font-black uppercase tracking-wide text-slate-500">Puntaje</span>
                <strong class="text-4xl font-black text-slate-950">{{ session.metrica.puntajeGeneral ?? "—" }}</strong>
                <span class="text-sm font-bold text-slate-500">/100</span>
              </div>
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <article class="rounded-2xl border border-slate-200 bg-white p-5">
              <p class="text-xs font-black uppercase tracking-wide text-slate-500">Palabras</p>
              <strong class="mt-2 block text-3xl font-black text-slate-950">{{ session.metrica.palabras }}</strong>
            </article>
            <article class="rounded-2xl border border-slate-200 bg-white p-5">
              <p class="text-xs font-black uppercase tracking-wide text-slate-500">Muletillas</p>
              <strong class="mt-2 block text-3xl font-black text-slate-950">{{ session.metrica.muletillasTotal }}</strong>
            </article>
            <article class="rounded-2xl border border-slate-200 bg-white p-5">
              <p class="text-xs font-black uppercase tracking-wide text-slate-500">Repeticiones</p>
              <strong class="mt-2 block text-3xl font-black text-slate-950">{{ session.metrica.repeticiones }}</strong>
            </article>
            <article class="rounded-2xl border border-slate-200 bg-white p-5">
              <p class="text-xs font-black uppercase tracking-wide text-slate-500">Duración</p>
              <strong class="mt-2 block text-3xl font-black text-slate-950">{{ formatDuration(session.duracionMs) }}</strong>
            </article>
          </div>

          <div class="grid gap-5 lg:grid-cols-2">
            <article class="rounded-3xl border border-slate-200 bg-white p-6">
              <h3 class="text-xl font-black text-slate-950">Lo que salió bien</h3>
              <ul class="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                <li v-for="item in session.feedback?.strengths || []" :key="item" class="rounded-xl bg-emerald-50 p-3">{{ item }}</li>
              </ul>
            </article>
            <article class="rounded-3xl border border-slate-200 bg-white p-6">
              <h3 class="text-xl font-black text-slate-950">Para el siguiente intento</h3>
              <ul class="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                <li v-for="item in session.feedback?.suggestions || []" :key="item" class="rounded-xl bg-blue-50 p-3">{{ item }}</li>
              </ul>
            </article>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
            {{ session.feedback?.note }}
          </div>

          <div class="flex flex-col gap-3 sm:flex-row">
            <button type="button" class="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-950 px-5 py-3 font-black text-white hover:bg-blue-700" @click="retryPractice">
              Practicar de nuevo
            </button>
            <a href="/cuenta" class="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700 hover:bg-slate-50">Ver mis prácticas</a>
            <a href="/#escenarios" class="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700 hover:bg-slate-50">Elegir otro escenario</a>
          </div>
        </section>
      </template>
    </template>
  </section>
</template>
