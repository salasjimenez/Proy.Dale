<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ApiError, apiGet, apiPost } from "../../lib/api";
import type { AuthResponse, AuthUser } from "../../types/auth";
import type { PracticeSession, PracticeSessionListResponse } from "../../types/session";

const user = ref<AuthUser | null>(null);
const sessions = ref<PracticeSession[]>([]);
const totalSessions = ref(0);
const loading = ref(true);
const error = ref("");

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

onMounted(async () => {
  try {
    const authResponse = await apiGet<AuthResponse>("/api/auth/me");
    user.value = authResponse.data.user;

    const sessionResponse = await apiGet<PracticeSessionListResponse>("/api/sesiones?limit=5");
    sessions.value = sessionResponse.data;
    totalSessions.value = sessionResponse.meta.total;
  } catch (caught) {
    if (caught instanceof ApiError && caught.status === 401) {
      error.value = "Necesitas iniciar sesión para ver tu cuenta.";
    } else {
      error.value = "No pudimos cargar tu cuenta en este momento.";
    }
  } finally {
    loading.value = false;
  }
});

async function logout() {
  await apiPost<{ message: string }>("/api/auth/logout");
  window.location.assign("/");
}
</script>

<template>
  <section class="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
    <p v-if="loading" class="text-sm font-semibold text-slate-500">Cargando tu cuenta...</p>

    <div v-else-if="user">
      <span class="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-700">Sesión activa</span>
      <h1 class="mt-4 text-3xl font-black tracking-tight text-slate-950">{{ user.nombre || "Mi cuenta" }}</h1>
      <p class="mt-2 text-slate-600">{{ user.email }}</p>

      <div class="mt-8 grid gap-4 sm:grid-cols-2">
        <article class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p class="text-xs font-black uppercase tracking-wide text-slate-500">Prácticas guardadas</p>
          <strong class="mt-2 block text-3xl font-black text-slate-950">{{ totalSessions }}</strong>
          <p class="mt-1 text-sm text-slate-600">Incluye prácticas iniciadas y completadas.</p>
        </article>
        <article class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p class="text-xs font-black uppercase tracking-wide text-slate-500">Modo disponible</p>
          <strong class="mt-2 block text-lg font-black text-slate-950">Texto y voz</strong>
          <p class="mt-1 text-sm text-slate-600">La voz mide ritmo, pausas y muletillas sin guardar el audio.</p>
        </article>
      </div>

      <div class="mt-8">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Actividad reciente</p>
            <h2 class="mt-2 text-2xl font-black text-slate-950">Tus últimas prácticas</h2>
          </div>
          <a href="/#escenarios" class="text-sm font-black text-blue-700 hover:text-blue-900">Elegir escenario</a>
        </div>

        <div v-if="sessions.length === 0" class="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <p class="font-black text-slate-950">Todavía no tienes prácticas guardadas.</p>
          <p class="mt-2 text-sm text-slate-600">Elige un escenario y completa tu primer intento por texto o voz.</p>
        </div>

        <div v-else class="mt-5 space-y-3">
          <article
            v-for="item in sessions"
            :key="item.id"
            class="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">{{ item.modalidad === "TEXTO" ? "Texto" : "Voz" }}</span>
                <span
                  class="rounded-full px-2.5 py-1 text-xs font-black"
                  :class="item.estado === 'COMPLETADA' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'"
                >
                  {{ item.estado === "COMPLETADA" ? "Completada" : "Iniciada" }}
                </span>
              </div>
              <h3 class="mt-2 truncate font-black text-slate-950">{{ item.escenario.titulo }}</h3>
              <p class="mt-1 text-xs text-slate-500">{{ formatDate(item.creadoEn) }}</p>
            </div>
            <div v-if="item.metrica" class="shrink-0 rounded-xl bg-slate-50 px-4 py-2 text-center">
              <span class="block text-[11px] font-black uppercase tracking-wide text-slate-500">Puntaje</span>
              <strong class="text-xl font-black text-slate-950">{{ item.metrica.puntajeGeneral ?? "—" }}</strong>
              <span class="text-xs text-slate-500">/100</span>
            </div>
          </article>
        </div>
      </div>

      <div class="mt-8 flex flex-col gap-3 sm:flex-row">
        <a href="/progreso" class="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-700 px-5 py-3 font-black text-white hover:bg-blue-800">Ver mi progreso</a>
        <a href="/#escenarios" class="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-950 px-5 py-3 font-black text-white hover:bg-blue-700">Practicar otro escenario</a>
        <button type="button" class="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 hover:bg-slate-50" @click="logout">Cerrar sesión</button>
      </div>
    </div>

    <div v-else class="text-center">
      <h1 class="text-2xl font-black text-slate-950">Inicia sesión para continuar</h1>
      <p class="mt-3 text-slate-600">{{ error }}</p>
      <div class="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <a href="/login" class="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-950 px-5 py-3 font-black text-white hover:bg-blue-700">Iniciar sesión</a>
        <a href="/registro" class="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 hover:bg-slate-50">Crear cuenta</a>
      </div>
    </div>
  </section>
</template>
