---
layout: default
title: "AuthNav.vue | Dale"
---

# AuthNav.vue

Navegacion de autenticacion: muestra entrada, registro, cuenta o salida segun la sesion.

**Archivo fuente:** `frontend/src/components/vue/AuthNav.vue`  
**Interfaz:** Sin props ni eventos publicos; utiliza la cookie HttpOnly mediante el cliente API.

## Requisitos y dependencias

- [`frontend/src/lib/api.ts`](../codigo/lib-api.html)
- [`frontend/src/types/auth.ts`](../codigo/types-auth.html)

En Dale se usa Astro + Vue + Tailwind CSS. Los imports relativos del codigo completo suponen la estructura original `frontend/src`; copia tambien las dependencias indicadas o adapta esas rutas a tu proyecto. Para las islas Astro, `client:load` habilita la interaccion en el navegador.

## Ejemplos de uso

### Montaje en el layout global (Astro)

{% raw %}

```astro
---
import AuthNav from "../components/vue/AuthNav.vue";
---

<AuthNav client:load />
```

{% endraw %}

## Codigo fuente completo — v0.16.1

El siguiente bloque reproduce el archivo Vue actual sin omisiones funcionales. Puedes copiarlo sobre `AuthNav.vue`.

{% raw %}

```vue
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
```

{% endraw %}

## Consideraciones

- El estado de sesion se consulta al backend; no se debe intentar leer la cookie HttpOnly con JavaScript.

Consulta [todos los componentes](index.html) y el [codigo auxiliar reutilizable](../codigo/index.html).
