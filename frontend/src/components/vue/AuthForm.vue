<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { ApiError, apiPost } from "../../lib/api";
import type { AuthResponse } from "../../types/auth";

const props = defineProps<{
  mode: "login" | "register";
}>();

const form = reactive({
  nombre: "",
  email: "",
  password: "",
  confirmPassword: "",
});

const submitting = ref(false);
const generalError = ref("");
const fieldErrors = reactive<Record<string, string>>({});

const isRegister = computed(() => props.mode === "register");
const title = computed(() => (isRegister.value ? "Crea tu cuenta" : "Bienvenido de vuelta"));
const subtitle = computed(() =>
  isRegister.value
    ? "Guarda tus prácticas y construye tu progreso paso a paso."
    : "Continúa practicando desde donde lo dejaste.",
);

function resetErrors() {
  generalError.value = "";
  for (const key of Object.keys(fieldErrors)) delete fieldErrors[key];
}

function validateClient(): boolean {
  resetErrors();

  if (isRegister.value && form.nombre.trim() && form.nombre.trim().length < 2) {
    fieldErrors.nombre = "Ingresa al menos 2 caracteres.";
  }

  if (!form.email.trim()) {
    fieldErrors.email = "Ingresa tu correo electrónico.";
  }

  if (form.password.length < 8) {
    fieldErrors.password = "Usa al menos 8 caracteres.";
  }

  if (isRegister.value && form.password !== form.confirmPassword) {
    fieldErrors.confirmPassword = "Las contraseñas no coinciden.";
  }

  return Object.keys(fieldErrors).length === 0;
}

async function submit() {
  if (!validateClient()) return;

  submitting.value = true;
  resetErrors();

  try {
    const endpoint = isRegister.value ? "/api/auth/register" : "/api/auth/login";
    const payload = isRegister.value
      ? {
          nombre: form.nombre.trim() || undefined,
          email: form.email.trim(),
          password: form.password,
        }
      : {
          email: form.email.trim(),
          password: form.password,
        };

    await apiPost<AuthResponse>(endpoint, payload);
    window.location.assign("/cuenta");
  } catch (error) {
    if (error instanceof ApiError) {
      generalError.value = error.message;
      if (error.fields) {
        Object.assign(fieldErrors, error.fields);
      }
    } else {
      generalError.value = "No pudimos conectar con Dale. Intenta nuevamente.";
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section class="mx-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
    <div class="mb-7">
      <span class="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700">
        Cuenta Dale
      </span>
      <h1 class="mt-4 text-3xl font-black tracking-tight text-slate-950">{{ title }}</h1>
      <p class="mt-2 text-sm leading-6 text-slate-600">{{ subtitle }}</p>
    </div>

    <form class="space-y-5" @submit.prevent="submit" novalidate>
      <div v-if="isRegister">
        <label for="nombre" class="mb-2 block text-sm font-bold text-slate-800">Nombre <span class="font-normal text-slate-500">(opcional)</span></label>
        <input
          id="nombre"
          v-model="form.nombre"
          type="text"
          autocomplete="name"
          maxlength="100"
          class="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          :aria-invalid="Boolean(fieldErrors.nombre)"
        />
        <p v-if="fieldErrors.nombre" class="mt-2 text-sm font-semibold text-red-700">{{ fieldErrors.nombre }}</p>
      </div>

      <div>
        <label for="email" class="mb-2 block text-sm font-bold text-slate-800">Correo electrónico</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          autocomplete="email"
          required
          maxlength="254"
          class="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          :aria-invalid="Boolean(fieldErrors.email)"
        />
        <p v-if="fieldErrors.email" class="mt-2 text-sm font-semibold text-red-700">{{ fieldErrors.email }}</p>
      </div>

      <div>
        <label for="password" class="mb-2 block text-sm font-bold text-slate-800">Contraseña</label>
        <input
          id="password"
          v-model="form.password"
          type="password"
          :autocomplete="isRegister ? 'new-password' : 'current-password'"
          required
          class="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          :aria-invalid="Boolean(fieldErrors.password)"
        />
        <p v-if="isRegister" class="mt-2 text-xs leading-5 text-slate-500">Mínimo 8 caracteres, con al menos una letra y un número.</p>
        <p v-if="fieldErrors.password" class="mt-2 text-sm font-semibold text-red-700">{{ fieldErrors.password }}</p>
      </div>

      <div v-if="isRegister">
        <label for="confirmPassword" class="mb-2 block text-sm font-bold text-slate-800">Repite tu contraseña</label>
        <input
          id="confirmPassword"
          v-model="form.confirmPassword"
          type="password"
          autocomplete="new-password"
          required
          class="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          :aria-invalid="Boolean(fieldErrors.confirmPassword)"
        />
        <p v-if="fieldErrors.confirmPassword" class="mt-2 text-sm font-semibold text-red-700">{{ fieldErrors.confirmPassword }}</p>
      </div>

      <div v-if="generalError" role="alert" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
        {{ generalError }}
      </div>

      <button
        type="submit"
        :disabled="submitting"
        class="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-950 px-5 py-3 font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {{ submitting ? "Procesando..." : isRegister ? "Crear cuenta" : "Iniciar sesión" }}
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-slate-600">
      <template v-if="isRegister">
        ¿Ya tienes cuenta?
        <a href="/login" class="font-black text-blue-700 hover:text-blue-900">Inicia sesión</a>
      </template>
      <template v-else>
        ¿Aún no tienes cuenta?
        <a href="/registro" class="font-black text-blue-700 hover:text-blue-900">Regístrate</a>
      </template>
    </p>
  </section>
</template>
