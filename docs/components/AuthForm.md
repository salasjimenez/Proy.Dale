---
layout: default
title: "AuthForm.vue"
---

{% raw %}


# AuthForm.vue

Formulario reutilizable para registro e inicio de sesión. El modo se controla con la propiedad `mode`.

## Registro

```astro
---
import AuthForm from "../components/vue/AuthForm.vue";
---

<AuthForm client:load mode="register" />
```

## Inicio de sesión

```astro
---
import AuthForm from "../components/vue/AuthForm.vue";
---

<AuthForm client:load mode="login" />
```

## Componente completo

```vue
<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { ApiError, apiPost } from "../../lib/api";
import type { AuthResponse } from "../../types/auth";

const props = defineProps<{ mode: "login" | "register" }>();
const form = reactive({ nombre: "", email: "", password: "", confirmPassword: "" });
const submitting = ref(false);
const generalError = ref("");
const fieldErrors = reactive<Record<string, string>>({});
const isRegister = computed(() => props.mode === "register");

async function submit() {
  submitting.value = true;
  generalError.value = "";

  try {
    const endpoint = isRegister.value ? "/api/auth/register" : "/api/auth/login";
    const payload = isRegister.value
      ? { nombre: form.nombre.trim() || undefined, email: form.email.trim(), password: form.password }
      : { email: form.email.trim(), password: form.password };

    await apiPost<AuthResponse>(endpoint, payload);
    window.location.assign("/cuenta");
  } catch (error) {
    if (error instanceof ApiError) {
      generalError.value = error.message;
      if (error.fields) Object.assign(fieldErrors, error.fields);
    } else {
      generalError.value = "No pudimos conectar con Dale. Intenta nuevamente.";
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <form @submit.prevent="submit">
    <input v-if="isRegister" v-model="form.nombre" type="text" autocomplete="name" />
    <input v-model="form.email" type="email" autocomplete="email" required />
    <input v-model="form.password" type="password" required />
    <input v-if="isRegister" v-model="form.confirmPassword" type="password" />
    <p v-if="generalError">{{ generalError }}</p>
    <button type="submit" :disabled="submitting">
      {{ isRegister ? "Crear cuenta" : "Iniciar sesión" }}
    </button>
  </form>
</template>
```

La implementación real incluye validación de cliente, mensajes por campo, estados de carga y estilos responsive.

{% endraw %}
