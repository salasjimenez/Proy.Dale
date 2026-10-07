---
layout: default
title: "Modelo de datos — Etapa 2"
---

# Modelo de datos — Etapa 2

Dale usa PostgreSQL a través de Prisma ORM. El frontend nunca accede directamente a la base de datos.

## Entidades

### usuarios
Almacena la identidad mínima necesaria para autenticación. La contraseña se persistirá únicamente como hash en `password_hash`.

### escenarios
Catálogo de situaciones de práctica. Cada escenario tiene categoría, nivel de dificultad, estado activo y orden de presentación.

### sesiones
Representa una práctica realizada por un usuario en un escenario. Conserva modalidad, estado, transcripción y duración.

### metricas
Una sesión puede tener como máximo un registro agregado de métricas. Incluye ritmo, pausas, muletillas, repeticiones y puntajes derivados.

## Relaciones

- Un usuario tiene muchas sesiones.
- Un escenario tiene muchas sesiones.
- Una sesión pertenece a un usuario y a un escenario.
- Una sesión tiene cero o una métrica agregada.

## Seguridad y privacidad

- `schema.prisma` no contiene credenciales.
- `DATABASE_URL` se obtiene exclusivamente de `backend/.env` o del gestor de secretos del entorno.
- El audio no forma parte del modelo de datos inicial.
- La transcripción se guarda en la sesión solo cuando la lógica de aplicación decida persistirla.
