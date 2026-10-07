---
layout: default
title: "Etapa 8 — Simulador por voz"
---

# Etapa 8 — Simulador por voz

Versión: `0.8.0`

## Objetivo

Añadir práctica por micrófono sin introducir servicios de pago ni almacenar archivos de audio. La sesión de voz usa Web Speech API para la transcripción y Web Audio API para estimar pausas mediante actividad del micrófono.

## Flujo

```text
Usuario autenticado
  -> selecciona VOZ
  -> el navegador solicita permiso de micrófono
  -> POST /api/sesiones (modalidad VOZ)
  -> VoiceCapture inicia Web Speech + Web Audio
  -> transcripción en vivo + marcas de silencio
  -> POST /api/sesiones/:id/completar
  -> backend valida y calcula métricas
  -> PostgreSQL guarda sesión + métricas
```

## Datos enviados al backend

```json
{
  "transcripcion": "Texto reconocido por el navegador",
  "duracionMs": 42000,
  "pausasDetalle": [
    { "inicioMs": 9300, "duracionMs": 850 },
    { "inicioMs": 21800, "duracionMs": 1200 }
  ]
}
```

No se envía un blob, archivo ni base64 de audio.

## Métricas calculadas

- palabras;
- palabras por minuto;
- número de pausas de al menos 600 ms;
- duración total de pausas;
- pausa promedio;
- pausa máxima;
- muletillas detectadas sobre la transcripción;
- repeticiones consecutivas;
- puntaje de ritmo;
- puntaje de pausas;
- puntaje de muletillas;
- puntaje general.

Los rangos utilizados son heurísticos para comparación personal entre intentos, no diagnósticos ni evaluaciones clínicas. El ritmo obtiene su mejor puntuación dentro de un rango conversacional aproximado de 105–165 palabras por minuto. Las pausas se estiman por amplitud del micrófono, por lo que ruido, distancia al micrófono y cancelación de ruido pueden afectar el resultado.

## Compatibilidad

La práctica por voz requiere:

- `navigator.mediaDevices.getUserMedia`;
- `SpeechRecognition` o `webkitSpeechRecognition`;
- Web Audio API;
- permiso de micrófono.

Chrome y Edge actuales son el objetivo inicial. Cuando Web Speech no existe, Dale mantiene disponible el modo texto y no intenta simular métricas de voz.

## Privacidad

Dale no almacena audio. Solo persiste transcripción y métricas. Web Speech API es una capacidad del navegador y su implementación puede usar infraestructura del proveedor del navegador; por ello la interfaz informa explícitamente esta limitación.

## Base de datos

No se necesita migración en `v0.8.0`: `metricas` ya incluía desde el esquema inicial los campos de ritmo, pausas y detalles JSON necesarios para esta etapa.
