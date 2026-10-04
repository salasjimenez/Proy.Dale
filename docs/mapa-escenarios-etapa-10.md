# Etapa 10 — Mapa de escenarios

La versión `0.10.0` incorpora el segundo dashboard requerido por Dale: **Mapa de escenarios**.

## Objetivo

Mostrar, para el usuario autenticado, el promedio de su `puntaje_general` en las cuatro categorías del catálogo:

- Laboral.
- Trámites y calle.
- Social.
- Jóvenes y estudiantes.

El dashboard utiliza únicamente sesiones `COMPLETADA` con métricas persistidas. Una categoría sin intentos se devuelve con `puntajePromedio: null`; no se interpreta como un puntaje de cero.

## API

### Estado

```http
GET /api/mapa/status
```

### Mapa personal

```http
GET /api/mapa?modalidad=TODAS
```

La ruta está protegida por autenticación. El parámetro `modalidad` acepta:

- `TODAS`
- `VOZ`
- `TEXTO`

La respuesta incluye un resumen y las cuatro categorías, incluso cuando alguna todavía no tiene datos.

## Métricas del dashboard

Por categoría se devuelve:

- puntaje promedio;
- cantidad de intentos;
- último puntaje;
- mejor puntaje;
- cantidad de niveles practicados;
- fecha de última práctica.

El resumen calcula:

- cobertura de categorías;
- promedio global de categorías con datos;
- fortaleza actual;
- área de menor promedio cuando existen al menos dos categorías con evidencia;
- una categoría sugerida para la siguiente práctica.

## Radar

`ScenarioMapDashboard.vue` dibuja el radar con SVG nativo. No se agregó una librería de gráficos.

Las categorías sin datos se ubican visualmente en el centro solo para poder dibujar el sistema de ejes. La interfaz marca explícitamente `Sin datos` para evitar interpretar esa posición como un desempeño de `0/100`.

## Privacidad y alcance

El mapa se calcula sobre las mismas métricas ya almacenadas por las sesiones de Dale. No agrega captura de audio, biometría ni inferencias emocionales.
