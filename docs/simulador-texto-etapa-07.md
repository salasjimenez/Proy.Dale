# Etapa 7 — simulador por texto

La versión `0.7.0` incorpora la primera práctica completa y persistente de Dale.

## Alcance

El usuario autenticado puede elegir un escenario, iniciar una sesión de modalidad `TEXTO`, escribir lo que diría en esa situación y finalizar el intento. El backend guarda la transcripción y genera métricas básicas para comparar prácticas posteriores.

## Endpoints

### `GET /api/sesiones/status`

Expone la disponibilidad de modalidades. En esta versión `TEXTO` está habilitado y `VOZ` permanece pendiente.

### `POST /api/sesiones`

Requiere autenticación.

```json
{
  "escenarioSlug": "entrevista-trabajo-basico",
  "modalidad": "TEXTO"
}
```

Crea una fila en `sesiones` con estado `INICIADA`.

### `POST /api/sesiones/:id/completar`

Requiere que la sesión pertenezca al usuario autenticado.

```json
{
  "transcripcion": "Buenos días. Gracias por la oportunidad...",
  "duracionMs": 45000
}
```

Actualiza la sesión a `COMPLETADA` y crea o actualiza su registro en `metricas`.

### `GET /api/sesiones?limit=5`

Devuelve las prácticas del usuario actual, ordenadas de la más reciente a la más antigua.

### `GET /api/sesiones/:id`

Devuelve una práctica concreta únicamente si pertenece al usuario autenticado.

## Métricas de texto

En esta versión se calculan:

- cantidad de palabras;
- muletillas escritas de una lista explícita;
- repeticiones consecutivas de palabras;
- puntaje de muletillas;
- puntaje general preliminar.

No se calculan `palabrasPorMinuto`, `puntajeRitmo`, `puntajePausas` ni métricas acústicas desde texto. Esas métricas requieren una fuente de voz y no deben inferirse artificialmente.

## Seguridad y consistencia

- Todas las rutas de sesiones, salvo `/status`, exigen autenticación.
- Una sesión solo puede ser consultada y finalizada por su propietario.
- Solo se puede completar una sesión que siga en estado `INICIADA`.
- La transcripción está limitada a 5000 caracteres.
- El modo `VOZ` es rechazado en esta versión con un error explícito.
- No se almacena audio.

## Frontend

La página `/practicar?escenario=<slug>` contiene la isla Vue `PracticeSimulator.vue`.

Flujo:

1. cargar escenario;
2. comprobar sesión autenticada;
3. crear una sesión de práctica;
4. escribir la respuesta;
5. finalizar y persistir;
6. mostrar métricas y retroalimentación;
7. permitir un nuevo intento o consultar la actividad reciente desde `/cuenta`.
