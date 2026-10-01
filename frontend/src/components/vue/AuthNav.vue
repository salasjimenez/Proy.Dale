<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ApiError, apiGet, apiPost } from "../../lib/api";
import type { AuthResponse, AuthUser } from "../../types/auth";

const user = ref<AuthUser | null>(null);
const loading = ref(true);
const loggingOut = ref(false);

onMounted(async () => {
  try {
    const response = await apiGet<AuthResponse>("/api/auth/me");
    user.value = response.data.user;
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 401)) {
      console.error(error);
    }
  } finally {
    loading.value = false;
  }
});

async function logout() {
  loggingOut.value = true;
  try {
    await apiPost<{ message: string }>("/api/auth/logout");
    user.value = null;
    window.location.assign("/");
  } finally {
    loggingOut.value = false;
  }
}
</script>

<template>
  <div class="flex items-center gap-2" aria-live="polite">
    <span v-if="loading" class="hidden text-xs font-semibold text-slate-400 sm:inline">Verificando...</span>

    <template v-else-if="user">
      <a href="/cuenta" class="hidden rounded-lg px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 sm:inline-flex">
        {{ user.nombre || "Mi cuenta" }}
      </a>
      <button
        type="button"
        :disabled="loggingOut"
        class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        @click="logout"
      >
        Salir
      </button>
    </template>

    <template v-else>
      <a href="/login" class="rounded-lg px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100">Entrar</a>
      <a href="/registro" class="hidden rounded-lg bg-slate-950 px-3 py-2 text-sm font-black text-white transition hover:bg-blue-700 sm:inline-flex">Crear cuenta</a>
    </template>
  </div>
</template>
