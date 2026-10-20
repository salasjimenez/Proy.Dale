---
layout: default
title: "QA y preproducción P2 | Dale"
---

# Dale v0.16.4-P2 — Correcciones QA antes de producción

Documento de trazabilidad sobre el informe **Informe_QA_Proyecto_Dale v0.16.4** (9 páginas). No modifica la base de datos ni activa Vercel.

## Correcciones implementadas

| Hallazgo | Cambio | Cómo comprobar |
| --- | --- | --- |
| QA-CRIT-001 / pruebas locales | Setup temporal de Vitest antes de cargar módulos; Prisma Client se genera con `pretest`. Los secretos de producción continúan obligatorios. | `npm run test --workspace=backend` desde entorno limpio |
| QA-HIGH-001 / dependencias | Añadido el bloqueo `security:audit`; **no se actualizan versiones sin resolver compatibilidad y lockfile**. La auditoría real sigue pendiente. | `npm run security:audit` con red |
| QA-MED-001 | Selector de variante regional de español por práctica; automático según navegador, sin persistencia de preferencias. | Chrome/Edge, opción de idioma del micrófono |
| QA-MED-002 | Aviso en voz sobre compatibilidad; texto como alternativa accesible. | Firefox / Safari y Chrome / Edge |
| QA-MED-003 | Preflight bloquea declaración de múltiples réplicas mientras el rate limiting siga en memoria. **Requiere Redis o protección equivalente** para escalado. | `DALE_BACKEND_REPLICAS=2 npm run production:check` |
| QA-LOW-001 | `fetch` fallido se transforma en error `NETWORK_UNAVAILABLE`; se respetan cancelaciones `AbortError`. | Apagar el backend y probar catálogo / login |
| QA-LOW-002 | Se documenta revisión legal obligatoria, sin declarar que ya se completó. | Aprobación jurídica independiente |
| QA móvil, captura 1 | Cabecera compacta en una sola fila. | 320–480 px, zoom 200 % |
| QA móvil, captura 2 | Footer en rejilla alineada en pantallas pequeñas. | Enlace Creador / Cookies / Analítica |
| QA móvil, captura 3 | Panel del menú visible y accesible; se mantiene cierre con Escape y exterior. | Abrir Menú, navegar y cambiar orientación |
| Seguridad adicional | Middleware de origen confiable para mutaciones y pruebas de 403; no sustituye medidas integrales de CSRF. | `backend/tests/origin-guard.routes.test.ts` |

## Pasos de verificación

1. `npm ci` y `npm run prisma:generate --workspace=backend`.
2. `npm run docs:sync && npm run qa:p2 && npm run check`.
3. `npm run security:audit`: bloquear publicación si quedan vulnerabilidades críticas o altas aplicables sin mitigación.
4. Revisar login, registro, recuperación de conexión, simulación de voz, indicadores, exportación/borrado de datos y cierre de sesión.
5. Ejecutar `npm run production:check` **en un entorno de preproducción con variables reales**, sin imprimir sus valores.
6. Validar en preview HTTPS las cookies con el dominio real del backend, CORS y permisos de micrófono.
7. Verificar backups, restauración, responsable de los datos, retención y condiciones legales.

## Límites conocidos y bloqueos

- El informe QA identifica Express 4, pero el `backend/package.json` actual declara Express 5.1.0. Las dependencias del reporte QA se deben reevaluar con una auditoría actual; el parche **no certifica vulnerabilidades solucionadas**. Evitar `npm audit fix --force` sin ensayos y revisión de cambios.
- No hay almacén distribuido para el rate limiting. Antes de desplegar varias réplicas, añadir Redis u otra política centralizada.
- Las pruebas de contrato y un HTTP 200 no equivalen a pruebas E2E, auditoría de seguridad ni validación WCAG formal.
- Los servicios externos de reconocimiento Web Speech pueden recibir audio conforme a la política del navegador; Dale no almacena el archivo de audio, pero sí puede guardar transcripción y métricas.
- La revisión de las páginas legales y política de backups es obligatoria antes del registro abierto al público.
- Vercel debe tener configurada la URL pública de API (HTTPS); no usar localhost ni confiar en que `npm run build` valide automáticamente el acceso a PostgreSQL. `production:check` identifica algunos cruces de sitio con cookies `SameSite=Lax` y los bloquea; no equivale a validar la cookie en un navegador real.
