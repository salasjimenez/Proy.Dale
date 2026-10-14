---
layout: default
title: "Codigo auxiliar | Dale"
---

# Codigo auxiliar para componentes Vue

Archivos TypeScript que utilizan los componentes. Su contenido se sincroniza directamente con `frontend/src`, para que los ejemplos copiables no queden obsoletos.

- [`frontend/src/lib/accessibility.ts`](lib-accessibility.html)
- [`frontend/src/lib/api.ts`](lib-api.html)
- [`frontend/src/lib/legal.ts`](lib-legal.html)
- [`frontend/src/lib/scenarioVisuals.ts`](lib-scenarioVisuals.html)
- [`frontend/src/lib/sequence.ts`](lib-sequence.html)
- [`frontend/src/lib/training.ts`](lib-training.html)
- [`frontend/src/types/auth.ts`](types-auth.html)
- [`frontend/src/types/map.ts`](types-map.html)
- [`frontend/src/types/progress.ts`](types-progress.html)
- [`frontend/src/types/scenario.ts`](types-scenario.html)
- [`frontend/src/types/session.ts`](types-session.html)

Los archivos de tipos describen las estructuras reales; el cliente `lib/api.ts` trabaja con `PUBLIC_API_URL` y credenciales de sesion mediante cookies. **Nunca incluyas secretos ni archivos `.env` en la documentacion.**

[Volver a componentes Vue](../components/index.html).
