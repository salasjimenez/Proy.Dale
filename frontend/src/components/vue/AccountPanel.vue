<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ApiError, apiGet, apiPost } from "../../lib/api";
import type { AuthResponse, AuthUser } from "../../types/auth";

const user = ref<AuthUser | null>(null);
const loading = ref(true);
const error = ref("");

onMounted(async () => {
  try {
    const response = await apiGet<AuthResponse>("/api/auth/me");
    user.value = response.data.user;
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
  <section class="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
    <p v-if="loading" class="text-sm font-semibold text-slate-500">Cargando tu cuenta...</p>

    <div v-else-if="user">
      <span class="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-700">Sesión activa</span>
      <h1 class="mt-4 text-3xl font-black tracking-tight text-slate-950">{{ user.nombre || "Mi cuenta" }}</h1>
      <p class="mt-2 text-slate-600">{{ user.email }}</p>

      <div class="mt-8 grid gap-4 sm:grid-cols-2">
        <article class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p class="text-xs font-black uppercase tracking-wide text-slate-500">Prácticas guardadas</p>
          <strong class="mt-2 block text-3xl font-black text-slate-950">0</strong>
          <p class="mt-1 text-sm text-slate-600">Se habilitarán al implementar el simulador.</p>
        </article>
        <article class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p class="text-xs font-black uppercase tracking-wide text-slate-500">Progreso</p>
          <strong class="mt-2 block text-lg font-black text-slate-950">Próxima etapa</strong>
          <p class="mt-1 text-sm text-slate-600">Tus métricas aparecerán aquí después de practicar.</p>
        </article>
      </div>

      <div class="mt-8 flex flex-col gap-3 sm:flex-row">
        <a href="/#escenarios" class="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-950 px-5 py-3 font-black text-white hover:bg-blue-700">Elegir escenario</a>
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
