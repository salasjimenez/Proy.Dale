# Etapa 4 - Catálogo de escenarios

La versión `v0.4.0` convierte el módulo `escenarios` en el primer módulo de negocio funcional de Dale.

## Datos iniciales

El seed incorpora 12 situaciones base, distribuidas en cuatro categorías. Cada situación tiene tres niveles de dificultad, para un total de 36 registros activos:

- Laboral: entrevista de trabajo, pedir un aumento, hablar con la jefatura.
- Trámites y calle: hacer un reclamo, pedir información, resolver un cobro incorrecto.
- Social: iniciar una conversación, expresar desacuerdo, pedir ayuda.
- Jóvenes y estudiantes: exposición en clase, hablar con un profesor, entrevista para una beca.

Los niveles son `BASICO`, `INTERMEDIO` y `DIFICIL`.

El seed es idempotente: usa `upsert` por `slug`, por lo que puede ejecutarse varias veces sin duplicar escenarios.

## Endpoints

### `GET /api/escenarios`

Lista escenarios activos. Soporta filtros opcionales:

- `categoria`: `LABORAL`, `TRAMITES_CALLE`, `SOCIAL`, `JOVENES_ESTUDIANTES`.
- `nivel`: `BASICO`, `INTERMEDIO`, `DIFICIL`.
- `q`: búsqueda por título, descripción o situación, máximo 100 caracteres.

Ejemplo:

```bash
curl "http://localhost:3000/api/escenarios?categoria=LABORAL&nivel=BASICO"
```

### `GET /api/escenarios/categorias`

Devuelve las cuatro categorías, sus nombres legibles y la cantidad de escenarios disponibles por nivel.

### `GET /api/escenarios/:slug`

Devuelve un escenario activo por su `slug`.

Ejemplo:

```bash
curl http://localhost:3000/api/escenarios/entrevista-trabajo-basico
```

### `GET /api/escenarios/status`

Confirma que el módulo está implementado y devuelve el total de escenarios activos.

## Puertos locales

El puerto PostgreSQL del host se controla con `POSTGRES_PORT`. El ejemplo usa `5433` para evitar colisiones con PostgreSQL instalado directamente en Windows. El contenedor continúa escuchando internamente en `5432`.
