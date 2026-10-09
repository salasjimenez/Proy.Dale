<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ApiError, apiDelete, apiGet, apiPost } from "../../lib/api";
import type { AuthResponse, AuthUser } from "../../types/auth";
import type { PracticeSession, PracticeSessionListResponse } from "../../types/session";

const user = ref<AuthUser | null>(null);
const sessions = ref<PracticeSession[]>([]);
const totalSessions = ref(0);
const loading = ref(true);
const error = ref("");
const notice = ref("");
const deletingSessionId = ref<string | null>(null);
const deletingAll = ref(false);
const exportingData = ref(false);
const deletingAccount = ref(false);
const deleteAccountPassword = ref("");
const acknowledgeAccountDeletion = ref(false);

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function clearMessages(): void {
  error.value = "";
  notice.value = "";
}

async function loadAccount(): Promise<void> {
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
}

onMounted(() => void loadAccount());

async function logout(): Promise<void> {
  await apiPost<{ message: string }>("/api/auth/logout");
  window.location.assign("/");
}

async function exportMyData(): Promise<void> {
  clearMessages();
  exportingData.value = true;

  try {
    const payload = await apiGet<unknown>("/api/auth/export");
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    anchor.href = url;
    anchor.download = `dale-mis-datos-${date}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    notice.value = "Preparamos una copia JSON con los datos que Dale conserva de tu cuenta.";
  } catch (caught) {
    error.value = caught instanceof ApiError ? caught.message : "No pudimos preparar la exportación.";
  } finally {
    exportingData.value = false;
  }
}

async function deleteSession(item: PracticeSession): Promise<void> {
  clearMessages();
  const confirmed = window.confirm(
    `¿Eliminar la práctica “${item.escenario.titulo}”? Esta acción no se puede deshacer.`,
  );
  if (!confirmed) return;

  deletingSessionId.value = item.id;
  try {
    await apiDelete<{ message: string }>(`/api/sesiones/${item.id}`);
    sessions.value = sessions.value.filter((session) => session.id !== item.id);
    totalSessions.value = Math.max(0, totalSessions.value - 1);
    notice.value = "La práctica fue eliminada junto con sus métricas.";
  } catch (caught) {
    error.value = caught instanceof ApiError ? caught.message : "No pudimos eliminar la práctica.";
  } finally {
    deletingSessionId.value = null;
  }
}

async function deleteAllSessions(): Promise<void> {
  clearMessages();
  if (totalSessions.value === 0) return;

  const confirmed = window.confirm(
    `¿Eliminar tus ${totalSessions.value} prácticas guardadas? Se borrarán también sus transcripciones y métricas.`,
  );
  if (!confirmed) return;

  deletingAll.value = true;
  try {
    const response = await apiDelete<{ data: { deletedCount: number } }>("/api/sesiones");
    sessions.value = [];
    totalSessions.value = 0;
    notice.value = `Se eliminaron ${response.data.deletedCount} prácticas de tu cuenta.`;
  } catch (caught) {
    error.value = caught instanceof ApiError ? caught.message : "No pudimos eliminar tus prácticas.";
  } finally {
    deletingAll.value = false;
  }
}

async function deleteAccount(): Promise<void> {
  clearMessages();

  if (!acknowledgeAccountDeletion.value) {
    error.value = "Confirma que entiendes que la eliminación de la cuenta es permanente.";
    return;
  }

  if (!deleteAccountPassword.value) {
    error.value = "Ingresa tu contraseña actual para confirmar la eliminación de la cuenta.";
    return;
  }

  const confirmed = window.confirm(
    "¿Eliminar definitivamente tu cuenta de Dale? Se borrarán también todas tus prácticas y métricas.",
  );
  if (!confirmed) return;

  deletingAccount.value = true;
  try {
    await apiDelete<{ message: string }>("/api/auth/me", {
      password: deleteAccountPassword.value,
    });
    window.location.assign("/?cuenta=eliminada");
  } catch (caught) {
    error.value = caught instanceof ApiError ? caught.message : "No pudimos eliminar la cuenta.";
  } finally {
    deletingAccount.value = false;
  }
}
</script>

<template>
  <section class="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
    <p v-if="loading" class="text-sm font-semibold text-slate-500">Cargando tu cuenta...</p>

    <div v-else-if="user">
      <span class="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-700">Sesión activa</span>
      <h1 class="mt-4 text-3xl font-black tracking-tight text-slate-950">{{ user.nombre || "Mi cuenta" }}</h1>
      <p class="mt-2 text-slate-600">{{ user.email }}</p>

      <div aria-live="polite" class="mt-5">
        <p v-if="notice" class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">{{ notice }}</p>
        <p v-if="error" role="alert" class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-900">{{ error }}</p>
      </div>

      <div class="mt-8 grid gap-4 sm:grid-cols-2">
        <article class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p class="text-xs font-black uppercase tracking-wide text-slate-500">Prácticas guardadas</p>
          <strong class="mt-2 block text-3xl font-black text-slate-950">{{ totalSessions }}</strong>
          <p class="mt-1 text-sm text-slate-600">Incluye prácticas iniciadas y completadas.</p>
        </article>
        <article class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p class="text-xs font-black uppercase tracking-wide text-slate-500">Control de datos</p>
          <strong class="mt-2 block text-lg font-black text-slate-950">Exportar y eliminar</strong>
          <p class="mt-1 text-sm text-slate-600">Puedes descargar o borrar tus datos desde esta misma cuenta.</p>
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
            <div class="flex shrink-0 items-center gap-2">
              <div v-if="item.metrica" class="rounded-xl bg-slate-50 px-4 py-2 text-center">
                <span class="block text-[11px] font-black uppercase tracking-wide text-slate-500">Puntaje</span>
                <strong class="text-xl font-black text-slate-950">{{ item.metrica.puntajeGeneral ?? "—" }}</strong>
                <span class="text-xs text-slate-500">/100</span>
              </div>
              <button
                type="button"
                :disabled="deletingSessionId === item.id"
                class="inline-flex min-h-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-800 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                @click="deleteSession(item)"
              >
                {{ deletingSessionId === item.id ? "Eliminando..." : "Eliminar" }}
              </button>
            </div>
          </article>
        </div>
      </div>

      <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <a href="/progreso" class="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-700 px-5 py-3 font-black text-white hover:bg-blue-800">Ver mi progreso</a>
        <a href="/mapa" class="inline-flex min-h-12 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 font-black text-blue-800 hover:bg-blue-100">Ver mapa de escenarios</a>
        <a href="/#escenarios" class="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-950 px-5 py-3 font-black text-white hover:bg-blue-700">Practicar otro escenario</a>
        <button type="button" class="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 hover:bg-slate-50" @click="logout">Cerrar sesión</button>
      </div>

      <section class="mt-10 rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-6" aria-labelledby="data-controls-title">
        <p class="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Privacidad</p>
        <h2 id="data-controls-title" class="mt-2 text-2xl font-black text-slate-950">Tus datos son tuyos</h2>
        <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Descarga una copia de la información asociada a tu cuenta o elimina tus prácticas cuando ya no quieras conservarlas.
        </p>

        <div class="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            :disabled="exportingData"
            class="inline-flex min-h-12 items-center justify-center rounded-xl border border-blue-200 bg-white px-5 py-3 font-black text-blue-800 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            @click="exportMyData"
          >
            {{ exportingData ? "Preparando..." : "Descargar mis datos (.json)" }}
          </button>
          <button
            type="button"
            :disabled="deletingAll || totalSessions === 0"
            class="inline-flex min-h-12 items-center justify-center rounded-xl border border-rose-200 bg-white px-5 py-3 font-black text-rose-800 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
            @click="deleteAllSessions"
          >
            {{ deletingAll ? "Eliminando..." : "Eliminar todas mis prácticas" }}
          </button>
        </div>
      </section>

      <section class="mt-6 rounded-3xl border border-rose-200 bg-rose-50 p-5 sm:p-6" aria-labelledby="delete-account-title">
        <p class="text-xs font-black uppercase tracking-[0.16em] text-rose-700">Zona sensible</p>
        <h2 id="delete-account-title" class="mt-2 text-2xl font-black text-slate-950">Eliminar mi cuenta</h2>
        <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
          Esta acción elimina tu usuario y, por relación en la base de datos, todas tus sesiones, transcripciones y métricas. No se puede deshacer.
        </p>

        <div class="mt-5 max-w-md">
          <label for="deleteAccountPassword" class="block text-sm font-black text-slate-900">Contraseña actual</label>
          <input
            id="deleteAccountPassword"
            v-model="deleteAccountPassword"
            type="password"
            autocomplete="current-password"
            class="mt-2 min-h-12 w-full rounded-xl border border-rose-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
          />

          <label class="mt-4 flex items-start gap-3 text-sm leading-6 text-slate-700">
            <input v-model="acknowledgeAccountDeletion" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300" />
            <span>Entiendo que la eliminación es permanente y que perderé mi historial y métricas.</span>
          </label>

          <button
            type="button"
            :disabled="deletingAccount || !acknowledgeAccountDeletion || !deleteAccountPassword"
            class="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-rose-700 px-5 py-3 font-black text-white hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            @click="deleteAccount"
          >
            {{ deletingAccount ? "Eliminando cuenta..." : "Eliminar mi cuenta definitivamente" }}
          </button>
        </div>
      </section>
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
