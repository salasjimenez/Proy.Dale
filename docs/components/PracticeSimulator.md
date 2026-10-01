# `PracticeSimulator.vue`

Isla Vue que gestiona una práctica textual completa: autenticación, creación de sesión, captura de respuesta, finalización y visualización de métricas.

## Uso

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import PracticeSimulator from "../components/vue/PracticeSimulator.vue";
---

<BaseLayout title="Practicar | Dale">
  <section class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
    <PracticeSimulator client:load />
  </section>
</BaseLayout>
```

El componente obtiene el escenario desde el query string:

```text
/practicar?escenario=entrevista-trabajo-basico
```

No recibe credenciales ni URL del backend como propiedades. Toda comunicación utiliza `src/lib/api.ts`, que a su vez toma `PUBLIC_API_URL` del entorno.

## Dependencias de API

```text
GET  /api/auth/me
GET  /api/escenarios/:slug
POST /api/sesiones
POST /api/sesiones/:id/completar
```

## Estados cubiertos

- carga inicial;
- escenario inexistente;
- usuario no autenticado;
- sesión lista para iniciar;
- práctica en curso;
- error de guardado;
- resultado completado.

## Consideraciones

El puntaje mostrado en la versión `0.7.0` se etiqueta como preliminar porque se basa en texto. No representa ritmo, pausas, prosodia ni otras propiedades de voz.
